"""
Jobs routes: list, get detail, open PDF, start/cancel pipeline, live progress.
GUI owns its own jobs index (jobs.json) — separate from the CLI's temp/ workspace
scanning, since GUI-created jobs are tracked independently going forward.
"""

import os
import sys
import uuid
import json
import platform
import asyncio
import subprocess as sp
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_jobs_index_path():
    app_data = os.environ.get("APPDATA", str(Path.home()))
    jobs_dir = Path(app_data) / "LectureScribe"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    return jobs_dir / "jobs.json"


def load_jobs():
    path = get_jobs_index_path()
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def save_jobs(jobs):
    path = get_jobs_index_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)


def _update_job_status(job_id, updates):
    jobs = load_jobs()
    for j in jobs:
        if j["id"] == job_id:
            j.update(updates)
    save_jobs(jobs)


@router.get("")
def list_jobs():
    jobs = load_jobs()
    return sorted(jobs, key=lambda j: j.get("created_at", ""), reverse=True)


@router.get("/{job_id}")
def get_job(job_id: str):
    jobs = load_jobs()
    job = next((j for j in jobs if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


class OpenPdfRequest(BaseModel):
    pdf_path: str


@router.post("/open-pdf")
def open_pdf(payload: OpenPdfRequest):
    pdf_path = payload.pdf_path
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    try:
        if platform.system() == "Windows":
            os.startfile(pdf_path)
        elif platform.system() == "Darwin":
            sp.run(["open", pdf_path])
        else:
            sp.run(["xdg-open", pdf_path])
        return {"opened": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not open PDF: {str(e)}")


@router.post("/dev-seed")
def dev_seed_job():
    """
    DEV ONLY — creates a fake job entry to test Home/JobCard rendering.
    Remove before v1 release.
    """
    jobs = load_jobs()
    fake_job = {
        "id": str(uuid.uuid4()),
        "title": "Introduction to Fluid Mechanics",
        "status": "done",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "pdf_path": "",
    }
    jobs.append(fake_job)
    save_jobs(jobs)
    return fake_job


class NewJobRequest(BaseModel):
    folder_path: str | None = None
    url: str | None = None
    title: str | None = None


@router.post("/new")
def create_job(payload: NewJobRequest):
    if payload.folder_path:
        folder = Path(payload.folder_path)

        if not folder.exists() or not folder.is_dir():
            raise HTTPException(status_code=400, detail="Folder does not exist or is not a directory")

        video_extensions = {".mp4", ".mkv", ".mov", ".avi", ".webm"}
        has_video = any(f.suffix.lower() in video_extensions for f in folder.iterdir() if f.is_file())

        if not has_video:
            raise HTTPException(status_code=400, detail="No video files found in this folder")

        source_type = "folder"
        source_path = str(folder)
        title = payload.title or folder.name

    elif payload.url:
        url = payload.url.strip()
        if not url.startswith("http"):
            raise HTTPException(status_code=400, detail="Please enter a valid URL")

        # Detect playlist vs single video using the CLI's own detection logic
        import sys as _sys
        cli_root = Path(__file__).parent.parent.parent / "backend"
        if str(cli_root) not in _sys.path:
            _sys.path.insert(0, str(cli_root))
        import playlist_manager

        source_type = "playlist" if playlist_manager.is_playlist(url) else "url"
        source_path = url
        title = payload.title or ("Playlist" if source_type == "playlist" else "Video")

    else:
        raise HTTPException(status_code=400, detail="Provide either a folder_path or a url")

    jobs = load_jobs()
    job_id = str(uuid.uuid4())

    new_job = {
        "id": job_id,
        "title": title,
        "status": "queued",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source_type": source_type,
        "source_path": source_path,
        "pdf_path": "",
    }

    jobs.append(new_job)
    save_jobs(jobs)
    return new_job


# Track running subprocess handles per job_id so we can cancel them
running_processes = {}


@router.post("/{job_id}/start")
def start_job(job_id: str):
    jobs = load_jobs()
    job = next((j for j in jobs if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") == "processing":
        raise HTTPException(status_code=400, detail="Job is already processing")
    if job.get("status") == "done":
        raise HTTPException(status_code=400, detail="Job has already completed")

    runner_script = Path(__file__).parent.parent / "run_job.py"

    proc = sp.Popen(
        [sys.executable, str(runner_script), job_id, job["source_path"], job["title"], job.get("source_type", "folder")],
        cwd=str(Path(__file__).parent.parent),
    )
    running_processes[job_id] = proc

    return {"started": True, "job_id": job_id}


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    proc = running_processes.get(job_id)
    if not proc:
        raise HTTPException(status_code=400, detail="No running process found for this job")

    proc.terminate()
    running_processes.pop(job_id, None)

    _update_job_status(job_id, {"status": "cancelled", "pipeline_step": ""})

    return {"cancelled": True, "job_id": job_id}


STEP_PROGRESS = {
    "transcription": 20,
    "nemotron": 50,
    "diagrams": 75,
    "pdf": 90,
    "complete": 100,
}


@router.websocket("/ws/{job_id}")
async def job_progress_ws(websocket: WebSocket, job_id: str):
    await websocket.accept()
    try:
        last_sent = None
        while True:
            jobs = load_jobs()
            job = next((j for j in jobs if j["id"] == job_id), None)

            if not job:
                await websocket.send_json({"error": "Job not found"})
                break

            snapshot = {
                "status": job.get("status"),
                "pipeline_step": job.get("pipeline_step", ""),
                "progress": STEP_PROGRESS.get(job.get("pipeline_step", ""), 0),
                "pdf_path": job.get("pdf_path", ""),
                "error_message": job.get("error_message", ""),
            }

            if snapshot != last_sent:
                await websocket.send_json(snapshot)
                last_sent = snapshot

            if job.get("status") in ("done", "failed", "cancelled"):
                break

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass

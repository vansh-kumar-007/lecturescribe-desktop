"""
Jobs routes: list, get detail, open PDF.
GUI owns its own jobs index (jobs.json) — separate from the CLI's temp/ workspace
scanning, since GUI-created jobs are tracked independently going forward.
"""

import os
import uuid
from datetime import datetime
import json
import subprocess
import platform
from pathlib import Path
from fastapi import APIRouter, HTTPException
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


@router.get("")
def list_jobs():
    jobs = load_jobs()
    # Most recent first
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
            subprocess.run(["open", pdf_path])
        else:
            subprocess.run(["xdg-open", pdf_path])
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
        "pdf_path": "",  # left empty on purpose — clicking won't open a real file yet
    }
    jobs.append(fake_job)
    save_jobs(jobs)
    return fake_job


class NewJobRequest(BaseModel):
    folder_path: str
    title: str | None = None


@router.post("/new")
def create_job(payload: NewJobRequest):
    folder = Path(payload.folder_path)

    if not folder.exists() or not folder.is_dir():
        raise HTTPException(status_code=400, detail="Folder does not exist or is not a directory")

    # Basic sanity check — folder should contain at least one video-like file
    video_extensions = {".mp4", ".mkv", ".mov", ".avi", ".webm"}
    has_video = any(f.suffix.lower() in video_extensions for f in folder.iterdir() if f.is_file())

    if not has_video:
        raise HTTPException(status_code=400, detail="No video files found in this folder")

    jobs = load_jobs()
    job_id = str(uuid.uuid4())
    title = payload.title or folder.name

    new_job = {
        "id": job_id,
        "title": title,
        "status": "queued",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source_type": "folder",
        "source_path": str(folder),
        "pdf_path": "",
    }

    jobs.append(new_job)
    save_jobs(jobs)

    return new_job
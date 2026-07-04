"""
Standalone job runner — invoked as a subprocess so it can be forcibly
terminated (for cancel support), unlike a background thread.
Usage: python run_job.py <job_id> <source_path> <title>
"""

import sys
import os
import json
from pathlib import Path

CLI_ROOT = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(CLI_ROOT))
sys.path.insert(0, str(Path(__file__).parent))

import workspace_manager
import utils
import nemotron
import diagram_renderer
import pdf_renderer


def get_jobs_index_path():
    app_data = os.environ.get("APPDATA", str(Path.home()))
    jobs_dir = Path(app_data) / "LectureScribe"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    return jobs_dir / "jobs.json"


def get_settings_path():
    app_data = os.environ.get("APPDATA", str(Path.home()))
    settings_dir = Path(app_data) / "LectureScribe"
    return settings_dir / "settings.json"


def update_job(job_id, updates):
    path = get_jobs_index_path()
    jobs = []
    if path.exists():
        with open(path, "r", encoding="utf-8-sig") as f:
            jobs = json.load(f)
    for j in jobs:
        if j["id"] == job_id:
            j.update(updates)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)


def mark_failed(job_id, error_str):
    if "ResourceExhausted" in error_str or "rate" in error_str.lower():
        msg = "NVIDIA's servers are busy right now. Please try again shortly."
    elif "OutOfMemoryError" in error_str or "CUDA out of memory" in error_str:
        msg = "Not enough GPU memory to process this video."
    elif "mmdc" in error_str.lower():
        msg = "Diagram rendering tool not found. Try reinstalling Mermaid CLI."
    elif "Connection" in error_str:
        msg = "No internet connection. Check your network and try again."
    else:
        msg = "Something went wrong while processing this job."
    update_job(job_id, {"status": "failed", "error_message": msg, "error_raw": error_str[-500:]})


def main():
    job_id = sys.argv[1]
    source_path = sys.argv[2]
    title = sys.argv[3]

    try:
        settings_path = get_settings_path()
        if settings_path.exists():
            with open(settings_path, "r", encoding="utf-8-sig") as f:
                settings = json.load(f)
            if settings.get("nvidia_api_key"):
                os.environ["NVIDIA_API_KEY"] = settings["nvidia_api_key"]

        update_job(job_id, {"status": "processing", "pipeline_step": "transcription"})

        wm_job = workspace_manager.create_job(
            source=source_path, source_type="folder", title=title, config={}
        )
        wm_job.create_dirs()
        update_job(job_id, {"workspace_dir": str(wm_job.dir)})

        transcript, _ = utils.get_folder_transcript(source_path, use_srt=True, job=wm_job)

        update_job(job_id, {"pipeline_step": "nemotron"})
        notes = nemotron.analyze_transcript(transcript, job=wm_job)

        update_job(job_id, {"pipeline_step": "diagrams"})
        blocks = notes.get("blocks", [])
        diagram_paths = diagram_renderer.render_diagrams(
            blocks, output_dir=str(wm_job.diagram_dir), lecture_title=title, job=wm_job
        )

        update_job(job_id, {"pipeline_step": "pdf"})
        pdf_path = pdf_renderer.render_pdf(
            notes, diagram_paths, output_dir=str(wm_job.pdf_dir), job=wm_job
        )

        update_job(job_id, {"status": "done", "pdf_path": str(pdf_path), "pipeline_step": "complete"})

    except SystemExit as e:
        mark_failed(job_id, f"Pipeline exited unexpectedly: {e}")
    except Exception as e:
        mark_failed(job_id, str(e))


if __name__ == "__main__":
    main()
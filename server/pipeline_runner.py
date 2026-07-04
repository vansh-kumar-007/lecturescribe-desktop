"""
Pipeline orchestrator — calls the existing lecturescribe CLI modules directly,
in-process, the same way main.py's TUI does internally.
This is NEW code. Nothing in the backend/ submodule is modified.
"""

import sys
import os
import threading
from pathlib import Path
from routes.settings import get_settings_path
import json as json_lib

# Make the CLI submodule importable
CLI_ROOT = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(CLI_ROOT))

import workspace_manager
import utils
import nemotron
import diagram_renderer
import pdf_renderer


def run_pipeline(job_id: str, source_path: str, title: str, update_job_status, mark_failed):
    try:
        # Load NVIDIA API key from our settings.json and inject into environment
        # so nemotron.get_client() (which expects NVIDIA_API_KEY env var) works correctly.
        settings_path = get_settings_path()
        if settings_path.exists():
            with open(settings_path, "r", encoding="utf-8-sig") as f:
                settings = json_lib.load(f)
            if settings.get("nvidia_api_key"):
                os.environ["NVIDIA_API_KEY"] = settings["nvidia_api_key"]

        update_job_status(job_id, {"status": "processing", "pipeline_step": "transcription"})
        

        # 1. Create the CLI's own workspace job (separate from our GUI jobs.json entry)
        wm_job = workspace_manager.create_job(
            source=source_path,
            source_type="folder",
            title=title,
            config={},
        )
        wm_job.create_dirs()

        # Store the CLI workspace dir on our job so Home/Result screens can find the PDF later
        update_job_status(job_id, {"workspace_dir": str(wm_job.dir)})

        # 2. Transcription (subtitle parse or Whisper, handled internally)
        transcript, _source_used = utils.get_folder_transcript(
            source_path, use_srt=True, job=wm_job
        )

        # 3. Nemotron AI analysis
        update_job_status(job_id, {"pipeline_step": "nemotron"})
        notes = nemotron.analyze_transcript(transcript, job=wm_job)

        # 4. Diagram rendering
        update_job_status(job_id, {"pipeline_step": "diagrams"})
        blocks = notes.get("blocks", [])
        diagram_paths = diagram_renderer.render_diagrams(
            blocks, output_dir=str(wm_job.diagram_dir), lecture_title=title, job=wm_job
        )

        # 5. PDF rendering
        update_job_status(job_id, {"pipeline_step": "pdf"})
        pdf_path = pdf_renderer.render_pdf(
            notes, diagram_paths, output_dir=str(wm_job.pdf_dir), job=wm_job
        )

        update_job_status(job_id, {
            "status": "done",
            "pdf_path": str(pdf_path),
            "pipeline_step": "complete",
        })

    except SystemExit as e:
        mark_failed(job_id, f"Pipeline exited unexpectedly: {e}")
    except Exception as e:
        mark_failed(job_id, str(e))

    


def start_pipeline_thread(job_id, source_path, title, update_job_status, mark_failed):
    thread = threading.Thread(
        target=run_pipeline,
        args=(job_id, source_path, title, update_job_status, mark_failed),
        daemon=True,
    )
    thread.start()
    return thread
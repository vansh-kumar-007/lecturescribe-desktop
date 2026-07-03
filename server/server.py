"""
LectureScribe Desktop — FastAPI backend server.
This file is NEW code layered on top of the lecturescribe CLI submodule.
It does not modify any existing CLI modules — it will import from them
in later phases (transcriber, nemotron, diagram_renderer, pdf_renderer, etc).
"""
import sys
import os

# Add the backend submodule to the path so we can import its modules directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes.system import router as system_router
from routes.validate import router as validate_router
from routes.settings import router as settings_router

app = FastAPI(title="LectureScribe Desktop Backend")
app.include_router(system_router)
app.include_router(validate_router)
app.include_router(settings_router)

# Allow the Electron renderer (running on a local dev port or file://) to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened later once packaged
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "lecturescribe-desktop-backend"}


if __name__ == "__main__":
    port = int(os.environ.get("LECTURESCRIBE_PORT", 7823))
    uvicorn.run(app, host="127.0.0.1", port=port)
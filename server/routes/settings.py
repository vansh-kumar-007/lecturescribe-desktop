"""
Settings persistence: stores NVIDIA key, Telegram config, and user preferences
in a local JSON file under the user's app data folder.
New code — does not touch the CLI's .env-based config.
"""

import os
import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])


def get_settings_path():
    # Windows: C:\Users\<user>\AppData\Roaming\LectureScribe\settings.json
    app_data = os.environ.get("APPDATA", str(Path.home()))
    settings_dir = Path(app_data) / "LectureScribe"
    settings_dir.mkdir(parents=True, exist_ok=True)
    return settings_dir / "settings.json"


class SettingsPayload(BaseModel):
    nvidia_api_key: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    setup_complete: bool | None = None


@router.get("")
def get_settings():
    path = get_settings_path()
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post("")
def save_settings(payload: SettingsPayload):
    path = get_settings_path()

    existing = {}
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            existing = json.load(f)

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    existing.update(updates)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)

    return {"saved": True}
"""
Validation routes: NVIDIA API key, Telegram bot token/chat ID.
New code layered on top of the lecturescribe CLI — does not modify it.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import requests

router = APIRouter(prefix="/validate", tags=["validate"])


class NvidiaKeyRequest(BaseModel):
    api_key: str


@router.post("/nvidia-key")
def validate_nvidia_key(payload: NvidiaKeyRequest):
    """
    Validates an NVIDIA API key by making a minimal test call to Nemotron.
    Uses the same OpenAI SDK + base_url pattern as the existing nemotron.py module.
    """
    try:
        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=payload.api_key,
        )

        response = client.chat.completions.create(
            model="nvidia/nemotron-3-ultra-550b-a55b",
            messages=[{"role": "user", "content": "Reply with just: ok"}],
            max_tokens=5,
        )

        reply = response.choices[0].message.content if response.choices else ""

        return {
            "valid": True,
            "message": "NVIDIA API key is valid and Nemotron responded.",
            "test_reply": reply,
        }

    except Exception as e:
        error_str = str(e)

        # Give a human-readable reason instead of raw exception text
        if "401" in error_str or "authentication" in error_str.lower():
            reason = "Invalid API key — authentication failed."
        elif "429" in error_str or "rate" in error_str.lower():
            reason = "Key looks valid, but rate limit was hit during validation."
        elif "timeout" in error_str.lower():
            reason = "Request timed out — check your internet connection."
        else:
            reason = "Could not validate key. NVIDIA's servers may be busy."

        return {
            "valid": False,
            "message": reason,
        }


class TelegramRequest(BaseModel):
    bot_token: str
    chat_id: str


@router.post("/telegram")
def validate_telegram(payload: TelegramRequest):
    """
    Validates a Telegram bot token + chat ID by sending a real test message.
    This confirms both the token works AND the chat_id is correct/reachable.
    """
    try:
        url = f"https://api.telegram.org/bot{payload.bot_token}/sendMessage"
        response = requests.post(
            url,
            json={
                "chat_id": payload.chat_id,
                "text": "✅ LectureScribe Desktop is connected. You'll receive your PDF notes here.",
            },
            timeout=10,
        )

        data = response.json()

        if data.get("ok"):
            return {
                "valid": True,
                "message": "Telegram connected — check your chat for a test message.",
            }

        error_desc = data.get("description", "")

        if "chat not found" in error_desc.lower():
            reason = "Chat ID not found. Make sure you've messaged your bot at least once."
        elif "unauthorized" in error_desc.lower():
            reason = "Invalid bot token."
        else:
            reason = f"Telegram error: {error_desc}"

        return {
            "valid": False,
            "message": reason,
        }

    except requests.exceptions.Timeout:
        return {"valid": False, "message": "Request to Telegram timed out."}
    except Exception as e:
        return {"valid": False, "message": f"Unexpected error: {str(e)}"}
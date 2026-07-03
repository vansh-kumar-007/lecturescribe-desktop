"""
System detection routes: GPU, and later ffmpeg/mmdc checks.
New code layered on top of the lecturescribe CLI — does not modify it.
"""

import subprocess
from fastapi import APIRouter

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/gpu")
def detect_gpu():
    """
    Detect NVIDIA GPU via nvidia-smi. Lightweight — does not import torch.
    """
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,memory.used,driver_version",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode != 0 or not result.stdout.strip():
            return {
                "gpu_detected": False,
                "reason": "nvidia-smi ran but returned no GPU data",
            }

        # nvidia-smi can list multiple GPUs, one per line — take the first
        first_line = result.stdout.strip().splitlines()[0]
        name, mem_total, mem_used, driver_version = [
            x.strip() for x in first_line.split(",")
        ]

        mem_total_mb = int(mem_total)
        mem_total_gb = round(mem_total_mb / 1024, 1)

        # Whisper large-v3 needs ~6GB+ VRAM comfortably; flag if tight
        sufficient_vram = mem_total_mb >= 5500

        return {
            "gpu_detected": True,
            "gpu_name": name,
            "vram_total_gb": mem_total_gb,
            "vram_used_mb": int(mem_used),
            "driver_version": driver_version,
            "sufficient_vram": sufficient_vram,
        }

    except FileNotFoundError:
        return {
            "gpu_detected": False,
            "reason": "nvidia-smi not found — no NVIDIA driver installed",
        }
    except subprocess.TimeoutExpired:
        return {
            "gpu_detected": False,
            "reason": "nvidia-smi timed out",
        }
    except Exception as e:
        return {
            "gpu_detected": False,
            "reason": f"Unexpected error: {str(e)}",
        }
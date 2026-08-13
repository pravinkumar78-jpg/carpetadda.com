"""Persistent local file storage for Hostinger/VPS deployments."""
import logging
import mimetypes
import os
import uuid
from pathlib import Path

log = logging.getLogger("carpetadda.storage")
APP_NAME = "carpetadda"
ROOT = Path(os.environ.get("UPLOAD_DIR", Path(__file__).resolve().parent / "uploads")).resolve()
MIME_TYPES = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","gif":"image/gif","webp":"image/webp","svg":"image/svg+xml","pdf":"application/pdf"}

def init_storage(force: bool=False):
    ROOT.mkdir(parents=True, exist_ok=True)
    return str(ROOT)

def build_upload_path(kind: str, filename: str) -> str:
    ext=(filename.rsplit(".",1)[-1] if "." in filename else "bin").lower()
    if len(ext)>6: ext="bin"
    return f"{APP_NAME}/{kind}/{uuid.uuid4().hex}.{ext}"

def _safe(path: str) -> Path:
    p=(ROOT / path).resolve()
    if ROOT != p and ROOT not in p.parents:
        raise ValueError("Invalid storage path")
    return p

def put_object(path: str, data: bytes, content_type: str) -> dict:
    p=_safe(path); p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data)
    return {"path": path, "size": len(data), "content_type": content_type}

def get_object(path: str) -> tuple[bytes,str]:
    p=_safe(path)
    if not p.exists() or not p.is_file(): raise FileNotFoundError(path)
    return p.read_bytes(), mimetypes.guess_type(str(p))[0] or "application/octet-stream"

def guess_content_type(filename: str, fallback: str="application/octet-stream") -> str:
    ext=filename.rsplit(".",1)[-1].lower() if "." in filename else ""
    return MIME_TYPES.get(ext, fallback)

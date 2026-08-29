"""Durable file storage for CarpetAdda.

Bytes live in Emergent object storage (survives container restarts/redeploys);
the local uploads directory is kept as a write-through cache for fast reads.
Same /api/files/... paths and DB records as before — existing image URLs keep working.
"""
import logging
import mimetypes
import os
import uuid
from pathlib import Path

import requests

log = logging.getLogger("carpetadda.storage")
APP_NAME = "carpetadda"
ROOT = Path(os.environ.get("UPLOAD_DIR", Path(__file__).resolve().parent / "uploads")).resolve()
MIME_TYPES = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","gif":"image/gif","webp":"image/webp","svg":"image/svg+xml","pdf":"application/pdf"}
_STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
_STORAGE_URL = _STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
_KEY = None


def _remote_enabled() -> bool:
    return bool(os.environ.get("EMERGENT_LLM_KEY"))


def init_storage(force: bool = False):
    """Prepare the local cache dir; mint the session storage key when remote storage is enabled."""
    global _KEY
    ROOT.mkdir(parents=True, exist_ok=True)
    if not _remote_enabled():
        return str(ROOT)
    if _KEY and not force:
        return _KEY
    resp = requests.post(f"{_STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    _KEY = resp.json()["storage_key"]
    return _KEY


def build_upload_path(kind: str, filename: str) -> str:
    ext=(filename.rsplit(".",1)[-1] if "." in filename else "bin").lower()
    if len(ext)>6: ext="bin"
    return f"{APP_NAME}/{kind}/{uuid.uuid4().hex}.{ext}"


def _safe(path: str) -> Path:
    p=(ROOT / path).resolve()
    if ROOT != p and ROOT not in p.parents:
        raise ValueError("Invalid storage path")
    return p


def _remote_put(path: str, data: bytes, content_type: str):
    key = init_storage()
    resp = requests.put(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:  # stale session key — re-mint once, then fail loudly
        resp = requests.put(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=True), "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()


def _remote_get(path: str) -> bytes:
    key = init_storage()
    resp = requests.get(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:  # stale session key — re-mint once, then fail loudly
        resp = requests.get(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=True)}, timeout=60)
    resp.raise_for_status()
    return resp.content


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Persist uploads to durable object storage only — the pod filesystem is ephemeral across deploys."""
    if not _remote_enabled():
        raise RuntimeError("Object storage is not configured (EMERGENT_LLM_KEY missing)")
    _remote_put(path, data, content_type)  # durable write — raises if it cannot persist
    return {"path": path, "size": len(data), "content_type": content_type}


def get_object(path: str) -> tuple[bytes,str]:
    p=_safe(path)
    if p.exists() and p.is_file():
        return p.read_bytes(), mimetypes.guess_type(str(p))[0] or "application/octet-stream"
    if _remote_enabled():
        try:
            data = _remote_get(path)
        except Exception:
            raise FileNotFoundError(path)
        p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data)  # repopulate local cache
        return data, mimetypes.guess_type(str(p))[0] or "application/octet-stream"
    raise FileNotFoundError(path)


def guess_content_type(filename: str, fallback: str="application/octet-stream") -> str:
    ext=filename.rsplit(".",1)[-1].lower() if "." in filename else ""
    return MIME_TYPES.get(ext, fallback)

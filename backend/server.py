"""EstateHub — Indian Real Estate Portal API."""
from __future__ import annotations

import json
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import logging
import os
import re
from pathlib import Path
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Body, Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import (  # noqa: E402
    create_token,
    current_user,
    current_user_optional,
    hash_password,
    require_roles,
    verify_password,
)
from email_service import send_lead_notification, send_account_email  # noqa: E402
from storage import ROOT as UPLOAD_ROOT, build_upload_path, get_object, guess_content_type, init_storage, put_object  # noqa: E402
from models import (  # noqa: E402
    Agent,
    Amenity,
    Blog,
    Developer,
    FAQ,
    Favorite,
    Lead,
    Location,
    Page,
    Project,
    Property,
    RegisterInput,
    LoginInput,
    SavedSearch,
    SeoPage,
    SiteSettings,
    SiteVisit,
    Testimonial,
    Unit,
    UNIT_STATUSES,
    User,
    UserOut,
)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="EstateHub API", version="1.0.0")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(UPLOAD_ROOT)), name="media")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("estatehub")

PROJ = {"_id": 0}


def _clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


def _now_iso_str() -> str:
    from datetime import datetime as _dt, timezone as _tz
    return _dt.now(_tz.utc).isoformat()


# ---------------- Health ----------------
@api.get("/")
async def health():
    return {"ok": True, "service": "EstateHub API", "version": "1.0.0"}


# ---------------- Auth ----------------
@api.post("/auth/register")
async def register(body: RegisterInput):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    role = body.role if body.role in {"user", "agent", "developer", "owner"} else "user"
    email_ready = bool(os.environ.get("SMTP_HOST") or os.environ.get("EMERGENT_EMAIL_KEY"))
    u = User(name=body.name, email=body.email, phone=body.phone,
             password_hash=hash_password(body.password), role=role, verified=not email_ready)
    await db.users.insert_one(u.model_dump())
    if email_ready:
        await _send_verification_email(u)
    return {"token": create_token(u.id, u.role),
            "user": UserOut(**u.model_dump()).model_dump()}


async def _send_verification_email(u: User):
    raw = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    await db.email_verifications.delete_many({"user_id": u.id})
    await db.email_verifications.insert_one({"user_id": u.id, "token_hash": _token_hash(raw),
                                             "expires_at": now + timedelta(hours=24), "used": False, "created_at": now})
    frontend_url = os.environ.get("FRONTEND_URL", os.environ.get("SITE_URL", "http://localhost:3000")).rstrip("/")
    link = f"{frontend_url}/verify-email?token={raw}"
    await send_account_email(u.email, "Verify your CarpetAdda email",
        f"<p>Hello {u.name},</p><p>Welcome to CarpetAdda. Please verify your email address to unlock listing and enquiry features:</p>"
        f"<p><a href=\"{link}\">Verify Email</a></p><p>The link expires in 24 hours.</p>")


@api.post("/auth/verify-email")
async def verify_email(body: dict = Body(...)):
    token = (body.get("token") or "").strip()
    if not token:
        raise HTTPException(400, "Token required")
    rec = await db.email_verifications.find_one({"token_hash": _token_hash(token), "used": False})
    if not rec or rec.get("expires_at") < datetime.now(timezone.utc):
        raise HTTPException(400, "Verification link is invalid or expired")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"verified": True, "updated_at": _now_iso_str()}})
    await db.email_verifications.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}


@api.post("/auth/resend-verification")
async def resend_verification(user: dict = Depends(current_user)):
    doc = await db.users.find_one({"id": user["sub"]}, PROJ)
    if not doc:
        raise HTTPException(404, "User not found")
    if doc.get("verified"):
        return {"ok": True, "message": "Email already verified"}
    email_ready = bool(os.environ.get("SMTP_HOST") or os.environ.get("EMERGENT_EMAIL_KEY"))
    if not email_ready:
        await db.users.update_one({"id": doc["id"]}, {"$set": {"verified": True}})
        return {"ok": True, "message": "Email delivery is not configured; account auto-verified"}
    await _send_verification_email(User(**doc))
    return {"ok": True, "message": "Verification email sent"}


@api.put("/auth/profile")
async def update_profile(body: dict = Body(...), user: dict = Depends(current_user)):
    name = (body.get("name") or "").strip()
    phone = (body.get("phone") or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    await db.users.update_one({"id": user["sub"]}, {"$set": {"name": name, "phone": phone, "updated_at": _now_iso_str()}})
    doc = await db.users.find_one({"id": user["sub"]}, PROJ)
    return UserOut(**doc).model_dump()


@api.post("/auth/login")
async def login(body: LoginInput):
    doc = await db.users.find_one({"email": body.email}, PROJ)
    if not doc or not verify_password(body.password, doc["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    if not doc.get("active", True):
        raise HTTPException(403, "Account disabled")
    return {"token": create_token(doc["id"], doc["role"]),
            "user": UserOut(**doc).model_dump()}


@api.get("/auth/me")
async def me(u: dict = Depends(current_user)):
    doc = await db.users.find_one({"id": u["sub"]}, PROJ)
    if not doc:
        raise HTTPException(404, "User not found")
    return UserOut(**doc).model_dump()


# ---------------- Password management ----------------
def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

@api.post("/auth/change-password")
async def change_password(body: dict = Body(...), user: dict = Depends(current_user)):
    current = (body.get("current_password") or "").strip()
    new = (body.get("new_password") or "").strip()
    confirm = (body.get("confirm_password") or "").strip()
    if len(new) < 8: raise HTTPException(400, "New password must be at least 8 characters")
    if new != confirm: raise HTTPException(400, "New passwords do not match")
    doc = await db.users.find_one({"id": user["sub"]}, PROJ)
    if not doc or not verify_password(current, doc.get("password_hash", "")): raise HTTPException(401, "Current password is incorrect")
    await db.users.update_one({"id": user["sub"]}, {"$set": {"password_hash": hash_password(new), "updated_at": _now_iso_str()}})
    return {"ok": True}

@api.post("/auth/forgot-password")
async def forgot_password(body: dict = Body(...), background_tasks: BackgroundTasks = None):
    email = (body.get("email") or "").strip().lower()
    # Always return the same response to avoid account enumeration.
    generic = {"ok": True, "message": "If that email is registered, a password reset link has been sent."}
    if not email: return generic
    doc = await db.users.find_one({"email": email}, PROJ)
    if not doc: return generic
    raw = secrets.token_urlsafe(48); now=datetime.now(timezone.utc); expires=now+timedelta(minutes=30)
    await db.password_resets.delete_many({"user_id": doc["id"]})
    await db.password_resets.insert_one({"user_id":doc["id"],"token_hash":_token_hash(raw),"expires_at":expires,"used":False,"created_at":now})
    frontend_url=os.environ.get("FRONTEND_URL", os.environ.get("SITE_URL", "http://localhost:3000")).rstrip("/")
    link=f"{frontend_url}/reset-password?token={raw}"
    await send_account_email(email, "Reset your CarpetAdda password", f"<p>Hello {doc.get('name','User')},</p><p>Use the link below to reset your CarpetAdda password. It expires in 30 minutes and can be used once.</p><p><a href=\"{link}\">Reset Password</a></p><p>If you did not request this, you can ignore this email.</p>")
    return generic

@api.post("/auth/reset-password")
async def reset_password(body: dict = Body(...)):
    token=(body.get("token") or "").strip(); new=(body.get("new_password") or "").strip(); confirm=(body.get("confirm_password") or "").strip()
    if not token or len(new)<8: raise HTTPException(400,"Valid token and password of at least 8 characters are required")
    if new!=confirm: raise HTTPException(400,"New passwords do not match")
    rec=await db.password_resets.find_one({"token_hash":_token_hash(token),"used":False})
    if not rec or rec.get("expires_at") < datetime.now(timezone.utc): raise HTTPException(400,"Reset link is invalid or expired")
    await db.users.update_one({"id":rec["user_id"]},{"$set":{"password_hash":hash_password(new),"updated_at":_now_iso_str()}})
    await db.password_resets.update_one({"_id":rec["_id"]},{"$set":{"used":True,"used_at":datetime.now(timezone.utc)}})
    return {"ok":True}

# ---------------- Locations ----------------
@api.get("/locations")
async def list_locations(type: Optional[str] = None, city: Optional[str] = None, q: Optional[str] = None,
                         limit: int = 200):
    query: dict[str, Any] = {}
    if type:
        query["type"] = type
    if city:
        query["city"] = city
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    docs = await db.locations.find(query, PROJ).to_list(limit)
    return docs


@api.get("/locations/{slug}")
async def get_location(slug: str):
    doc = await db.locations.find_one({"slug": slug}, PROJ)
    if not doc:
        raise HTTPException(404, "Location not found")
    props_count = await db.properties.count_documents({"$or": [{"location": slug}, {"city": slug}]})
    proj_count = await db.projects.count_documents({"$or": [{"location": slug}, {"city": slug}]})
    return {**doc, "properties_count": props_count, "projects_count": proj_count}


# ---------------- Developers ----------------
@api.get("/developers")
async def list_developers(q: Optional[str] = None, limit: int = 50):
    query = {"name": {"$regex": q, "$options": "i"}} if q else {}
    return await db.developers.find(query, PROJ).to_list(limit)


@api.get("/developers/{slug}")
async def get_developer(slug: str):
    doc = await db.developers.find_one({"slug": slug}, PROJ)
    if not doc:
        raise HTTPException(404, "Developer not found")
    projects = await db.projects.find({"developer_id": doc["id"]}, PROJ).to_list(50)
    properties = await db.properties.find({"developer_id": doc["id"]}, PROJ).to_list(30)
    return {**doc, "projects": projects, "properties": properties}


# ---------------- Agents ----------------
@api.get("/agents")
async def list_agents(q: Optional[str] = None, city: Optional[str] = None, limit: int = 50):
    query: dict[str, Any] = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if city:
        query["locations"] = city
    return await db.agents.find(query, PROJ).to_list(limit)


@api.get("/agents/{slug}")
async def get_agent(slug: str):
    doc = await db.agents.find_one({"slug": slug}, PROJ)
    if not doc:
        raise HTTPException(404, "Agent not found")
    properties = await db.properties.find({"agent_id": doc["id"]}, PROJ).to_list(30)
    return {**doc, "properties": properties}


# ---------------- Properties ----------------
def build_property_query(
    listing_type: Optional[str], category: Optional[str], property_type: Optional[str],
    city: Optional[str], location: Optional[str], bhk: Optional[int],
    price_min: Optional[float], price_max: Optional[float],
    area_min: Optional[float], area_max: Optional[float],
    furnishing: Optional[str], construction_status: Optional[str],
    verified: Optional[bool], featured: Optional[bool], rera: Optional[bool],
    developer_id: Optional[str], agent_id: Optional[str], project_id: Optional[str],
    q: Optional[str],
) -> dict:
    query: dict[str, Any] = {"status": "active"}
    if listing_type:
        query["listing_type"] = listing_type
    if category:
        query["property_category"] = category
    if property_type:
        query["property_type"] = property_type
    if city:
        query["city"] = city
    if location:
        query["location"] = location
    if bhk:
        query["bhk"] = bhk
    if price_min is not None or price_max is not None:
        pq: dict[str, Any] = {}
        if price_min is not None:
            pq["$gte"] = price_min
        if price_max is not None:
            pq["$lte"] = price_max
        query["price"] = pq
    if area_min is not None or area_max is not None:
        aq: dict[str, Any] = {}
        if area_min is not None:
            aq["$gte"] = area_min
        if area_max is not None:
            aq["$lte"] = area_max
        query["carpet_area"] = aq
    if furnishing:
        query["furnishing"] = furnishing
    if construction_status:
        query["construction_status"] = construction_status
    if verified is not None:
        query["verified"] = verified
    if featured is not None:
        query["featured"] = featured
    if rera:
        query["rera_number"] = {"$ne": None}
    if developer_id:
        query["developer_id"] = developer_id
    if agent_id:
        query["agent_id"] = agent_id
    if project_id:
        query["project_id"] = project_id
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"address": {"$regex": q, "$options": "i"}},
        ]
    return query


SORT_MAP = {
    "newest": [("created_at", -1)],
    "price_low": [("price", 1)],
    "price_high": [("price", -1)],
    "area_low": [("carpet_area", 1)],
    "area_high": [("carpet_area", -1)],
    "most_viewed": [("views", -1)],
    "featured": [("featured", -1), ("created_at", -1)],
}


@api.get("/properties")
async def list_properties(
    listing_type: Optional[str] = None, category: Optional[str] = None,
    property_type: Optional[str] = None, city: Optional[str] = None, location: Optional[str] = None,
    bhk: Optional[int] = None, price_min: Optional[float] = None, price_max: Optional[float] = None,
    area_min: Optional[float] = None, area_max: Optional[float] = None,
    furnishing: Optional[str] = None, construction_status: Optional[str] = None,
    verified: Optional[bool] = None, featured: Optional[bool] = None, rera: Optional[bool] = None,
    developer_id: Optional[str] = None, agent_id: Optional[str] = None, project_id: Optional[str] = None,
    owner_id: Optional[str] = None, include_archived: bool = False,
    q: Optional[str] = None, sort: str = "newest",
    page: int = 1, page_size: int = 12,
):
    query = build_property_query(listing_type, category, property_type, city, location, bhk,
                                 price_min, price_max, area_min, area_max, furnishing,
                                 construction_status, verified, featured, rera,
                                 developer_id, agent_id, project_id, q)
    if owner_id:
        query["owner_id"] = owner_id
        if include_archived:
            query.pop("status", None)
    sort_by = SORT_MAP.get(sort, SORT_MAP["newest"])
    total = await db.properties.count_documents(query)
    skip = max(0, (page - 1) * page_size)
    cursor = db.properties.find(query, PROJ).sort(sort_by).skip(skip).limit(page_size)
    items = await cursor.to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size}


@api.get("/properties/featured")
async def featured_properties(limit: int = 8):
    return await db.properties.find({"featured": True, "status": "active"}, PROJ).limit(limit).to_list(limit)


@api.get("/properties/{slug_or_id}")
async def get_property(slug_or_id: str):
    doc = await db.properties.find_one({"$or": [{"slug": slug_or_id}, {"id": slug_or_id}]}, PROJ)
    if not doc or doc.get("status") != "active":
        raise HTTPException(404, "Property not found")
    await db.properties.update_one({"id": doc["id"]}, {"$inc": {"views": 1}})
    developer = await db.developers.find_one({"id": doc.get("developer_id")}, PROJ) if doc.get("developer_id") else None
    agent = await db.agents.find_one({"id": doc.get("agent_id")}, PROJ) if doc.get("agent_id") else None
    project = await db.projects.find_one({"id": doc.get("project_id")}, PROJ) if doc.get("project_id") else None
    similar = await db.properties.find(
        {"id": {"$ne": doc["id"]}, "city": doc.get("city"), "property_category": doc.get("property_category"), "status": "active"},
        PROJ,
    ).limit(6).to_list(6)
    return {**doc, "developer": developer, "agent": agent, "project": project, "similar": similar}


@api.post("/properties", dependencies=[Depends(require_roles("admin", "agent", "developer", "owner", "user"))])
async def create_property(body: Property, u: dict = Depends(current_user)):
    account = await db.users.find_one({"id": u["sub"]}, {"_id": 0, "active": 1})
    if account and account.get("active") is False:
        raise HTTPException(403, "Your account is blocked. Contact admin.")
    body.owner_id = u["sub"]
    if u["role"] in ("agent",) and not body.agent_id:
        body.agent_id = u["sub"]
    if u["role"] not in ("admin", "super_admin"):
        body.status = "pending_review"
        body.verified = False
        body.featured = False
    await db.properties.insert_one(body.model_dump())
    return _clean(body.model_dump())


# Owner/admin edit view: lets owners open pending/rejected/archived listings for correction
@api.get("/my/properties/{pid}")
async def get_my_property(pid: str, u: dict = Depends(current_user)):
    doc = await db.properties.find_one({"id": pid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    if u["role"] not in ("admin", "super_admin") and doc.get("owner_id") != u["sub"] and doc.get("agent_id") != u["sub"]:
        raise HTTPException(403, "Not your listing")
    return doc


@api.get("/my/projects/{pid}")
async def get_my_project(pid: str, u: dict = Depends(current_user)):
    doc = await db.projects.find_one({"id": pid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    if u["role"] not in ("admin", "super_admin") and doc.get("owner_id") != u["sub"]:
        raise HTTPException(403, "Not your project")
    return doc


@api.put("/properties/{pid}")
async def update_property(pid: str, body: dict = Body(...), u: dict = Depends(current_user)):
    doc = await db.properties.find_one({"id": pid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    if u["role"] not in ("admin", "super_admin") and doc.get("owner_id") != u["sub"] and doc.get("agent_id") != u["sub"]:
        raise HTTPException(403, "You can only edit your own listings")
    body.pop("_id", None); body.pop("id", None); body.pop("owner_id", None)
    res = await db.properties.update_one({"id": pid}, {"$set": body})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return await db.properties.find_one({"id": pid}, PROJ)


@api.delete("/properties/{pid}", dependencies=[Depends(require_roles("admin"))])
async def delete_property(pid: str):
    res = await db.properties.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


async def _can_manage_listing(user: dict, collection: str, rid: str) -> dict:
    doc = await db[collection].find_one({"id": rid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    if user["role"] in ("admin", "super_admin"):
        return doc
    if doc.get("owner_id") == user["sub"] or doc.get("agent_id") == user["sub"]:
        return doc
    raise HTTPException(403, "You can only manage your own listings")


@api.put("/admin/properties/{pid}/archive")
async def archive_property(pid: str, u: dict = Depends(current_user)):
    await _can_manage_listing(u, "properties", pid)
    await db.properties.update_one({"id": pid}, {"$set": {"status": "archived", "updated_at": _now_iso_str()}})
    return {"ok": True, "status": "archived"}


@api.put("/admin/properties/{pid}/restore")
async def restore_property(pid: str, u: dict = Depends(current_user)):
    await _can_manage_listing(u, "properties", pid)
    await db.properties.update_one({"id": pid}, {"$set": {"status": "active", "updated_at": _now_iso_str()}})
    return {"ok": True, "status": "active"}


# ---------------- Review workflow (admin) ----------------
@api.put("/admin/properties/{pid}/approve", dependencies=[Depends(require_roles("admin"))])
async def approve_property(pid: str):
    res = await db.properties.update_one({"id": pid}, {"$set": {"status": "active", "reviewed_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True, "status": "active"}


async def _notify_rejection(collection: str, doc_id: str, name_key: str, reason: str | None):
    doc = await db[collection].find_one({"id": doc_id}, PROJ)
    if not doc:
        return
    owner = None
    for ref in (doc.get("owner_id"), doc.get("agent_id")):
        if ref:
            owner = await db.users.find_one({"id": ref}, {"_id": 0, "email": 1, "name": 1, "active": 1})
            if owner:
                break
    if not owner or not owner.get("email"):
        return
    listing_name = doc.get("title") or doc.get("name") or "your listing"
    kind = "Property" if collection == "properties" else "Project"
    await send_account_email(
        owner["email"],
        f"{kind} update: \"{listing_name}\" needs changes",
        f"<p>Hello {owner.get('name', '')},</p>"
        f"<p>Your {kind.lower()} <b>{listing_name}</b> was reviewed and its status is now <b>Rejected</b>.</p>"
        f"<p><b>Reason from our review team:</b> {reason or 'Not specified'}</p>"
        f"<p>Please correct the listing from your dashboard and submit it again for review. Your listing and its data are fully preserved.</p>",
    )


@api.put("/admin/properties/{pid}/reject", dependencies=[Depends(require_roles("admin"))])
async def reject_property(pid: str, body: dict = Body(default={})):
    res = await db.properties.update_one({"id": pid}, {"$set": {"status": "rejected", "rejection_reason": body.get("reason"), "reviewed_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    await _notify_rejection("properties", pid, "title", body.get("reason"))
    return {"ok": True, "status": "rejected"}


@api.put("/admin/properties/{pid}/verify", dependencies=[Depends(require_roles("admin"))])
async def verify_property(pid: str):
    res = await db.properties.update_one({"id": pid}, {"$set": {"verified": True, "verified_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True, "verified": True}


@api.put("/admin/projects/{pid}/approve", dependencies=[Depends(require_roles("admin"))])
async def approve_project(pid: str):
    res = await db.projects.update_one({"id": pid}, {"$set": {"status": "active", "reviewed_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True, "status": "active"}


@api.put("/admin/projects/{pid}/reject", dependencies=[Depends(require_roles("admin"))])
async def reject_project(pid: str, body: dict = Body(default={})):
    res = await db.projects.update_one({"id": pid}, {"$set": {"status": "rejected", "rejection_reason": body.get("reason"), "reviewed_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    await _notify_rejection("projects", pid, "name", body.get("reason"))
    return {"ok": True, "status": "rejected"}


@api.put("/admin/users/{uid}/block", dependencies=[Depends(require_roles("admin"))])
async def block_user(uid: str):
    res = await db.users.update_one({"id": uid}, {"$set": {"active": False, "blocked_at": _now_iso_str()}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True, "active": False}


@api.put("/admin/users/{uid}/unblock", dependencies=[Depends(require_roles("admin"))])
async def unblock_user(uid: str):
    res = await db.users.update_one({"id": uid}, {"$set": {"active": True}, "$unset": {"blocked_at": ""}})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True, "active": True}


@api.post("/properties/{pid}/duplicate", dependencies=[Depends(require_roles("admin"))])
async def duplicate_property(pid: str):
    doc = await db.properties.find_one({"id": pid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    import uuid as _uuid
    from datetime import datetime as _dt, timezone as _tz
    doc["id"] = str(_uuid.uuid4())
    doc["slug"] = f"{doc['slug']}-copy-{doc['id'][:6]}"
    doc["title"] = f"{doc['title']} (Copy)"
    doc["status"] = "draft"
    doc["featured"] = False
    doc["views"] = 0
    doc["created_at"] = _dt.now(_tz.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await db.properties.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/admin/properties", dependencies=[Depends(require_roles("admin"))])
async def admin_list_properties(status: Optional[str] = None, q: Optional[str] = None,
                                city: Optional[str] = None, listing_type: Optional[str] = None,
                                page: int = 1, page_size: int = 20):
    query: dict = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$ne": "archived"}
    if city: query["city"] = city
    if listing_type: query["listing_type"] = listing_type
    if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}},
                          {"slug": {"$regex": q, "$options": "i"}},
                          {"address": {"$regex": q, "$options": "i"}}]
    total = await db.properties.count_documents(query)
    skip = max(0, (page - 1) * page_size)
    items = await db.properties.find(query, PROJ).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size}


# ---------------- Projects ----------------
@api.get("/projects")
async def list_projects(city: Optional[str] = None, location: Optional[str] = None,
                        developer_id: Optional[str] = None, featured: Optional[bool] = None,
                        category: Optional[str] = None,
                        q: Optional[str] = None, sort: str = "newest",
                        page: int = 1, page_size: int = 12):
    query: dict[str, Any] = {"status": "active"}
    if city: query["city"] = city
    if location: query["location"] = location
    if developer_id: query["developer_id"] = developer_id
    if featured is not None: query["featured"] = featured
    if category: query["property_category"] = category
    if q: query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                          {"description": {"$regex": q, "$options": "i"}}]
    total = await db.projects.count_documents(query)
    skip = max(0, (page - 1) * page_size)
    sort_by = [("featured", -1), ("created_at", -1)] if sort == "featured" else [("created_at", -1)]
    items = await db.projects.find(query, PROJ).sort(sort_by).skip(skip).limit(page_size).to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size}


@api.get("/projects/featured")
async def featured_projects(limit: int = 6):
    return await db.projects.find({"featured": True}, PROJ).limit(limit).to_list(limit)


@api.get("/projects/{slug_or_id}")
async def get_project(slug_or_id: str):
    doc = await db.projects.find_one({"$or": [{"slug": slug_or_id}, {"id": slug_or_id}]}, PROJ)
    if not doc or doc.get("status") != "active":
        raise HTTPException(404, "Project not found")
    developer = await db.developers.find_one({"id": doc.get("developer_id")}, PROJ)
    properties = await db.properties.find({"project_id": doc["id"], "status": "active"}, PROJ).limit(12).to_list(12)
    similar = await db.projects.find({"id": {"$ne": doc["id"]}, "city": doc.get("city"), "status": "active"}, PROJ).limit(6).to_list(6)
    units = await db.units.find({"project_id": doc["id"], "published": {"$ne": False}}, PROJ).sort([("typology", 1), ("price", 1)]).to_list(200)
    return {**doc, "developer": developer, "properties": properties, "similar": similar, "units": units}
    return {**doc, "developer": developer, "properties": properties, "similar": similar}


@api.post("/projects", dependencies=[Depends(require_roles("admin", "developer"))])
async def create_project(body: Project, u: dict = Depends(current_user)):
    account = await db.users.find_one({"id": u["sub"]}, {"_id": 0, "active": 1, "role": 1})
    if account and account.get("active") is False:
        raise HTTPException(403, "Your account is blocked. Contact admin.")
    body.owner_id = u["sub"]
    if u["role"] not in ("admin", "super_admin"):
        body.status = "pending_review"
        body.verified = False
        body.featured = False
    await db.projects.insert_one(body.model_dump())
    return _clean(body.model_dump())


@api.put("/projects/{pid}")
async def update_project(pid: str, body: dict = Body(...), u: dict = Depends(current_user)):
    if u["role"] not in ("admin", "super_admin", "developer"):
        raise HTTPException(403, "Not authorized")
    doc = await db.projects.find_one({"id": pid}, PROJ)
    if not doc:
        raise HTTPException(404, "Not found")
    if u["role"] == "developer" and doc.get("owner_id") not in (None, u["sub"]):
        raise HTTPException(403, "You can only edit your own projects")
    body.pop("_id", None); body.pop("id", None); body.pop("owner_id", None)
    res = await db.projects.update_one({"id": pid}, {"$set": body})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return await db.projects.find_one({"id": pid}, PROJ)


@api.delete("/projects/{pid}", dependencies=[Depends(require_roles("admin"))])
async def delete_project(pid: str):
    res = await db.projects.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


@api.put("/admin/projects/{pid}/archive")
async def archive_project(pid: str, u: dict = Depends(current_user)):
    await _can_manage_listing(u, "projects", pid)
    await db.projects.update_one({"id": pid}, {"$set": {"status": "archived", "updated_at": _now_iso_str()}})
    return {"ok": True, "status": "archived"}


@api.put("/admin/projects/{pid}/restore")
async def restore_project(pid: str, u: dict = Depends(current_user)):
    await _can_manage_listing(u, "projects", pid)
    await db.projects.update_one({"id": pid}, {"$set": {"status": "active", "updated_at": _now_iso_str()}})
    return {"ok": True, "status": "active"}


@api.get("/admin/projects")
async def admin_list_projects(q: Optional[str] = None, city: Optional[str] = None,
                              status: Optional[str] = None,
                              page: int = 1, page_size: int = 20,
                              u: dict = Depends(current_user)):
    if u["role"] not in ("admin", "super_admin", "developer"):
        raise HTTPException(403, "Not authorized")
    query: dict = {}
    if status:
        query["status"] = status
    elif u["role"] not in ("admin", "super_admin"):
        pass  # developers see all their own incl. archived
    else:
        query["status"] = {"$ne": "archived"}
    if u["role"] == "developer":
        query["owner_id"] = u["sub"]
    if city: query["city"] = city
    if q: query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                          {"slug": {"$regex": q, "$options": "i"}}]
    total = await db.projects.count_documents(query)
    skip = max(0, (page - 1) * page_size)
    items = await db.projects.find(query, PROJ).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size}


# ---------------- Units (Project Inventory) ----------------
@api.get("/projects/{project_id}/units/summary")
async def project_units_summary(project_id: str):
    """Public: aggregated counts per typology and status. Used on project detail page."""
    project = await db.projects.find_one({"id": project_id}, PROJ) or \
              await db.projects.find_one({"slug": project_id}, PROJ)
    if not project:
        raise HTTPException(404, "Project not found")
    pid = project["id"]
    units = await db.units.find({"project_id": pid}, PROJ).to_list(5000)
    by_status: dict[str, int] = {s: 0 for s in UNIT_STATUSES}
    by_typology: dict[str, dict] = {}
    for u in units:
        st = u.get("status", "available")
        by_status[st] = by_status.get(st, 0) + 1
        typ = u.get("typology") or "Other"
        typ_row = by_typology.setdefault(typ, {"typology": typ, "total": 0, "available": 0,
                                                "price_min": None, "carpet_min": None, "carpet_max": None})
        typ_row["total"] += 1
        if st == "available":
            typ_row["available"] += 1
        if u.get("price") is not None:
            typ_row["price_min"] = min(typ_row["price_min"], u["price"]) if typ_row["price_min"] is not None else u["price"]
        if u.get("carpet_area") is not None:
            ca = u["carpet_area"]
            typ_row["carpet_min"] = min(typ_row["carpet_min"], ca) if typ_row["carpet_min"] is not None else ca
            typ_row["carpet_max"] = max(typ_row["carpet_max"], ca) if typ_row["carpet_max"] is not None else ca
    return {"project_id": pid, "total": len(units),
            "by_status": by_status, "by_typology": list(by_typology.values())}


@api.get("/projects/{project_id}/units", dependencies=[Depends(require_roles("admin", "developer", "agent"))])
async def list_units(project_id: str, status: Optional[str] = None, tower: Optional[str] = None,
                     typology: Optional[str] = None, q: Optional[str] = None):
    query: dict[str, Any] = {"project_id": project_id}
    if status:
        query["status"] = status
    if tower:
        query["tower"] = tower
    if typology:
        query["typology"] = typology
    if q:
        query["$or"] = [
            {"unit_no": {"$regex": q, "$options": "i"}},
            {"buyer_name": {"$regex": q, "$options": "i"}},
        ]
    items = await db.units.find(query, PROJ).sort([("tower", 1), ("floor", 1), ("unit_no", 1)]).to_list(5000)
    counts = {s: await db.units.count_documents({"project_id": project_id, "status": s}) for s in UNIT_STATUSES}
    counts["total"] = await db.units.count_documents({"project_id": project_id})
    return {"items": items, "counts": counts}


@api.post("/projects/{project_id}/units", dependencies=[Depends(require_roles("admin", "developer"))])
async def create_unit(project_id: str, body: dict = Body(...), u: dict = Depends(current_user)):
    if not await db.projects.find_one({"id": project_id}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Project not found")
    body.pop("id", None); body.pop("_id", None); body.pop("history", None)
    body["project_id"] = project_id
    if body.get("status") not in UNIT_STATUSES:
        body["status"] = "available"
    unit = Unit(**body)
    unit.history = [{"from": None, "to": unit.status, "at": _now_iso_str(), "by": u["sub"], "note": "created"}]
    await db.units.insert_one(unit.model_dump())
    return _clean(unit.model_dump())


@api.post("/projects/{project_id}/units/bulk", dependencies=[Depends(require_roles("admin", "developer"))])
async def bulk_create_units(project_id: str, body: dict = Body(...), u: dict = Depends(current_user)):
    """Bulk-generate units from a grid pattern.
    body: {tower, floor_from, floor_to, units_per_floor, unit_no_prefix, typology,
           carpet_area, price, start_index (default 1)}
    Skips duplicates (same project_id + unit_no).
    """
    if not await db.projects.find_one({"id": project_id}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Project not found")
    tower = body.get("tower") or "A"
    floor_from = int(body.get("floor_from", 1))
    floor_to = int(body.get("floor_to", floor_from))
    upf = int(body.get("units_per_floor", 1))
    prefix = body.get("unit_no_prefix", "")
    start_index = int(body.get("start_index", 1))
    typology = body.get("typology")
    carpet_area = body.get("carpet_area")
    price = body.get("price")

    if floor_to < floor_from or upf < 1 or upf > 50:
        raise HTTPException(400, "Invalid range")

    to_insert = []
    now = _now_iso_str()
    for floor in range(floor_from, floor_to + 1):
        for i in range(upf):
            unit_no = f"{prefix}{floor:02d}{(start_index + i):02d}"
            unit = Unit(
                project_id=project_id, unit_no=unit_no, tower=tower, floor=floor,
                typology=typology, carpet_area=carpet_area, price=price, status="available",
                history=[{"from": None, "to": "available", "at": now, "by": u["sub"], "note": "bulk_created"}],
            )
            to_insert.append(unit.model_dump())

    # Skip duplicates
    existing_nos = set(d["unit_no"] for d in await db.units.find(
        {"project_id": project_id, "unit_no": {"$in": [d["unit_no"] for d in to_insert]}},
        {"_id": 0, "unit_no": 1}).to_list(len(to_insert)))
    fresh = [d for d in to_insert if d["unit_no"] not in existing_nos]
    if fresh:
        await db.units.insert_many(fresh)
    return {"created": len(fresh), "skipped_duplicates": len(to_insert) - len(fresh)}


@api.put("/units/{uid}", dependencies=[Depends(require_roles("admin", "developer"))])
async def update_unit(uid: str, body: dict = Body(...), u: dict = Depends(current_user)):
    doc = await db.units.find_one({"id": uid}, PROJ)
    if not doc:
        raise HTTPException(404, "Unit not found")
    body.pop("_id", None); body.pop("id", None); body.pop("history", None); body.pop("project_id", None)
    status_note = body.pop("status_note", "")

    new_status = body.get("status")
    if new_status is not None and new_status not in UNIT_STATUSES:
        raise HTTPException(400, f"Invalid status. Allowed: {UNIT_STATUSES}")

    update = {"$set": {**body, "updated_at": _now_iso_str()}}
    if new_status and new_status != doc.get("status"):
        entry = {"from": doc.get("status"), "to": new_status, "at": _now_iso_str(),
                 "by": u["sub"], "note": status_note or ""}
        update["$push"] = {"history": entry}

    await db.units.update_one({"id": uid}, update)
    return await db.units.find_one({"id": uid}, PROJ)


@api.delete("/units/{uid}", dependencies=[Depends(require_roles("admin"))])
async def delete_unit(uid: str):
    res = await db.units.delete_one({"id": uid})
    if not res.deleted_count:
        raise HTTPException(404, "Unit not found")
    return {"deleted": res.deleted_count}


# ---------------- Homepage (curated) ----------------
@api.get("/homepage")
async def homepage_bundle():
    featured_projects = await db.projects.find(
        {"show_featured_residential": True, "status": "active"}, PROJ
    ).limit(6).to_list(6)
    if not featured_projects:  # fallback to featured flag or newest
        featured_projects = await db.projects.find({"featured": True, "status": "active"}, PROJ).limit(6).to_list(6)

    commercial_projects = await db.projects.find(
        {"show_commercial_homepage": True, "status": "active"}, PROJ
    ).limit(3).to_list(3)

    investor_properties = await db.properties.find(
        {"investor_property": True, "status": "active"}, PROJ
    ).limit(3).to_list(3)
    if not investor_properties:
        investor_properties = await db.properties.find({"featured": True, "status": "active"}, PROJ).limit(3).to_list(3)

    best_resale = await db.properties.find(
        {"best_resale": True, "status": "active", "listing_type": "sale"}, PROJ
    ).limit(3).to_list(3)
    if not best_resale:
        best_resale = await db.properties.find({"status": "active", "listing_type": "sale"}, PROJ).sort([("views", -1)]).limit(3).to_list(3)

    top_developers = await db.developers.find({"show_on_homepage": True}, PROJ).limit(9).to_list(9)
    if not top_developers:
        top_developers = await db.developers.find({}, PROJ).limit(9).to_list(9)

    testimonials = await db.testimonials.find({"show_on_homepage": True, "published": True}, PROJ).limit(6).to_list(6)
    if not testimonials:
        testimonials = await db.testimonials.find({"published": True}, PROJ).limit(6).to_list(6)

    # Categories with property counts (derived from property_type)
    types = ["apartment", "villa", "shop", "office", "plot"]
    categories = []
    for t in types:
        count = await db.properties.count_documents({"property_type": t, "status": "active"})
        categories.append({"slug": t, "label": t.title(), "count": count})

    # Cities with counts
    city_slugs = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"]
    cities = []
    for c in city_slugs:
        loc = await db.locations.find_one({"slug": c, "type": "city"}, PROJ)
        count = await db.properties.count_documents({"city": c, "status": "active"})
        cities.append({"slug": c, "name": (loc or {}).get("name", c.title()),
                       "image": (loc or {}).get("hero_image"), "count": count})

    return {"featured_projects": featured_projects, "commercial_projects": commercial_projects,
            "investor_properties": investor_properties, "best_resale": best_resale,
            "top_developers": top_developers, "testimonials": testimonials,
            "categories": categories, "cities": cities}


# ---------------- Blogs ----------------
@api.get("/blogs")
async def list_blogs(q: Optional[str] = None, category: Optional[str] = None, limit: int = 20):
    query: dict[str, Any] = {"published": True}
    if category: query["category"] = category
    if q: query["title"] = {"$regex": q, "$options": "i"}
    return await db.blogs.find(query, PROJ).sort([("created_at", -1)]).to_list(limit)


@api.get("/blogs/{slug}")
async def get_blog(slug: str):
    doc = await db.blogs.find_one({"slug": slug}, PROJ)
    if not doc:
        raise HTTPException(404, "Blog not found")
    related = await db.blogs.find({"slug": {"$ne": slug}, "published": True}, PROJ).limit(3).to_list(3)
    return {**doc, "related": related}


@api.get("/admin/blogs", dependencies=[Depends(require_roles("admin"))])
async def admin_list_blogs():
    return await db.blogs.find({}, PROJ).sort([("created_at", -1)]).to_list(500)


@api.post("/admin/blogs", dependencies=[Depends(require_roles("admin"))])
async def admin_create_blog(body: Blog):
    if not body.slug:
        body.slug = body.title.lower().replace(" ", "-").replace("&", "and")
        body.slug = "".join(c for c in body.slug if c.isalnum() or c == "-")[:80] or "post"
    await db.blogs.insert_one(body.model_dump())
    return _clean(body.model_dump())


@api.put("/admin/blogs/{bid}", dependencies=[Depends(require_roles("admin"))])
async def admin_update_blog(bid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None)
    body["updated_at"] = _now_iso_str()
    await db.blogs.update_one({"id": bid}, {"$set": body})
    return await db.blogs.find_one({"id": bid}, PROJ)


@api.delete("/admin/blogs/{bid}", dependencies=[Depends(require_roles("admin"))])
async def admin_delete_blog(bid: str):
    r = await db.blogs.delete_one({"id": bid})
    return {"deleted": r.deleted_count}


# ---------------- Testimonials ----------------
@api.get("/testimonials")
async def list_testimonials(limit: int = 12):
    return await db.testimonials.find({"published": True}, PROJ).to_list(limit)


@api.get("/admin/testimonials", dependencies=[Depends(require_roles("admin"))])
async def admin_list_testimonials():
    return await db.testimonials.find({}, PROJ).sort([("created_at", -1)]).to_list(500)


@api.post("/admin/testimonials", dependencies=[Depends(require_roles("admin"))])
async def admin_create_testimonial(body: Testimonial):
    await db.testimonials.insert_one(body.model_dump())
    return _clean(body.model_dump())


@api.put("/admin/testimonials/{tid}", dependencies=[Depends(require_roles("admin"))])
async def admin_update_testimonial(tid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None)
    body["updated_at"] = _now_iso_str()
    await db.testimonials.update_one({"id": tid}, {"$set": body})
    return await db.testimonials.find_one({"id": tid}, PROJ)


@api.delete("/admin/testimonials/{tid}", dependencies=[Depends(require_roles("admin"))])
async def admin_delete_testimonial(tid: str):
    r = await db.testimonials.delete_one({"id": tid})
    return {"deleted": r.deleted_count}


# ---------------- FAQs ----------------
@api.get("/faqs")
async def list_faqs(category: Optional[str] = None):
    q: dict[str, Any] = {"published": True}
    if category:
        q["category"] = category
    return await db.faqs.find(q, PROJ).sort([("order", 1), ("created_at", 1)]).to_list(200)


@api.get("/admin/faqs", dependencies=[Depends(require_roles("admin"))])
async def admin_list_faqs():
    return await db.faqs.find({}, PROJ).sort([("order", 1), ("created_at", 1)]).to_list(500)


@api.post("/admin/faqs", dependencies=[Depends(require_roles("admin"))])
async def admin_create_faq(body: FAQ):
    await db.faqs.insert_one(body.model_dump())
    return _clean(body.model_dump())


@api.put("/admin/faqs/{fid}", dependencies=[Depends(require_roles("admin"))])
async def admin_update_faq(fid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None)
    body["updated_at"] = _now_iso_str()
    await db.faqs.update_one({"id": fid}, {"$set": body})
    return await db.faqs.find_one({"id": fid}, PROJ)


@api.delete("/admin/faqs/{fid}", dependencies=[Depends(require_roles("admin"))])
async def admin_delete_faq(fid: str):
    r = await db.faqs.delete_one({"id": fid})
    return {"deleted": r.deleted_count}


# ---------------- Site Settings ----------------
@api.get("/settings")
async def get_settings_public():
    """Public: returns the site settings singleton (used by header/footer/homepage)."""
    doc = await db.settings.find_one({"key": "default"}, PROJ)
    if not doc:
        default = SiteSettings()
        await db.settings.insert_one(default.model_dump())
        return _clean(default.model_dump())
    return doc


@api.put("/admin/settings", dependencies=[Depends(require_roles("admin"))])
async def admin_update_settings(body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None); body.pop("key", None)
    body["updated_at"] = _now_iso_str()
    existing = await db.settings.find_one({"key": "default"}, PROJ)
    if not existing:
        seed = SiteSettings(**{k: v for k, v in body.items() if v is not None}).model_dump()
        await db.settings.insert_one(seed)
        return _clean(seed)
    await db.settings.update_one({"key": "default"}, {"$set": body})
    return await db.settings.find_one({"key": "default"}, PROJ)


# ---------------- Admin: Users ----------------
@api.get("/admin/users", dependencies=[Depends(require_roles("admin"))])
async def admin_list_users(role: Optional[str] = None, q: Optional[str] = None):
    query: dict[str, Any] = {}
    if role:
        query["role"] = role
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort([("created_at", -1)]).to_list(500)
    return users


@api.put("/admin/users/{uid}", dependencies=[Depends(require_roles("admin"))])
async def admin_update_user(uid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None); body.pop("password_hash", None); body.pop("email", None)
    body["updated_at"] = _now_iso_str()
    await db.users.update_one({"id": uid}, {"$set": body})
    return await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})


@api.post("/admin/users", dependencies=[Depends(require_roles("admin"))])
async def admin_create_user(body: dict = Body(...)):
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = (body.get("password") or "").strip()
    role = body.get("role") or "user"
    if role not in {"user", "agent", "developer", "owner", "admin", "super_admin"}:
        raise HTTPException(400, "Invalid role")
    if not name or not email or len(password) < 8:
        raise HTTPException(400, "Name, valid email and password (min 8 chars) are required")
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    u = User(name=name, email=email, phone=(body.get("phone") or "").strip() or None,
             password_hash=hash_password(password), role=role,
             verified=bool(body.get("verified", True)), active=bool(body.get("active", True)))
    await db.users.insert_one(u.model_dump())
    if not u.verified and (os.environ.get("SMTP_HOST") or os.environ.get("EMERGENT_EMAIL_KEY")):
        await _send_verification_email(u)
    return UserOut(**u.model_dump()).model_dump()


@api.post("/admin/users/{uid}/reset-password", dependencies=[Depends(require_roles("admin"))])
async def admin_reset_password(uid: str):
    doc=await db.users.find_one({"id":uid},PROJ)
    if not doc: raise HTTPException(404,"User not found")
    raw=secrets.token_urlsafe(48); now=datetime.now(timezone.utc)
    await db.password_resets.delete_many({"user_id":uid})
    await db.password_resets.insert_one({"user_id":uid,"token_hash":_token_hash(raw),"expires_at":now+timedelta(minutes=30),"used":False,"created_at":now})
    frontend_url=os.environ.get("FRONTEND_URL", os.environ.get("SITE_URL", "http://localhost:3000")).rstrip("/")
    link=f"{frontend_url}/reset-password?token={raw}"
    sent=await send_account_email(doc["email"],"CarpetAdda password reset",f"<p>Hello {doc.get('name','User')},</p><p>An administrator requested a password reset for your account.</p><p><a href=\"{link}\">Reset Password</a></p><p>This link expires in 30 minutes and can be used once.</p>")
    if not sent: raise HTTPException(502,"Password reset email could not be sent. Configure email settings first.")
    return {"ok":True,"message":"Password reset link sent to the user's registered email."}


@api.delete("/admin/users/{uid}", dependencies=[Depends(require_roles("admin"))])
async def admin_delete_user(uid: str, current: dict = Depends(current_user)):
    if uid == current["sub"]:
        raise HTTPException(400, "You cannot delete your own account")
    r = await db.users.delete_one({"id": uid})
    return {"deleted": r.deleted_count}


# ---------------- Amenities ----------------
@api.get("/amenities")
async def list_amenities():
    return await db.amenities.find({"active": True}, PROJ).to_list(200)


@api.post("/admin/amenities", dependencies=[Depends(require_roles("admin", "agent", "developer", "owner"))])
async def create_amenity(body: dict = Body(...)):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Amenity name required")
    existing = await db.amenities.find_one({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}, PROJ)
    if existing:
        return existing
    a = Amenity(name=name, category=body.get("category") or "General")
    await db.amenities.insert_one(a.model_dump())
    return _clean(a.model_dump())


# ---------------- Media Uploads (persistent local storage) ----------------
ALLOWED_UPLOAD_KINDS = {"blogs", "testimonials", "og", "properties", "projects", "developers", "agents", "general"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024

@api.post("/admin/uploads", dependencies=[Depends(require_roles("admin"))])
async def admin_upload(kind: str = Query("general"), file: UploadFile = File(...)):
    if kind not in ALLOWED_UPLOAD_KINDS: raise HTTPException(400, f"Invalid kind. Allowed: {sorted(ALLOWED_UPLOAD_KINDS)}")
    data=await file.read()
    if len(data)>MAX_UPLOAD_BYTES: raise HTTPException(400, "File too large. Max 8 MB")
    if not (file.content_type or "").startswith(("image/","application/pdf")): raise HTTPException(400,"Only image or PDF uploads are allowed")
    path=build_upload_path(kind,file.filename or "upload.bin"); ct=file.content_type or guess_content_type(file.filename or "")
    try: result=put_object(path,data,ct)
    except Exception as e: raise HTTPException(500,f"Upload failed: {e}")
    file_doc={"id":path.split("/")[-1].rsplit(".",1)[0],"storage_path":path,"original_filename":file.filename,"content_type":ct,"size":len(data),"kind":kind,"is_deleted":False,"created_at":_now_iso_str()}
    await db.files.insert_one(file_doc)
    return {"ok":True,"url":f"/api/files/{path}","path":path,"size":len(data),"content_type":ct}

@api.get("/files/{path:path}")
async def serve_file(path: str):
    rec=await db.files.find_one({"storage_path":path,"is_deleted":False},{"_id":0})
    if not rec: raise HTTPException(404,"File not found")
    try: data,ct=get_object(path)
    except Exception: raise HTTPException(404,"File not found")
    return Response(content=data,media_type=rec.get("content_type") or ct,headers={"Cache-Control":"public, max-age=86400"})

# ---------------- Leads / Enquiries ----------------
@api.post("/leads")
async def create_lead(body: Lead, background: BackgroundTasks):
    # basic validation
    phone_digits = "".join(ch for ch in (body.phone or "") if ch.isdigit())
    if len(phone_digits) < 10:
        raise HTTPException(400, "Valid 10-digit mobile number required")
    if not (body.name or "").strip():
        raise HTTPException(400, "Name required")

    lead_dict = body.model_dump()
    await db.leads.insert_one(lead_dict)

    # enrich context (property / project title) for the notification email
    ctx: dict[str, str] = {}
    extra_recipients: list[str] = []
    if body.property_id:
        prop = await db.properties.find_one({"id": body.property_id}, {"_id": 0, "title": 1, "agent_id": 1, "owner_id": 1, "status": 1})
        if prop:
            ctx["property_title"] = prop.get("title")
            # notify the assigned/owning agent only when the listing is live (approved)
            if prop.get("status") == "active":
                for ref in (prop.get("agent_id"), prop.get("owner_id")):
                    if not ref:
                        continue
                    agent = await db.agents.find_one({"id": ref}, {"_id": 0, "email": 1}) or \
                            await db.users.find_one({"id": ref}, {"_id": 0, "email": 1, "active": 1, "role": 1})
                    if agent and agent.get("email") and agent.get("active", True) is not False:
                        if agent["email"] not in extra_recipients:
                            extra_recipients.append(agent["email"])
    if body.project_id:
        proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0, "name": 1, "owner_id": 1, "status": 1})
        if proj:
            ctx["project_name"] = proj.get("name")
            if proj.get("status") == "active" and proj.get("owner_id"):
                dev = await db.users.find_one({"id": proj["owner_id"]}, {"_id": 0, "email": 1, "active": 1, "role": 1})
                if dev and dev.get("email") and dev.get("active", True) is not False and dev.get("role") in ("developer", "agent"):
                    if dev["email"] not in extra_recipients:
                        extra_recipients.append(dev["email"])
    if extra_recipients:
        ctx["extra_recipients"] = extra_recipients

    kind_map = {
        "property_page": "Property",
        "project_page": "Project",
        "contact_page": "Contact",
        "callback": "Callback",
        "get_price": "Get Price",
        "footer": "Contact",
        "home_loan": "Home Loan",
        "home_vip_concierge": "Concierge",
    }
    kind = kind_map.get(body.source, "Website")

    # non-blocking email dispatch — never blocks or fails the API response
    background.add_task(send_lead_notification, lead_dict, kind, ctx)

    return {"ok": True, "id": body.id, "message": "Enquiry submitted. Our team will contact you shortly."}


@api.get("/leads", dependencies=[Depends(require_roles("admin", "agent"))])
async def list_leads(status: Optional[str] = None, limit: int = 100):
    query = {"status": status} if status else {}
    return await db.leads.find(query, PROJ).sort([("created_at", -1)]).to_list(limit)


@api.put("/leads/{lid}", dependencies=[Depends(require_roles("admin", "agent"))])
async def update_lead(lid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None)
    await db.leads.update_one({"id": lid}, {"$set": body})
    return await db.leads.find_one({"id": lid}, PROJ)


@api.delete("/leads/{lid}", dependencies=[Depends(require_roles("admin"))])
async def delete_lead(lid: str):
    res = await db.leads.delete_one({"id": lid})
    return {"deleted": res.deleted_count}


# ---------------- Site Visits ----------------
@api.post("/site-visits")
async def create_site_visit(body: SiteVisit, background: BackgroundTasks):
    phone_digits = "".join(ch for ch in (body.phone or "") if ch.isdigit())
    if len(phone_digits) < 10:
        raise HTTPException(400, "Valid 10-digit mobile number required")
    if not (body.name or "").strip():
        raise HTTPException(400, "Name required")
    if not (body.visit_date or "").strip():
        raise HTTPException(400, "Preferred visit date required")

    visit_dict = body.model_dump()
    await db.site_visits.insert_one(visit_dict)

    ctx: dict[str, str] = {}
    if body.property_id:
        prop = await db.properties.find_one({"id": body.property_id}, {"_id": 0, "title": 1})
        if prop:
            ctx["property_title"] = prop.get("title")
    if body.project_id:
        proj = await db.projects.find_one({"id": body.project_id}, {"_id": 0, "name": 1})
        if proj:
            ctx["project_name"] = proj.get("name")

    # normalise for email helper
    lead_shaped = {
        **visit_dict,
        "message": visit_dict.get("notes"),
        "preferred_visit_date": visit_dict.get("visit_date"),
        "preferred_visit_time": visit_dict.get("visit_time"),
        "source": "site_visit_form",
    }
    background.add_task(send_lead_notification, lead_shaped, "Site Visit", ctx)
    return {"ok": True, "id": body.id, "message": "Site visit requested. We'll confirm shortly."}


@api.get("/site-visits", dependencies=[Depends(require_roles("admin", "agent"))])
async def list_site_visits(limit: int = 100):
    rows = await db.site_visits.find({}, PROJ).sort([("created_at", -1)]).to_list(limit)
    for r in rows:
        if r.get("property_id") and not r.get("property_title"):
            prop = await db.properties.find_one({"id": r["property_id"]}, {"_id": 0, "title": 1, "agent_id": 1})
            if prop:
                r["property_title"] = prop.get("title")
                if prop.get("agent_id"):
                    ag = await db.agents.find_one({"id": prop["agent_id"]}, {"_id": 0, "name": 1})
                    if ag:
                        r["agent_name"] = ag.get("name")
        if r.get("project_id") and not r.get("project_name"):
            proj = await db.projects.find_one({"id": r["project_id"]}, {"_id": 0, "name": 1, "owner_id": 1})
            if proj:
                r["project_name"] = proj.get("name")
                if proj.get("owner_id"):
                    dev = await db.users.find_one({"id": proj["owner_id"]}, {"_id": 0, "name": 1})
                    if dev:
                        r["developer_name"] = dev.get("name")
    return rows


# ---------------- Favorites ----------------
@api.get("/favorites")
async def my_favorites(u: dict = Depends(current_user)):
    favs = await db.favorites.find({"user_id": u["sub"]}, PROJ).to_list(200)
    pids = [f["property_id"] for f in favs]
    props = await db.properties.find({"id": {"$in": pids}}, PROJ).to_list(200)
    return props


@api.post("/favorites/{property_id}")
async def add_favorite(property_id: str, u: dict = Depends(current_user)):
    existing = await db.favorites.find_one({"user_id": u["sub"], "property_id": property_id})
    if existing:
        return {"ok": True, "already": True}
    fav = Favorite(user_id=u["sub"], property_id=property_id)
    await db.favorites.insert_one(fav.model_dump())
    return {"ok": True}


@api.delete("/favorites/{property_id}")
async def remove_favorite(property_id: str, u: dict = Depends(current_user)):
    res = await db.favorites.delete_one({"user_id": u["sub"], "property_id": property_id})
    return {"deleted": res.deleted_count}


# ---------------- Saved Searches ----------------
@api.get("/saved-searches")
async def my_saved_searches(u: dict = Depends(current_user)):
    return await db.saved_searches.find({"user_id": u["sub"]}, PROJ).to_list(50)


@api.post("/saved-searches")
async def save_search(body: dict, u: dict = Depends(current_user)):
    ss = SavedSearch(user_id=u["sub"], name=body.get("name", "Saved Search"),
                     filters=body.get("filters", {}),
                     alert_frequency=body.get("alert_frequency", "instant"))
    await db.saved_searches.insert_one(ss.model_dump())
    return ss.model_dump()


@api.delete("/saved-searches/{sid}")
async def delete_saved_search(sid: str, u: dict = Depends(current_user)):
    res = await db.saved_searches.delete_one({"id": sid, "user_id": u["sub"]})
    return {"deleted": res.deleted_count}


# ---------------- Compare ----------------
@api.post("/compare")
async def compare_properties(body: dict = Body(...)):
    ids = body.get("ids", [])[:4]
    return await db.properties.find({"id": {"$in": ids}}, PROJ).to_list(4)


# ---------------- Admin Stats ----------------
@api.get("/admin/stats", dependencies=[Depends(require_roles("admin"))])
async def admin_stats():
    return {
        "properties_total": await db.properties.count_documents({"status": {"$ne": "archived"}}),
        "properties_active": await db.properties.count_documents({"status": "active"}),
        "properties_archived": await db.properties.count_documents({"status": "archived"}),
        "properties_pending": await db.properties.count_documents({"status": "pending_review"}),
        "projects_total": await db.projects.count_documents({"status": {"$ne": "archived"}}),
        "projects_archived": await db.projects.count_documents({"status": "archived"}),
        "projects_pending": await db.projects.count_documents({"status": "pending_review"}),
        "approved_total": await db.properties.count_documents({"status": "active"}) + await db.projects.count_documents({"status": "active"}),
        "agents_total": await db.users.count_documents({"role": "agent"}),
        "developers_total": await db.users.count_documents({"role": "developer"}),
        "leads_total": await db.leads.count_documents({}),
        "leads_new": await db.leads.count_documents({"status": "new"}),
        "site_visits_total": await db.site_visits.count_documents({}),
        "users_total": await db.users.count_documents({}),
    }


# ---------------- AI: Natural language search ----------------
class AISearchInput(BaseModel):
    query: str


AI_SYSTEM = (
    "You are a real estate search filter extractor for an Indian property portal. "
    "Given a user's natural-language query, return ONLY a compact JSON object of filters. "
    "Valid keys: listing_type (sale|rent), category (residential|commercial), "
    "property_type (apartment|villa|plot|office|shop|warehouse), city (mumbai|thane|navi-mumbai|dombivli|kalyan), "
    "location (locality slug like dombivli-east, thane-west, bandra-west, kharghar, andheri-west, powai, worli, vashi), "
    "bhk (1..5 as integer), price_min, price_max (both as INR numbers — convert '80 lakh' to 8000000, '1.2 crore' to 12000000), "
    "area_min, area_max (in sqft), furnishing (unfurnished|semi|fully), verified (true), rera (true). "
    "Return ONLY the JSON object, no prose, no markdown fences."
)


@api.post("/ai/search")
async def ai_search(body: AISearchInput):
    # Deployment-safe natural-language parser. This deliberately avoids a paid/remote
    # LLM dependency so search remains functional on a normal Python deployment.
    q = (body.query or "").lower()
    filters: dict[str, Any] = {}

    if re.search(r"\\b(rent|rental|lease)\\b", q):
        filters["listing_type"] = "rent"
    elif re.search(r"\\b(buy|sale|purchase|buying)\\b", q):
        filters["listing_type"] = "sale"
    if "commercial" in q:
        filters["category"] = "commercial"
    elif "residential" in q or "home" in q or "flat" in q:
        filters["category"] = "residential"

    property_types = {
        "villa": "villa", "plot": "plot", "office": "office",
        "shop": "shop", "warehouse": "warehouse", "apartment": "apartment",
        "flat": "apartment",
    }
    for word, value in property_types.items():
        if re.search(rf"\\b{re.escape(word)}s?\\b", q):
            filters["property_type"] = value
            break

    cities = ["navi-mumbai", "dombivli", "kalyan", "thane", "mumbai"]
    city_labels = {"navi-mumbai": "navi-mumbai", "navi mumbai": "navi-mumbai",
                   "dombivli": "dombivli", "kalyan": "kalyan", "thane": "thane", "mumbai": "mumbai"}
    for label, value in city_labels.items():
        if label in q:
            filters["city"] = value
            break

    bhk_match = re.search(r"\\b([1-5])\\s*bhk\\b", q)
    if bhk_match:
        filters["bhk"] = int(bhk_match.group(1))

    def money_value(number: str, unit: str | None) -> float:
        value = float(number.replace(",", ""))
        if unit and unit.lower() in {"l", "lac", "lakh", "lakhs"}:
            return value * 100_000
        if unit and unit.lower() in {"cr", "crore", "crores"}:
            return value * 10_000_000
        return value

    money_matches = re.findall(r"(?:₹|rs\\.?\\s*)?([0-9]+(?:\\.[0-9]+)?)\\s*(crore|crores|cr|lakh|lakhs|lac|l)?\\b", q)
    values = [money_value(n, u) for n, u in money_matches if u or float(n.replace(",", "")) >= 100000]
    if values:
        if "under" in q or "below" in q or "upto" in q or "up to" in q:
            filters["price_max"] = max(values)
        elif "above" in q or "over" in q or "minimum" in q or "from" in q:
            filters["price_min"] = min(values)
        elif len(values) >= 2:
            filters["price_min"], filters["price_max"] = min(values), max(values)
        else:
            filters["price_max"] = values[0]

    area_match = re.search(r"(?:under|below|upto|up to|around)?\\s*([0-9,]+)\\s*(?:sq\\.?\\s*ft|sqft|square feet)", q)
    if area_match:
        filters["area_max"] = float(area_match.group(1).replace(",", "")) if ("under" in q or "below" in q or "upto" in q or "up to" in q) else float(area_match.group(1).replace(",", ""))

    for term, value in [("fully furnished", "fully"), ("semi furnished", "semi"), ("unfurnished", "unfurnished")]:
        if term in q:
            filters["furnishing"] = value
            break
    if "rera" in q:
        filters["rera"] = True
    if "verified" in q:
        filters["verified"] = True

    query = build_property_query(
        filters.get("listing_type"), filters.get("category"), filters.get("property_type"),
        filters.get("city"), filters.get("location"),
        int(filters["bhk"]) if filters.get("bhk") else None,
        filters.get("price_min"), filters.get("price_max"),
        filters.get("area_min"), filters.get("area_max"),
        filters.get("furnishing"), None,
        filters.get("verified"), None, filters.get("rera"),
        None, None, None, None,
    )
    items = await db.properties.find(query, PROJ).sort([("featured", -1), ("created_at", -1)]).limit(12).to_list(12)
    return {"filters": filters, "items": items, "count": len(items),
            "explanation": f"Extracted {len(filters)} filters and found {len(items)} matching properties."}


# ---------------- AI: Chatbot ----------------
class ChatInput(BaseModel):
    query: str
    session_id: Optional[str] = None


@api.post("/ai/chat")
async def ai_chat(body: ChatInput):
    # Pull a small context slice from DB
    top_props = await db.properties.find({"featured": True}, PROJ).limit(6).to_list(6)
    top_projs = await db.projects.find({"featured": True}, PROJ).limit(4).to_list(4)
    context_summary = {
        "top_properties": [
            {"title": p["title"], "price": p["price"], "city": p["city"],
             "bhk": p.get("bhk"), "slug": p["slug"]}
            for p in top_props
        ],
        "top_projects": [
            {"name": p["name"], "developer_id": p.get("developer_id"),
             "price_from": p["price_from"], "city": p["city"], "slug": p["slug"]}
            for p in top_projs
        ],
        "cities_served": ["Mumbai", "Thane", "Navi Mumbai", "Dombivli", "Kalyan"],
    }
    system = (
        "You are CarpetAdda Concierge, a helpful assistant for an Indian real estate portal serving Mumbai, "
        "Thane, Navi Mumbai, Dombivli and Kalyan. Answer using ONLY the provided context or general "
        "real-estate knowledge. NEVER invent property names, prices, RERA numbers or availability. "
        "If the user asks for specifics you don't know, invite them to enquire or browse listings. "
        "Keep answers under 120 words, professional, warm. Use INR ₹ Lakh/Crore formatting. "
        f"\n\nCONTEXT:\n{json.dumps(context_summary)}"
    )
    # Keep the endpoint useful without requiring an external LLM service.
    # For deployment reliability, answer from the live database context only.
    if top_props:
        picks = "; ".join(
            f"{p.get('title', 'Property')} ({p.get('city', '')}, ₹{float(p.get('price', 0)):,.0f})"
            for p in top_props[:3]
        )
        reply = (
            f"Based on our featured listings, you may want to explore: {picks}. "
            "Tell me your preferred location, BHK and budget and I can narrow the search."
        )
    elif top_projs:
        picks = "; ".join(p.get("name", "Project") for p in top_projs[:3])
        reply = f"Our featured projects include {picks}. Tell me your location and budget and I can help you shortlist."
    else:
        reply = "Tell me your preferred location, BHK or property type and budget, and I can help you search CarpetAdda listings."
    return {"reply": reply}


# ---------------- CMS Pages ----------------
def _slugify(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", (s or "").lower())).strip("-")


@api.get("/pages")
async def list_published_pages():
    return await db.pages.find({"published": True}, {"_id": 0, "id": 1, "title": 1, "slug": 1}).sort([("title", 1)]).to_list(100)


@api.get("/pages/{slug}")
async def get_page(slug: str):
    doc = await db.pages.find_one({"slug": slug, "published": True}, PROJ)
    if not doc:
        raise HTTPException(404, "Page not found")
    return doc


@api.get("/admin/pages", dependencies=[Depends(require_roles("admin"))])
async def admin_list_pages():
    return await db.pages.find({}, PROJ).sort([("title", 1)]).to_list(200)


@api.post("/admin/pages", dependencies=[Depends(require_roles("admin"))])
async def admin_create_page(body: dict = Body(...)):
    title = (body.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "Title required")
    slug = _slugify(body.get("slug") or title)
    if await db.pages.find_one({"slug": slug}):
        raise HTTPException(400, "A page with this slug already exists")
    p = Page(title=title, slug=slug, content=body.get("content") or "",
             published=bool(body.get("published", False)), seo=body.get("seo") or {})
    await db.pages.insert_one(p.model_dump())
    return _clean(p.model_dump())


@api.put("/admin/pages/{pid}", dependencies=[Depends(require_roles("admin"))])
async def admin_update_page(pid: str, body: dict = Body(...)):
    body.pop("_id", None); body.pop("id", None); body.pop("created_at", None)
    if body.get("slug"):
        body["slug"] = _slugify(body["slug"])
    body["updated_at"] = _now_iso_str()
    res = await db.pages.update_one({"id": pid}, {"$set": body})
    if not res.matched_count:
        raise HTTPException(404, "Not found")
    return await db.pages.find_one({"id": pid}, PROJ)


@api.delete("/admin/pages/{pid}", dependencies=[Depends(require_roles("admin"))])
async def admin_delete_page(pid: str):
    res = await db.pages.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


# ---------------- SEO: per-page meta management ----------------
@api.get("/seo")
async def get_seo_for_page(page: str = "/"):
    doc = await db.seo_pages.find_one({"page": page}, PROJ)
    return doc or {"page": page}


@api.get("/admin/seo-pages", dependencies=[Depends(require_roles("admin"))])
async def admin_list_seo_pages():
    return await db.seo_pages.find({}, PROJ).sort([("page", 1)]).to_list(500)


@api.put("/admin/seo-pages", dependencies=[Depends(require_roles("admin"))])
async def admin_upsert_seo_page(body: dict = Body(...)):
    page = (body.get("page") or "").strip()
    if not page:
        raise HTTPException(400, "page is required")
    body.pop("_id", None); body.pop("id", None); body.pop("created_at", None)
    body["page"] = page
    body["updated_at"] = _now_iso_str()
    seed = SeoPage(page=page)
    await db.seo_pages.update_one(
        {"page": page},
        {"$set": body, "$setOnInsert": {"id": seed.id, "created_at": seed.created_at}},
        upsert=True,
    )
    return await db.seo_pages.find_one({"page": page}, PROJ)


# ---------------- SEO: Sitemap ----------------
@api.get("/sitemap")
async def sitemap():
    props = await db.properties.find({"status": "active"}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(2000)
    projs = await db.projects.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    locs = await db.locations.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    devs = await db.developers.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    ags = await db.agents.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    blogs = await db.blogs.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    return {"properties": props, "projects": projs, "locations": locs,
            "developers": devs, "agents": ags, "blogs": blogs}


# ---------------- Mount ----------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    try:
        init_storage()
    except Exception as e:
        log.warning("Storage init deferred: %s", e)


@app.on_event("shutdown")
async def _shutdown():
    client.close()

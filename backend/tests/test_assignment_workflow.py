"""Iteration 12 assignment, isolation, staged-edit approval, and reject workflow tests."""
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing from /app/frontend/.env")


def credentials_for(role_label):
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    match = re.search(rf"\|\s*{re.escape(role_label)}\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|", content, re.I)
    if not match:
        pytest.skip(f"{role_label} credentials are missing from test_credentials.md")
    return {"email": match.group(1), "password": match.group(2)}


def login(role_label, expected_role):
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=credentials_for(role_label), timeout=30)
    if response.status_code != 200:
        pytest.fail(f"{role_label} authentication failed: {response.status_code} {response.text[:500]}")
    body = response.json()
    assert body["user"]["role"] == expected_role
    assert isinstance(body.get("token"), str) and body["token"]
    session.headers.update({"Authorization": f"Bearer {body['token']}"})
    session.user = body["user"]
    return session


@pytest.fixture(scope="session")
def admin_client():
    return login("Super Admin", "super_admin")


@pytest.fixture(scope="session")
def user_client():
    return login("User", "user")


@pytest.fixture(scope="session")
def agent_client():
    return login("Agent", "agent")


@pytest.fixture(scope="session")
def developer_client():
    return login("Developer", "developer")


def first_active(kind):
    response = requests.get(f"{BASE_URL}/api/{kind}", params={"page_size": 60}, timeout=30)
    assert response.status_code == 200, response.text
    rows = response.json()["items"]
    assert rows, f"At least one active {kind} record is required"
    assert all(row["status"] == "active" for row in rows)
    return next((row for row in rows if not row.get("pending_approval")), rows[0])


def assign(admin, kind, record_id, user_id):
    response = admin.put(
        f"{BASE_URL}/api/admin/{kind}/{record_id}/assign", json={"user_id": user_id}, timeout=30
    )
    assert response.status_code == 200, response.text
    assert response.json() == {"ok": True, "assigned_to": user_id}


def clear_pending(admin, kind, record_id):
    pending = admin.get(f"{BASE_URL}/api/admin/pending-changes", timeout=30)
    if pending.status_code == 200 and any(d["id"] == record_id for d in pending.json()[kind]):
        response = admin.put(f"{BASE_URL}/api/admin/{kind}/{record_id}/changes/reject", timeout=30)
        assert response.status_code == 200, response.text


class TestPropertyAssignmentApproval:
    """Validate assigned property visibility plus approve/reject persistence semantics."""

    def test_property_assign_stage_approve_reject_and_restore(self, admin_client, user_client):
        prop = first_active("properties")
        original_title = prop["title"]
        original_assigned = prop.get("assigned_to")
        approved_title = f"{original_title} QA12-{uuid.uuid4().hex[:6]}"
        rejected_title = f"{approved_title} REJECTED"
        try:
            assign(admin_client, "properties", prop["id"], user_client.user["id"])

            mine = user_client.get(f"{BASE_URL}/api/my/assigned", timeout=30)
            assert mine.status_code == 200, mine.text
            match = next(d for d in mine.json()["properties"] if d["id"] == prop["id"])
            assert match["assigned_to"] == user_client.user["id"]
            assert match["title"] == original_title and match["status"] == "active"

            staged = user_client.put(
                f"{BASE_URL}/api/properties/{prop['id']}", json={"title": approved_title, "status": "draft"}, timeout=30
            )
            assert staged.status_code == 200, staged.text
            assert staged.json()["title"] == original_title
            assert staged.json()["status"] == "active"
            assert staged.json()["pending_approval"] is True
            assert staged.json()["pending_changes"]["title"] == approved_title

            public_before = requests.get(f"{BASE_URL}/api/properties/{prop['id']}", timeout=30)
            assert public_before.status_code == 200
            assert public_before.json()["title"] == original_title

            pending = admin_client.get(f"{BASE_URL}/api/admin/pending-changes", timeout=30)
            assert pending.status_code == 200, pending.text
            pending_doc = next(d for d in pending.json()["properties"] if d["id"] == prop["id"])
            assert pending_doc["pending_changes"]["title"] == approved_title
            assert pending_doc["pending_by_name"] == user_client.user["name"]
            assert pending_doc["assigned_to_name"] == user_client.user["name"]

            approved = admin_client.put(
                f"{BASE_URL}/api/admin/properties/{prop['id']}/changes/approve", timeout=30
            )
            assert approved.status_code == 200 and approved.json() == {"ok": True, "approved": True}
            live = requests.get(f"{BASE_URL}/api/properties/{prop['id']}", timeout=30).json()
            assert live["title"] == approved_title and live["status"] == "active"
            assert "pending_approval" not in live and "pending_changes" not in live

            staged_reject = user_client.put(
                f"{BASE_URL}/api/properties/{prop['id']}", json={"title": rejected_title}, timeout=30
            )
            assert staged_reject.status_code == 200 and staged_reject.json()["pending_approval"] is True
            rejected = admin_client.put(
                f"{BASE_URL}/api/admin/properties/{prop['id']}/changes/reject", timeout=30
            )
            assert rejected.status_code == 200 and rejected.json() == {"ok": True, "approved": False}
            unchanged = requests.get(f"{BASE_URL}/api/properties/{prop['id']}", timeout=30).json()
            assert unchanged["title"] == approved_title and unchanged["status"] == "active"
            assert "pending_approval" not in unchanged and "pending_changes" not in unchanged
        finally:
            clear_pending(admin_client, "properties", prop["id"])
            restore = admin_client.put(
                f"{BASE_URL}/api/properties/{prop['id']}", json={"title": original_title}, timeout=30
            )
            assert restore.status_code == 200, restore.text
            assign(admin_client, "properties", prop["id"], original_assigned)


class TestUserIsolation:
    """Validate assignment is scoped to the target account and direct edit access is denied."""

    def test_agent_assignment_hidden_from_user_and_direct_access_forbidden(self, admin_client, user_client, agent_client):
        prop = first_active("properties")
        original_assigned = prop.get("assigned_to")
        try:
            assign(admin_client, "properties", prop["id"], agent_client.user["id"])
            mine = user_client.get(f"{BASE_URL}/api/my/assigned", timeout=30)
            assert mine.status_code == 200, mine.text
            assert prop["id"] not in {d["id"] for d in mine.json()["properties"]}

            owner_view = user_client.get(f"{BASE_URL}/api/my/properties/{prop['id']}", timeout=30)
            assert owner_view.status_code == 403
            assert owner_view.json() == {"detail": "Not your listing"}

            update = user_client.put(
                f"{BASE_URL}/api/properties/{prop['id']}", json={"title": "TEST_FORBIDDEN"}, timeout=30
            )
            assert update.status_code == 403
            assert update.json() == {"detail": "You can only edit your own listings"}
        finally:
            assign(admin_client, "properties", prop["id"], original_assigned)


class TestProjectAssignmentApproval:
    """Validate assigned live project edits stage, approve, and preserve active status."""

    def test_project_assign_stage_approve_and_restore(self, admin_client, developer_client):
        project = first_active("projects")
        original_name = project["name"]
        original_assigned = project.get("assigned_to")
        edited_name = f"{original_name} QA12-{uuid.uuid4().hex[:6]}"
        try:
            assign(admin_client, "projects", project["id"], developer_client.user["id"])
            mine = developer_client.get(f"{BASE_URL}/api/my/assigned", timeout=30)
            assert mine.status_code == 200, mine.text
            match = next(d for d in mine.json()["projects"] if d["id"] == project["id"])
            assert match["name"] == original_name and match["status"] == "active"

            staged = developer_client.put(
                f"{BASE_URL}/api/projects/{project['id']}", json={"name": edited_name, "status": "draft"}, timeout=30
            )
            assert staged.status_code == 200, staged.text
            assert staged.json()["name"] == original_name and staged.json()["status"] == "active"
            assert staged.json()["pending_changes"]["name"] == edited_name

            public_before = requests.get(f"{BASE_URL}/api/projects/{project['id']}", timeout=30).json()
            assert public_before["name"] == original_name

            pending = admin_client.get(f"{BASE_URL}/api/admin/pending-changes", timeout=30)
            pending_doc = next(d for d in pending.json()["projects"] if d["id"] == project["id"])
            assert pending_doc["pending_changes"]["name"] == edited_name
            assert pending_doc["assigned_to_name"] == developer_client.user["name"]

            approved = admin_client.put(
                f"{BASE_URL}/api/admin/projects/{project['id']}/changes/approve", timeout=30
            )
            assert approved.status_code == 200 and approved.json() == {"ok": True, "approved": True}
            live = requests.get(f"{BASE_URL}/api/projects/{project['id']}", timeout=30).json()
            assert live["name"] == edited_name and live["status"] == "active"
            assert "pending_approval" not in live and "pending_changes" not in live
        finally:
            clear_pending(admin_client, "projects", project["id"])
            restore = admin_client.put(
                f"{BASE_URL}/api/projects/{project['id']}", json={"name": original_name}, timeout=30
            )
            assert restore.status_code == 200, restore.text
            assign(admin_client, "projects", project["id"], original_assigned)


class TestAssignmentAuthorizationAndValidation:
    """Validate admin-only access and assignment target validation."""

    @pytest.mark.parametrize("path", [
        "/api/admin/pending-changes",
        "/api/admin/properties/missing/assign",
        "/api/admin/projects/missing/assign",
    ])
    def test_user_cannot_access_admin_assignment_endpoints(self, user_client, path):
        if path.endswith("assign"):
            response = user_client.put(f"{BASE_URL}{path}", json={"user_id": None}, timeout=30)
        else:
            response = user_client.get(f"{BASE_URL}{path}", timeout=30)
        assert response.status_code == 403
        assert "detail" in response.json()

    def test_assign_unknown_user_and_unknown_listing_return_404(self, admin_client):
        prop = first_active("properties")
        unknown_user = admin_client.put(
            f"{BASE_URL}/api/admin/properties/{prop['id']}/assign",
            json={"user_id": "TEST_unknown-user"}, timeout=30,
        )
        assert unknown_user.status_code == 404
        assert unknown_user.json() == {"detail": "User not found"}

        unknown_listing = admin_client.put(
            f"{BASE_URL}/api/admin/properties/TEST_unknown-property/assign",
            json={"user_id": None}, timeout=30,
        )
        assert unknown_listing.status_code == 404
        assert unknown_listing.json() == {"detail": "Not found"}

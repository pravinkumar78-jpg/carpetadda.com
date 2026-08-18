"""Draft-system API coverage: role scoping, persistence, publishing, deletion, and public visibility."""
import re
import time
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
    response = session.post(f"{BASE_URL}/api/auth/login", json=credentials_for(role_label), timeout=20)
    if response.status_code != 200:
        pytest.fail(f"{role_label} authentication failed: {response.status_code} {response.text[:500]}")
    body = response.json()
    assert body["user"]["role"] == expected_role
    assert isinstance(body.get("token"), str) and body["token"]
    session.headers.update({"Authorization": f"Bearer {body['token']}"})
    session.user = body["user"]
    return session


@pytest.fixture(scope="session")
def user_client():
    return login("User", "user")


@pytest.fixture(scope="session")
def agent_client():
    return login("Agent", "agent")


@pytest.fixture(scope="session")
def developer_client():
    return login("Developer", "developer")


@pytest.fixture(scope="session")
def admin_client():
    return login("Super Admin", "super_admin")


def property_payload(marker, status="draft"):
    return {
        "title": f"TEST_Draft_Property_{marker}",
        "slug": f"test-draft-property-{marker}",
        "listing_type": "sale",
        "property_category": "residential",
        "property_type": "apartment",
        "price": 5100000,
        "city": "dombivli",
        "location": "dombivli-east",
        "status": status,
    }


def project_payload(marker, developer_id, status="draft"):
    return {
        "name": f"TEST_Draft_Project_{marker}",
        "slug": f"test-draft-project-{marker}",
        "developer_id": developer_id,
        "city": "dombivli",
        "location": "dombivli-east",
        "price_from": 5000000,
        "price_to": 9000000,
        "configurations": ["1 BHK", "2 BHK"],
        "status": status,
    }


def create_property(client, marker):
    response = client.post(f"{BASE_URL}/api/properties", json=property_payload(marker), timeout=20)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["title"] == f"TEST_Draft_Property_{marker}"
    assert body["status"] == "draft"
    assert body["owner_id"] == client.user["id"]
    return body


def admin_cleanup(admin_client, collection, record_id):
    response = admin_client.delete(f"{BASE_URL}/api/{collection}/{record_id}", timeout=20)
    assert response.status_code == 200, response.text
    assert response.json()["deleted"] in {0, 1}


class TestDraftAPI:
    """Validate requested draft API workflows against the public preview environment."""

    def test_user_create_update_publish_and_public_non_visibility(self, user_client, admin_client):
        marker = uuid.uuid4().hex[:10]
        draft = create_property(user_client, marker)
        try:
            listed = user_client.get(f"{BASE_URL}/api/drafts", timeout=20)
            assert listed.status_code == 200, listed.text
            matches = [p for p in listed.json()["properties"] if p["id"] == draft["id"]]
            assert len(matches) == 1
            before = matches[0]["updated_at"]

            time.sleep(0.02)
            updated = user_client.put(
                f"{BASE_URL}/api/properties/{draft['id']}", json={"price": 6200000, "status": "draft"}, timeout=20
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["price"] == 6200000
            assert updated.json()["updated_at"] > before

            owner_get = user_client.get(f"{BASE_URL}/api/my/properties/{draft['id']}", timeout=20)
            assert owner_get.status_code == 200
            assert owner_get.json()["price"] == 6200000

            published = user_client.put(
                f"{BASE_URL}/api/properties/{draft['id']}", json={"status": "pending_review"}, timeout=20
            )
            assert published.status_code == 200, published.text
            assert published.json()["status"] == "pending_review"

            drafts_after = user_client.get(f"{BASE_URL}/api/drafts", timeout=20).json()["properties"]
            assert all(p["id"] != draft["id"] for p in drafts_after)
            public_detail = requests.get(f"{BASE_URL}/api/properties/{draft['id']}", timeout=20)
            assert public_detail.status_code == 404
            admin_filtered = admin_client.get(
                f"{BASE_URL}/api/admin/properties", params={"status": "pending_review", "q": marker, "page_size": 20}, timeout=20
            )
            assert admin_filtered.status_code == 200
            assert [p["id"] for p in admin_filtered.json()["items"]] == [draft["id"]]
        finally:
            admin_cleanup(admin_client, "properties", draft["id"])

    def test_delete_draft_removes_document_without_affecting_active_inventory(self, user_client, admin_client):
        active_before = requests.get(f"{BASE_URL}/api/properties", params={"page_size": 1}, timeout=20).json()["total"]
        draft = create_property(user_client, uuid.uuid4().hex[:10])
        deleted = user_client.delete(f"{BASE_URL}/api/drafts/properties/{draft['id']}", timeout=20)
        assert deleted.status_code == 200, deleted.text
        assert deleted.json() == {"deleted": 1}
        missing = user_client.get(f"{BASE_URL}/api/my/properties/{draft['id']}", timeout=20)
        assert missing.status_code == 404
        assert missing.json() == {"detail": "Not found"}
        active_after = requests.get(f"{BASE_URL}/api/properties", params={"page_size": 1}, timeout=20).json()["total"]
        assert active_after == active_before

    def test_role_scoping_and_admin_sees_all_drafts(self, user_client, agent_client, admin_client):
        user_draft = create_property(user_client, uuid.uuid4().hex[:10])
        agent_draft = create_property(agent_client, uuid.uuid4().hex[:10])
        try:
            user_ids = {p["id"] for p in user_client.get(f"{BASE_URL}/api/drafts", timeout=20).json()["properties"]}
            agent_ids = {p["id"] for p in agent_client.get(f"{BASE_URL}/api/drafts", timeout=20).json()["properties"]}
            admin_ids = {p["id"] for p in admin_client.get(f"{BASE_URL}/api/drafts", timeout=20).json()["properties"]}
            assert user_draft["id"] in user_ids and agent_draft["id"] not in user_ids
            assert agent_draft["id"] in agent_ids and user_draft["id"] not in agent_ids
            assert {user_draft["id"], agent_draft["id"]} <= admin_ids
        finally:
            admin_cleanup(admin_client, "properties", user_draft["id"])
            admin_cleanup(admin_client, "properties", agent_draft["id"])

    def test_developer_project_draft_persistence_scope_and_delete(self, developer_client, admin_client):
        developers = requests.get(f"{BASE_URL}/api/developers", params={"limit": 1}, timeout=20)
        assert developers.status_code == 200 and developers.json()
        marker = uuid.uuid4().hex[:10]
        created = developer_client.post(
            f"{BASE_URL}/api/projects", json=project_payload(marker, developers.json()[0]["id"]), timeout=20
        )
        assert created.status_code == 200, created.text
        project = created.json()
        assert project["status"] == "draft" and project["owner_id"] == developer_client.user["id"]
        try:
            drafts = developer_client.get(f"{BASE_URL}/api/drafts", timeout=20)
            assert drafts.status_code == 200
            assert [p["id"] for p in drafts.json()["projects"] if p["id"] == project["id"]] == [project["id"]]
            owner_get = developer_client.get(f"{BASE_URL}/api/my/projects/{project['id']}", timeout=20)
            assert owner_get.status_code == 200 and owner_get.json()["name"] == project["name"]
            public_get = requests.get(f"{BASE_URL}/api/projects/{project['id']}", timeout=20)
            assert public_get.status_code == 404
        finally:
            deleted = developer_client.delete(f"{BASE_URL}/api/drafts/projects/{project['id']}", timeout=20)
            if deleted.status_code != 200:
                admin_cleanup(admin_client, "projects", project["id"])
        assert developer_client.get(f"{BASE_URL}/api/my/projects/{project['id']}", timeout=20).status_code == 404

    def test_admin_publish_draft_becomes_public(self, admin_client):
        draft = create_property(admin_client, uuid.uuid4().hex[:10])
        try:
            published = admin_client.put(
                f"{BASE_URL}/api/properties/{draft['id']}", json={"status": "active"}, timeout=20
            )
            assert published.status_code == 200, published.text
            assert published.json()["status"] == "active"
            public_get = requests.get(f"{BASE_URL}/api/properties/{draft['id']}", timeout=20)
            assert public_get.status_code == 200, public_get.text
            assert public_get.json()["id"] == draft["id"]
            assert public_get.json()["status"] == "active"
        finally:
            admin_cleanup(admin_client, "properties", draft["id"])

    def test_non_admin_cannot_escalate_draft_directly_to_active(self, user_client, admin_client):
        draft = create_property(user_client, uuid.uuid4().hex[:10])
        try:
            response = user_client.put(
                f"{BASE_URL}/api/properties/{draft['id']}", json={"status": "active"}, timeout=20
            )
            assert response.status_code in {400, 403}, response.text
            persisted = user_client.get(f"{BASE_URL}/api/my/properties/{draft['id']}", timeout=20)
            assert persisted.status_code == 200
            assert persisted.json()["status"] != "active"
            assert requests.get(f"{BASE_URL}/api/properties/{draft['id']}", timeout=20).status_code == 404
        finally:
            admin_cleanup(admin_client, "properties", draft["id"])

    def test_draft_project_does_not_leak_through_public_developer_profile(self, developer_client, admin_client):
        developers = requests.get(f"{BASE_URL}/api/developers", params={"limit": 1}, timeout=20)
        assert developers.status_code == 200 and developers.json()
        developer = developers.json()[0]
        project = developer_client.post(
            f"{BASE_URL}/api/projects",
            json=project_payload(uuid.uuid4().hex[:10], developer["id"]),
            timeout=20,
        ).json()
        try:
            profile = requests.get(f"{BASE_URL}/api/developers/{developer['slug']}", timeout=20)
            assert profile.status_code == 200, profile.text
            assert project["id"] not in {row["id"] for row in profile.json()["projects"]}
        finally:
            admin_cleanup(admin_client, "projects", project["id"])

    def test_public_list_endpoints_only_return_active_records(self):
        for endpoint in ("properties", "projects"):
            response = requests.get(f"{BASE_URL}/api/{endpoint}", params={"page_size": 100}, timeout=20)
            assert response.status_code == 200, response.text
            body = response.json()
            assert isinstance(body["items"], list)
            assert all(item["status"] == "active" for item in body["items"])

        for endpoint in ("properties/featured", "projects/featured"):
            response = requests.get(f"{BASE_URL}/api/{endpoint}", params={"limit": 100}, timeout=20)
            assert response.status_code == 200, response.text
            assert isinstance(response.json(), list)
            assert all(item["status"] == "active" for item in response.json())

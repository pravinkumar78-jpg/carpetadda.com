"""Iteration 11 security, privacy, units, developer, and listings API regression tests."""
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
def user_client():
    return login("User", "user")


@pytest.fixture(scope="session")
def developer_client():
    return login("Developer", "developer")


@pytest.fixture(scope="session")
def agent_client():
    return login("Agent", "agent")


@pytest.fixture(scope="session")
def admin_client():
    return login("Super Admin", "super_admin")


def property_payload(marker, **overrides):
    payload = {
        "title": f"QA11_Property_{marker}",
        "slug": f"qa11-property-{marker}",
        "listing_type": "sale",
        "property_category": "residential",
        "property_type": "apartment",
        "price": 5100000,
        "city": "dombivli",
        "location": "dombivli-east",
        "status": "draft",
        "verified": True,
        "featured": True,
    }
    payload.update(overrides)
    return payload


def project_payload(marker, developer_id, **overrides):
    payload = {
        "name": f"QA11_Project_{marker}",
        "slug": f"qa11-project-{marker}",
        "developer_id": developer_id,
        "city": "dombivli",
        "location": "dombivli-east",
        "price_from": 5000000,
        "price_to": 9000000,
        "configurations": ["2 BHK"],
        "status": "draft",
        "verified": True,
        "featured": True,
    }
    payload.update(overrides)
    return payload


def admin_cleanup(admin_client, kind, record_id):
    response = admin_client.delete(f"{BASE_URL}/api/{kind}/{record_id}", timeout=30)
    assert response.status_code == 200, response.text
    assert response.json()["deleted"] in {0, 1}


class TestCriticalStatusGuards:
    """Retest non-admin active-status and verified/featured escalation guards."""

    def test_user_property_active_becomes_pending_and_flags_cannot_escalate(self, user_client, admin_client):
        marker = uuid.uuid4().hex[:10]
        created = user_client.post(f"{BASE_URL}/api/properties", json=property_payload(marker), timeout=30)
        assert created.status_code == 200, created.text
        prop = created.json()
        assert prop["status"] == "draft"
        assert prop["verified"] is False and prop["featured"] is False
        try:
            updated = user_client.put(
                f"{BASE_URL}/api/properties/{prop['id']}",
                json={"status": "active", "verified": True, "featured": True},
                timeout=30,
            )
            assert updated.status_code == 200, updated.text
            body = updated.json()
            assert body["status"] == "pending_review"
            assert body["verified"] is False and body["featured"] is False

            persisted = user_client.get(f"{BASE_URL}/api/my/properties/{prop['id']}", timeout=30)
            assert persisted.status_code == 200
            assert persisted.json()["status"] == "pending_review"
            assert persisted.json()["verified"] is False and persisted.json()["featured"] is False

            public = requests.get(f"{BASE_URL}/api/properties/{prop['id']}", timeout=30)
            assert public.status_code == 404
            assert public.json() == {"detail": "Property not found"}
        finally:
            admin_cleanup(admin_client, "properties", prop["id"])

    def test_developer_project_active_becomes_pending_and_flags_cannot_escalate(self, developer_client, admin_client):
        developers = requests.get(f"{BASE_URL}/api/developers", params={"limit": 200}, timeout=30)
        assert developers.status_code == 200 and developers.json()
        developer = next((d for d in developers.json() if d.get("email") == developer_client.user["email"]), developers.json()[0])
        marker = uuid.uuid4().hex[:10]
        created = developer_client.post(
            f"{BASE_URL}/api/projects", json=project_payload(marker, developer["id"]), timeout=30
        )
        assert created.status_code == 200, created.text
        project = created.json()
        assert project["status"] == "draft"
        assert project["verified"] is False and project["featured"] is False
        try:
            updated = developer_client.put(
                f"{BASE_URL}/api/projects/{project['id']}",
                json={"status": "active", "verified": True, "featured": True},
                timeout=30,
            )
            assert updated.status_code == 200, updated.text
            body = updated.json()
            assert body["status"] == "pending_review"
            assert body["verified"] is False and body["featured"] is False

            persisted = developer_client.get(f"{BASE_URL}/api/my/projects/{project['id']}", timeout=30)
            assert persisted.status_code == 200
            assert persisted.json()["status"] == "pending_review"
            assert persisted.json()["verified"] is False and persisted.json()["featured"] is False

            public = requests.get(f"{BASE_URL}/api/projects/{project['id']}", timeout=30)
            assert public.status_code == 404
            assert public.json() == {"detail": "Project not found"}
        finally:
            admin_cleanup(admin_client, "projects", project["id"])


class TestPublicPrivacyFilters:
    """Verify public nested profile and featured responses contain active listings only."""

    def test_developer_profile_excludes_created_draft_project_and_property(self, developer_client, user_client, admin_client):
        developers = requests.get(f"{BASE_URL}/api/developers", params={"limit": 200}, timeout=30)
        assert developers.status_code == 200 and developers.json()
        developer = next((d for d in developers.json() if d.get("email") == developer_client.user["email"]), developers.json()[0])
        marker = uuid.uuid4().hex[:10]
        project_response = developer_client.post(
            f"{BASE_URL}/api/projects", json=project_payload(marker, developer["id"]), timeout=30
        )
        property_response = user_client.post(
            f"{BASE_URL}/api/properties",
            json=property_payload(marker, developer_id=developer["id"]),
            timeout=30,
        )
        assert project_response.status_code == 200, project_response.text
        assert property_response.status_code == 200, property_response.text
        project, prop = project_response.json(), property_response.json()
        try:
            profile = requests.get(f"{BASE_URL}/api/developers/{developer['slug']}", timeout=30)
            assert profile.status_code == 200, profile.text
            body = profile.json()
            assert isinstance(body["projects"], list) and isinstance(body["properties"], list)
            assert project["id"] not in {p["id"] for p in body["projects"]}
            assert prop["id"] not in {p["id"] for p in body["properties"]}
            assert all(p["status"] == "active" for p in body["projects"])
            assert all(p["status"] == "active" for p in body["properties"])
        finally:
            admin_cleanup(admin_client, "projects", project["id"])
            admin_cleanup(admin_client, "properties", prop["id"])

    def test_agent_profile_excludes_created_draft_property(self, agent_client, admin_client):
        agents = requests.get(f"{BASE_URL}/api/agents", params={"limit": 200}, timeout=30)
        assert agents.status_code == 200 and agents.json()
        # Seeded Agent login is not linked to a public profile; explicitly associate this
        # owned QA draft to an existing profile to exercise the nested privacy predicate.
        agent = agents.json()[0]
        marker = uuid.uuid4().hex[:10]
        created = agent_client.post(
            f"{BASE_URL}/api/properties",
            json=property_payload(marker, agent_id=agent["id"]),
            timeout=30,
        )
        assert created.status_code == 200, created.text
        prop = created.json()
        try:
            profile = requests.get(f"{BASE_URL}/api/agents/{agent['slug']}", timeout=30)
            assert profile.status_code == 200, profile.text
            properties = profile.json()["properties"]
            assert prop["id"] not in {p["id"] for p in properties}
            assert all(p["status"] == "active" for p in properties)
        finally:
            admin_cleanup(admin_client, "properties", prop["id"])

    def test_featured_projects_only_active(self):
        response = requests.get(f"{BASE_URL}/api/projects/featured", params={"limit": 100}, timeout=30)
        assert response.status_code == 200, response.text
        rows = response.json()
        assert isinstance(rows, list)
        assert all(row["status"] == "active" for row in rows)


class TestUnitsDevelopersAndListings:
    """Validate unit CRUD fields, minimal developer creation, and public listing counts."""

    def test_unit_create_update_and_cleanup(self, admin_client):
        projects = requests.get(f"{BASE_URL}/api/projects", params={"page_size": 60}, timeout=30)
        assert projects.status_code == 200 and projects.json()["items"]
        project = projects.json()["items"][0]
        marker = uuid.uuid4().hex[:8]
        created = admin_client.post(
            f"{BASE_URL}/api/projects/{project['id']}/units",
            json={
                "unit_no": f"QA11-{marker}", "typology": "QA 2 BHK", "builtup_area": 999,
                "carpet_area": 800, "balcony": 2, "status": "available", "published": True,
                "description": "QA unit", "notes": "QA internal",
            },
            timeout=30,
        )
        assert created.status_code == 200, created.text
        unit = created.json()
        try:
            assert unit["typology"] == "QA 2 BHK" and unit["builtup_area"] == 999
            assert unit["carpet_area"] == 800 and unit["balcony"] == 2
            assert unit["published"] is True and unit["notes"] == "QA internal"

            updated = admin_client.put(
                f"{BASE_URL}/api/units/{unit['id']}", json={"builtup_area": 1001, "description": "QA unit edited"}, timeout=30
            )
            assert updated.status_code == 200, updated.text
            body = updated.json()
            assert body["builtup_area"] == 1001 and body["description"] == "QA unit edited"
            assert body["typology"] == "QA 2 BHK" and body["carpet_area"] == 800

            listed = admin_client.get(f"{BASE_URL}/api/projects/{project['id']}/units", params={"q": marker}, timeout=30)
            assert listed.status_code == 200, listed.text
            match = next(row for row in listed.json()["items"] if row["id"] == unit["id"])
            assert match["builtup_area"] == 1001 and match["description"] == "QA unit edited"
        finally:
            deleted = admin_client.delete(f"{BASE_URL}/api/units/{unit['id']}", timeout=30)
            assert deleted.status_code == 200 and deleted.json() == {"deleted": 1}

    def test_admin_create_minimal_developer_and_empty_name_validation(self, admin_client):
        marker = uuid.uuid4().hex[:10]
        name = f"QA Test Builders {marker}"
        empty = admin_client.post(f"{BASE_URL}/api/admin/developers", json={"name": ""}, timeout=30)
        assert empty.status_code == 400
        assert empty.json() == {"detail": "Developer name required"}

        created = admin_client.post(f"{BASE_URL}/api/admin/developers", json={"name": name}, timeout=30)
        assert created.status_code == 200, created.text
        body = created.json()
        assert isinstance(body["id"], str) and body["id"]
        assert body["name"] == name
        assert body["slug"].startswith("qa-test-builders")
        assert body.get("phone") is None and body.get("email") is None

        listed = requests.get(f"{BASE_URL}/api/developers", params={"q": name, "limit": 20}, timeout=30)
        assert listed.status_code == 200
        assert [d["id"] for d in listed.json() if d["name"] == name] == [body["id"]]
        pytest.qa_developer = {"id": body["id"], "name": name}

    def test_properties_total_and_active_contract(self):
        response = requests.get(f"{BASE_URL}/api/properties", params={"page_size": 60}, timeout=30)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["total"] == 48
        assert len(body["items"]) == 48
        assert all(item["status"] == "active" for item in body["items"])

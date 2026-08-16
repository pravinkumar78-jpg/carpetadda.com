"""Targeted regression tests for loan leads, nearby places, project data, and draft workflows."""
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing from /app/frontend/.env")


def _credentials(role_label: str) -> dict:
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    match = re.search(
        rf"\|\s*{re.escape(role_label)}\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|",
        content,
        re.I,
    )
    if not match:
        pytest.skip(f"{role_label} credentials are missing from test_credentials.md")
    return {"email": match.group(1), "password": match.group(2)}


def _client(role_label: str, expected_role: str) -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=_credentials(role_label), timeout=20)
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
    return _client("Super Admin", "super_admin")


@pytest.fixture(scope="session")
def developer_client():
    return _client("Developer", "developer")


@pytest.fixture(scope="session")
def user_client():
    return _client("User", "user")


@pytest.fixture
def cleanup_ids(admin_client):
    tracked = {"projects": [], "properties": [], "leads": []}
    yield tracked
    for resource, ids in tracked.items():
        for item_id in ids:
            response = admin_client.delete(f"{BASE_URL}/api/{resource}/{item_id}", timeout=20)
            assert response.status_code == 200, response.text
            assert response.json().get("deleted") == 1


class TestLoanLeadAndNearbyPlaces:
    """Validate loan category persistence and address-to-nearby-place lookup."""

    def test_home_loan_lead_persists_loan_type(self, admin_client, cleanup_ids):
        marker = uuid.uuid4().hex[:10]
        payload = {
            "name": f"QA Loan Lead {marker}",
            "phone": "9888812345",
            "email": f"qa-loan-{marker}@example.com",
            "loan_type": "Loan Against Property",
            "message": "QA targeted loan category test",
            "source": "home_loan",
            "landing_page": "/home-loan",
            "source_url": f"{BASE_URL}/home-loan",
        }
        created = requests.post(f"{BASE_URL}/api/leads", json=payload, timeout=20)
        assert created.status_code == 200, created.text
        created_body = created.json()
        assert created_body["ok"] is True
        assert isinstance(created_body["id"], str) and created_body["id"]
        cleanup_ids["leads"].append(created_body["id"])

        listed = admin_client.get(f"{BASE_URL}/api/leads", params={"limit": 200}, timeout=20)
        assert listed.status_code == 200, listed.text
        persisted = next((row for row in listed.json() if row.get("id") == created_body["id"]), None)
        assert persisted is not None
        assert persisted["name"] == payload["name"]
        assert persisted["loan_type"] == "Loan Against Property"
        assert persisted["source"] == "home_loan"

    def test_dombivli_east_address_returns_nearby_places(self, admin_client):
        response = admin_client.post(
            f"{BASE_URL}/api/nearby/fetch",
            json={"address": "Dombivli East", "location": "dombivli-east", "city": "dombivli"},
            timeout=70,
        )
        if response.status_code >= 500:
            response = admin_client.post(
                f"{BASE_URL}/api/nearby/fetch",
                json={"address": "Dombivli East", "location": "dombivli-east", "city": "dombivli"},
                timeout=70,
            )
        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body["center"]["lat"], (int, float))
        assert isinstance(body["center"]["lng"], (int, float))
        assert isinstance(body["places"], list) and body["places"]
        for place in body["places"]:
            assert isinstance(place["name"], str) and place["name"]
            assert isinstance(place["distance"], str) and place["distance"]
            assert place["category"] in {"Schools", "Hospitals", "Metro", "Railway", "Buses", "Market & Mall", "Other"}


class TestProjectAndDraftContracts:
    """Validate saved project fields and role-specific draft persistence."""

    def test_admin_project_publish_persists_configuration_array_and_land_size(
        self, admin_client, cleanup_ids
    ):
        developers = requests.get(
            f"{BASE_URL}/api/developers", params={"q": "Meridian Estates", "limit": 20}, timeout=20
        )
        assert developers.status_code == 200, developers.text
        matches = [d for d in developers.json() if d.get("name", "").casefold() == "meridian estates"]
        assert matches, "Seeded developer Meridian Estates is required"

        marker = uuid.uuid4().hex[:10]
        name = f"QA Config Project {marker}"
        payload = {
            "name": name,
            "slug": f"qa-config-project-{marker}",
            "developer_id": matches[0]["id"],
            "city": "dombivli",
            "location": "dombivli-east",
            "price_from": 5000000,
            "price_to": 15000000,
            "configurations": ["1 BHK", "2 BHK", "3 BHK"],
            "land_size": "2.5 Acres",
            "possession_date": "Dec 2027",
            "status": "active",
        }
        created = admin_client.post(f"{BASE_URL}/api/projects", json=payload, timeout=20)
        assert created.status_code == 200, created.text
        body = created.json()
        cleanup_ids["projects"].append(body["id"])
        assert body["name"] == name
        assert body["configurations"] == ["1 BHK", "2 BHK", "3 BHK"]
        assert body["land_size"] == "2.5 Acres"
        assert body["possession_date"] == "Dec 2027"
        assert body["status"] == "active"

        fetched = requests.get(f"{BASE_URL}/api/projects", params={"q": name, "page_size": 20}, timeout=20)
        assert fetched.status_code == 200, fetched.text
        persisted = next((p for p in fetched.json()["items"] if p.get("id") == body["id"]), None)
        assert persisted is not None
        assert persisted["configurations"] == ["1 BHK", "2 BHK", "3 BHK"]
        assert persisted["land_size"] == "2.5 Acres"

    def test_developer_save_draft_remains_draft(self, developer_client, admin_client, cleanup_ids):
        developers = requests.get(
            f"{BASE_URL}/api/developers", params={"q": "Meridian Estates", "limit": 20}, timeout=20
        )
        assert developers.status_code == 200, developers.text
        assert developers.json()
        marker = uuid.uuid4().hex[:10]
        payload = {
            "name": f"QA Developer Draft {marker}",
            "slug": f"qa-developer-draft-{marker}",
            "developer_id": developers.json()[0]["id"],
            "city": "dombivli",
            "location": "dombivli-east",
            "price_from": 5000000,
            "price_to": 15000000,
            "configurations": ["1 BHK"],
            "status": "draft",
        }
        created = developer_client.post(f"{BASE_URL}/api/projects", json=payload, timeout=20)
        assert created.status_code == 200, created.text
        body = created.json()
        cleanup_ids["projects"].append(body["id"])
        assert body["owner_id"] == developer_client.user["id"]
        assert body["status"] == "draft"

        mine = developer_client.get(
            f"{BASE_URL}/api/admin/projects", params={"q": payload["name"], "page_size": 20}, timeout=20
        )
        assert mine.status_code == 200, mine.text
        persisted = next((p for p in mine.json()["items"] if p.get("id") == body["id"]), None)
        assert persisted is not None
        assert persisted["status"] == "draft"

    def test_user_save_property_draft_remains_draft(self, user_client, admin_client, cleanup_ids):
        marker = uuid.uuid4().hex[:10]
        payload = {
            "title": f"QA User Draft {marker}",
            "slug": f"qa-user-draft-{marker}",
            "listing_type": "sale",
            "property_category": "residential",
            "property_type": "apartment",
            "price": 5000000,
            "city": "dombivli",
            "location": "dombivli-east",
            "status": "draft",
        }
        created = user_client.post(f"{BASE_URL}/api/properties", json=payload, timeout=20)
        assert created.status_code == 200, created.text
        body = created.json()
        cleanup_ids["properties"].append(body["id"])
        assert body["owner_id"] == user_client.user["id"]
        assert body["status"] == "draft"

        mine = user_client.get(
            f"{BASE_URL}/api/properties",
            params={"owner_id": user_client.user["id"], "include_archived": "true", "q": payload["title"], "page_size": 20},
            timeout=20,
        )
        assert mine.status_code == 200, mine.text
        persisted = next((p for p in mine.json()["items"] if p.get("id") == body["id"]), None)
        assert persisted is not None
        assert persisted["status"] == "draft"

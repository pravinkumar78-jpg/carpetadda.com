"""Regression tests for admin lead filters and site-visit status updates."""
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing from /app/frontend/.env")


@pytest.fixture(scope="session")
def admin_credentials():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    match = re.search(r"\|\s*Super Admin\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|", content, re.I)
    if not match:
        pytest.skip("Super Admin credentials are missing from test_credentials.md")
    return {"email": match.group(1), "password": match.group(2)}


@pytest.fixture(scope="session")
def admin_client(admin_credentials):
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json=admin_credentials, timeout=20)
    if response.status_code != 200:
        pytest.fail(f"Admin authentication failed: {response.status_code} {response.text[:500]}")
    payload = response.json()
    assert payload["user"]["role"] in {"admin", "super_admin"}
    assert isinstance(payload.get("token"), str) and payload["token"]
    session.headers.update({"Authorization": f"Bearer {payload['token']}"})
    return session


class TestAdminLeadFilters:
    """Validate unfiltered and every supported lead status response."""

    @pytest.mark.parametrize("status", [
        None, "new", "contacted", "interested", "site_visit", "negotiation",
        "booking", "converted", "lost", "junk",
    ])
    def test_lead_filter(self, admin_client, status):
        params = {"limit": 200}
        if status:
            params["status"] = status
        response = admin_client.get(f"{BASE_URL}/api/leads", params=params, timeout=20)
        assert response.status_code == 200, response.text
        rows = response.json()
        assert isinstance(rows, list)
        for row in rows:
            assert isinstance(row.get("id"), str) and row["id"]
            if status:
                assert row.get("status") == status


class TestAdminSiteVisits:
    """Validate listing, persisted status update, cleanup, and missing-id handling."""

    def test_list_and_update_site_visit_persists(self, admin_client):
        listed = admin_client.get(f"{BASE_URL}/api/site-visits", params={"limit": 200}, timeout=20)
        assert listed.status_code == 200, listed.text
        rows = listed.json()
        assert isinstance(rows, list)
        assert len(rows) >= 2
        assert any(row.get("name") == "Test Visitor" for row in rows)
        assert any(row.get("name") == "Site Visitor QA" for row in rows)

        target = next(row for row in rows if row.get("name") == "Test Visitor")
        original = target.get("status") or "requested"
        changed = "completed" if original != "completed" else "confirmed"
        try:
            updated = admin_client.put(
                f"{BASE_URL}/api/site-visits/{target['id']}", json={"status": changed}, timeout=20
            )
            assert updated.status_code == 200, updated.text
            body = updated.json()
            assert body["id"] == target["id"]
            assert body["status"] == changed

            reloaded = admin_client.get(f"{BASE_URL}/api/site-visits", params={"limit": 200}, timeout=20)
            assert reloaded.status_code == 200
            persisted = next(row for row in reloaded.json() if row.get("id") == target["id"])
            assert persisted["status"] == changed
        finally:
            restored = admin_client.put(
                f"{BASE_URL}/api/site-visits/{target['id']}", json={"status": original}, timeout=20
            )
            assert restored.status_code == 200
            assert restored.json()["status"] == original

    def test_update_unknown_site_visit_is_clean_404(self, admin_client):
        response = admin_client.put(
            f"{BASE_URL}/api/site-visits/TEST_unknown-site-visit", json={"status": "completed"}, timeout=20
        )
        assert response.status_code == 404
        assert response.json() == {"detail": "Site visit not found"}



# Incremental BATCH 1/2 API coverage: auth roles, filters, amenities, import visibility, stats, and SEO.
def _credentials_for(role_label):
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    match = re.search(rf"\|\s*{re.escape(role_label)}\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|", content, re.I)
    if not match:
        pytest.skip(f"{role_label} credentials are missing from test_credentials.md")
    return {"email": match.group(1), "password": match.group(2)}


def _authenticated_client(role_label, expected_role):
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(
        f"{BASE_URL}/api/auth/login", json=_credentials_for(role_label), timeout=20
    )
    if response.status_code != 200:
        pytest.fail(f"{role_label} authentication failed: {response.status_code} {response.text[:500]}")
    body = response.json()
    assert body["user"]["role"] == expected_role
    assert isinstance(body.get("token"), str) and body["token"]
    session.headers.update({"Authorization": f"Bearer {body['token']}"})
    return session


@pytest.fixture(scope="session")
def agent_client():
    return _authenticated_client("Agent", "agent")


@pytest.fixture(scope="session")
def developer_client():
    return _authenticated_client("Developer", "developer")


@pytest.fixture(scope="session")
def user_client():
    return _authenticated_client("User", "user")


class TestIncrementalFeatureAPIs:
    """Validate the public and role-scoped API contracts used by the new UI flows."""

    def test_health_contract(self):
        response = requests.get(f"{BASE_URL}/api/", timeout=20)
        assert response.status_code == 200
        assert response.json() == {"ok": True, "service": "EstateHub API", "version": "1.0.0"}

    @pytest.mark.parametrize("client_fixture,expected_role", [
        ("admin_client", "super_admin"),
        ("agent_client", "agent"),
        ("developer_client", "developer"),
        ("user_client", "user"),
    ])
    def test_seeded_role_auth_and_me(self, client_fixture, expected_role, request):
        client = request.getfixturevalue(client_fixture)
        response = client.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["role"] == expected_role
        assert isinstance(body["id"], str) and body["id"]
        assert "@" in body["email"]

    def test_projects_bhk_and_price_sort_contract(self):
        response = requests.get(
            f"{BASE_URL}/api/projects",
            params={"bhk": 2, "sort": "price_low", "page_size": 60},
            timeout=20,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body["items"], list) and body["total"] == len(body["items"])
        prices = [item["price_from"] for item in body["items"]]
        assert prices == sorted(prices)
        for item in body["items"]:
            assert item["status"] == "active"
            assert any(re.match(r"^2\s*BHK", cfg, re.I) for cfg in item.get("configurations", []))

    def test_commercial_office_filter_contract(self):
        response = requests.get(
            f"{BASE_URL}/api/properties",
            params={"category": "commercial", "property_type": "office", "page_size": 60},
            timeout=20,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body["items"], list)
        for item in body["items"]:
            assert item["status"] == "active"
            assert item["property_category"] == "commercial"
            assert item["property_type"] == "office"

    def test_created_developer_and_amenity_dedupe_state(self):
        developers = requests.get(
            f"{BASE_URL}/api/developers", params={"q": "E2E Test Builders", "limit": 20}, timeout=20
        )
        assert developers.status_code == 200, developers.text
        matching_devs = [d for d in developers.json() if d.get("name", "").casefold() == "e2e test builders"]
        assert len(matching_devs) == 1
        assert matching_devs[0]["email"] == "e2e@builders.com"
        assert matching_devs[0]["rera_number"] == "A51700099999"

        amenities = requests.get(f"{BASE_URL}/api/amenities", timeout=20)
        assert amenities.status_code == 200, amenities.text
        names = [a["name"] for a in amenities.json()]
        assert "E2E Rooftop Lounge" in names
        assert "E2E Sky Walk" in names
        assert len(names) == len(set(name.casefold() for name in names))

    @pytest.mark.parametrize("client_fixture", ["admin_client", "agent_client", "developer_client"])
    def test_lead_stats_contract_by_authorized_role(self, client_fixture, request):
        client = request.getfixturevalue(client_fixture)
        response = client.get(f"{BASE_URL}/api/stats/leads", timeout=20)
        assert response.status_code == 200, response.text
        body = response.json()
        assert set(body) >= {"total", "contacted", "converted", "conversion"}
        assert all(isinstance(body[key], (int, float)) for key in ("total", "contacted", "converted", "conversion"))
        assert 0 <= body["contacted"] <= body["total"]
        assert 0 <= body["converted"] <= body["total"]

    def test_imported_draft_is_owner_visible_but_not_public(self, developer_client):
        mine = developer_client.get(
            f"{BASE_URL}/api/admin/projects", params={"q": "Example Domain", "page_size": 100}, timeout=20
        )
        assert mine.status_code == 200, mine.text
        imported = [p for p in mine.json()["items"] if p.get("import_source_url") == "https://example.com"]
        assert imported
        assert all(p.get("status") in {"pending_review", "active", "archived"} for p in imported)
        assert all(isinstance(p.get("owner_id"), str) and p["owner_id"] for p in imported)

        public = requests.get(
            f"{BASE_URL}/api/projects", params={"q": "Example Domain", "page_size": 100}, timeout=20
        )
        assert public.status_code == 200, public.text
        public_items = public.json()["items"]
        assert all(p["status"] == "active" for p in public_items)
        public_ids = {p["id"] for p in public_items}
        pending_imports = [p for p in imported if p.get("status") == "pending_review"]
        assert all(p["id"] not in public_ids for p in pending_imports)

    def test_admin_seo_pages_contract(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/api/admin/seo-pages", timeout=20)
        assert response.status_code == 200, response.text
        rows = response.json()
        assert isinstance(rows, list)
        for row in rows:
            assert isinstance(row.get("page"), str) and row["page"].startswith("/")
            if row.get("robots") is not None:
                assert row["robots"] in {"index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"}

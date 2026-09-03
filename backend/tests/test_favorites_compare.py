"""Favorites (property + project), compare and drafts endpoints — iteration 13 fix batch."""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/") + "/api"

USER = {"email": "user@estatehub.in", "password": "User@123"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_client(client):
    r = client.post(f"{BASE_URL}/auth/login", json=USER)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("access_token") or r.json().get("token")
    if not token:
        pytest.fail(f"no token in login response: {r.text[:300]}")
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def a_property(client):
    r = client.get(f"{BASE_URL}/properties?page_size=3")
    assert r.status_code == 200, r.text[:300]
    items = r.json()["items"]
    assert items, "no properties seeded"
    return items[0]


@pytest.fixture(scope="module")
def a_project(client):
    r = client.get(f"{BASE_URL}/projects?page_size=3")
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    items = data["items"] if isinstance(data, dict) else data
    assert items, "no projects seeded"
    return items[0]


# --- property favorites ---
class TestPropertyFavorites:
    def test_favorites_requires_auth(self, client):
        r = client.get(f"{BASE_URL}/favorites")
        assert r.status_code in (401, 403), r.status_code

    def test_add_get_delete_property_favorite(self, user_client, a_property):
        pid = a_property["id"]
        user_client.delete(f"{BASE_URL}/favorites/{pid}")
        r = user_client.post(f"{BASE_URL}/favorites/{pid}")
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

        r = user_client.get(f"{BASE_URL}/favorites")
        assert r.status_code == 200
        favs = r.json()
        assert any(p["id"] == pid for p in favs), "property not persisted in favorites"
        assert all("_id" not in p for p in favs), "_id leaked in response"

        # idempotent
        r2 = user_client.post(f"{BASE_URL}/favorites/{pid}")
        assert r2.status_code == 200 and r2.json().get("already") is True

        d = user_client.delete(f"{BASE_URL}/favorites/{pid}")
        assert d.status_code == 200 and d.json()["deleted"] >= 1
        r = user_client.get(f"{BASE_URL}/favorites")
        assert not any(p["id"] == pid for p in r.json()), "favorite not removed"


# --- project favorites ---
class TestProjectFavorites:
    def test_project_favorites_requires_auth(self, client):
        r = client.get(f"{BASE_URL}/favorites/projects")
        assert r.status_code in (401, 403), r.status_code

    def test_add_get_delete_project_favorite(self, user_client, a_project):
        jid = a_project["id"]
        user_client.delete(f"{BASE_URL}/favorites/project/{jid}")
        r = user_client.post(f"{BASE_URL}/favorites/project/{jid}")
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

        r = user_client.get(f"{BASE_URL}/favorites/projects")
        assert r.status_code == 200
        favs = r.json()
        assert any(p["id"] == jid for p in favs), "project not persisted"
        assert all("_id" not in p for p in favs)

        # project favorite must not pollute property favorites list
        rp = user_client.get(f"{BASE_URL}/favorites")
        assert rp.status_code == 200
        assert all(p["id"] != jid for p in rp.json())

        r2 = user_client.post(f"{BASE_URL}/favorites/project/{jid}")
        assert r2.json().get("already") is True

        d = user_client.delete(f"{BASE_URL}/favorites/project/{jid}")
        assert d.status_code == 200 and d.json()["deleted"] >= 1
        r = user_client.get(f"{BASE_URL}/favorites/projects")
        assert not any(p["id"] == jid for p in r.json())


# --- compare + saved searches used by dashboard tabs ---
class TestCompareAndSaved:
    def test_compare_returns_selected_properties(self, client, a_property):
        r = client.get(f"{BASE_URL}/properties?page_size=2")
        ids = [p["id"] for p in r.json()["items"]][:2]
        res = client.post(f"{BASE_URL}/compare", json={"ids": ids})
        assert res.status_code == 200, res.text[:300]
        data = res.json()
        assert isinstance(data, list) and len(data) == len(ids)
        assert {p["id"] for p in data} == set(ids)

    def test_saved_searches_list(self, user_client):
        r = user_client.get(f"{BASE_URL}/saved-searches")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- drafts (no-autosave verification support) ---
class TestDrafts:
    def test_drafts_listable(self, user_client):
        r = user_client.get(f"{BASE_URL}/drafts")
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, (list, dict))
        if isinstance(data, dict):
            for v in data.values():
                assert isinstance(v, list)

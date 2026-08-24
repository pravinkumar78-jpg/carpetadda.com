"""Iteration 12 — Contact routing, lead routing, admin user management (edit/password/delete+reassign).

Covers: /api/auth/login, /api/admin/users (list/create/update/reset-password/delete),
/api/admin/properties/{id}/assign, /api/properties/{slug} contact object,
/api/projects/{slug} contact object, /api/leads (create/list/global-vs-agent scope).
"""
import os
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE = base_url.rstrip("/") + "/api"

ADMIN = ("admin@estatehub.in", "Admin@123")
USER = ("user@estatehub.in", "User@123")

TS = str(int(time.time()))
STATE = {}


def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=30)
    return r


def tok_of(resp):
    d = resp.json()
    t = d.get("token") or d.get("access_token")
    assert t, f"no token in login response: {str(d)[:200]}"
    return t


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module", autouse=True)
def bootstrap():
    r = login(*ADMIN)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    STATE["admin_token"] = tok_of(r)
    me = requests.get(f"{BASE}/auth/me", headers=H(STATE["admin_token"]), timeout=30)
    assert me.status_code == 200, me.text[:300]
    STATE["admin_id"] = me.json().get("id")
    yield
    # ---- teardown / cleanup ----
    tok = STATE.get("admin_token")
    for lid in STATE.get("lead_ids", []):
        requests.delete(f"{BASE}/leads/{lid}", headers=H(tok), timeout=30)
    if STATE.get("prop_id"):
        requests.delete(f"{BASE}/properties/{STATE['prop_id']}", headers=H(tok), timeout=30)
    if STATE.get("agent_uid"):
        requests.delete(f"{BASE}/admin/users/{STATE['agent_uid']}", headers=H(tok), timeout=30)


class TestAdminUsersAndRouting:
    # --- P0 regression: admin API surface ---
    def test_01_admin_list_users(self):
        r = requests.get(f"{BASE}/admin/users", headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 200, r.text[:300]
        users = r.json()
        assert isinstance(users, list) and len(users) > 0
        assert all("_id" not in u for u in users)
        assert all("password_hash" not in u for u in users)
        assert any(u["email"] == ADMIN[0] for u in users)

    def test_02_create_test_agent_user(self):
        payload = {"name": f"TEST_Agent {TS}", "email": f"test_agent_{TS}@qatest.com",
                   "password": "TestPass@123", "role": "agent", "phone": "9876500011"}
        r = requests.post(f"{BASE}/admin/users", json=payload, headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code in (200, 201), r.text[:400]
        d = r.json()
        assert d["email"] == payload["email"] and d["role"] == "agent"
        STATE["agent_uid"] = d["id"]
        STATE["agent_email"] = payload["email"]
        STATE["agent_name"] = payload["name"]

    def test_02b_create_user_invalid_email_returns_400_not_500(self):
        r = requests.post(f"{BASE}/admin/users",
                          json={"name": "TEST_Bad", "email": "bad@qa.test", "password": "TestPass@123", "role": "user"},
                          headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code != 500, "unhandled pydantic EmailStr ValidationError leaks as 500"
        assert r.status_code == 400, f"expected 400 for invalid email, got {r.status_code}"

    def test_03_admin_update_user_name_phone_whatsapp(self):
        body = {"name": f"TEST_Agent Updated {TS}", "phone": "9876500012", "whatsapp": "9876500013"}
        r = requests.put(f"{BASE}/admin/users/{STATE['agent_uid']}", json=body,
                         headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["name"] == body["name"] and d["phone"] == "9876500012" and d["whatsapp"] == "9876500013"
        # verify persistence via list
        lst = requests.get(f"{BASE}/admin/users?q={STATE['agent_email']}",
                           headers=H(STATE["admin_token"]), timeout=30).json()
        found = [u for u in lst if u["id"] == STATE["agent_uid"]]
        assert found and found[0]["whatsapp"] == "9876500013"
        STATE["agent_name"] = body["name"]

    def test_04_agent_can_login(self):
        r = login(STATE["agent_email"], "TestPass@123")
        assert r.status_code == 200, r.text[:300]
        STATE["agent_token"] = tok_of(r)

    # --- property owned by the test agent, approved live ---
    def test_05_agent_creates_property_admin_approves(self):
        slug = f"test-qa-contact-routing-{TS}"
        body = {"title": f"TEST_QA Contact Routing {TS}", "slug": slug, "price": 12500000,
                "city": "mumbai", "location": "andheri-west", "listing_type": "sale",
                "property_type": "apartment", "bhk": 3, "carpet_area": 1200,
                "description": "QA test listing for contact routing.", "status": "pending_review"}
        r = requests.post(f"{BASE}/properties", json=body, headers=H(STATE["agent_token"]), timeout=30)
        assert r.status_code in (200, 201), r.text[:400]
        d = r.json()
        STATE["prop_id"] = d["id"]
        STATE["prop_slug"] = slug
        assert d["status"] == "pending_review"
        assert d["owner_id"] == STATE["agent_uid"]
        assert d["agent_id"] == STATE["agent_uid"]
        ap = requests.put(f"{BASE}/admin/properties/{STATE['prop_id']}/approve",
                          headers=H(STATE["admin_token"]), timeout=30)
        assert ap.status_code == 200, ap.text[:400]
        pub = requests.get(f"{BASE}/properties/{slug}", timeout=30)
        assert pub.status_code == 200, pub.text[:300]
        assert pub.json()["status"] == "active"

    def test_06_assign_property_and_contact_object(self):
        r = requests.put(f"{BASE}/admin/properties/{STATE['prop_id']}/assign",
                         json={"user_id": STATE["agent_uid"]}, headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 200, r.text[:400]
        assert r.json()["assigned_to"] == STATE["agent_uid"]
        pub = requests.get(f"{BASE}/properties/{STATE['prop_slug']}", timeout=30)
        assert pub.status_code == 200
        c = pub.json().get("contact")
        assert c is not None, "contact object missing for assigned property"
        assert c["name"] == STATE["agent_name"]
        assert c["phone"] == "9876500012"
        assert c["whatsapp"] == "9876500013"
        assert c["role"] == "agent"

    def test_07_unassigned_property_contact_is_null(self):
        """A property with no assigned user and no agent → contact null (frontend falls back to business number)."""
        lst = requests.get(f"{BASE}/properties?page_size=12", timeout=30).json().get("items", [])
        checked = None
        for p in lst:
            if p["id"] == STATE.get("prop_id"):
                continue
            d = requests.get(f"{BASE}/properties/{p['slug']}", timeout=30).json()
            if not d.get("assigned_to") and not d.get("agent_id"):
                checked = d
                break
        if checked is None:
            pytest.skip("No seeded active property without assigned_to/agent_id to verify fallback")
        assert checked.get("contact") is None, f"expected null contact, got {checked.get('contact')}"

    def test_08_project_detail_exposes_contact_key(self):
        lst = requests.get(f"{BASE}/projects?page_size=5", timeout=30)
        assert lst.status_code == 200, lst.text[:300]
        items = lst.json().get("items", [])
        if not items:
            pytest.skip("No active projects seeded")
        d = requests.get(f"{BASE}/projects/{items[0]['slug']}", timeout=30)
        assert d.status_code == 200, d.text[:300]
        body = d.json()
        assert "contact" in body, "project detail missing 'contact' key"
        STATE["project_slug"] = items[0]["slug"]
        STATE["project_contact"] = body.get("contact")

    # --- lead routing ---
    def test_09_lead_routed_to_assigned_agent(self):
        payload = {"name": "TEST_QA Lead", "phone": "9812345678", "email": "qa.lead@qatest.com",
                   "message": "QA routing check", "property_id": STATE["prop_id"], "source": "property_page"}
        r = requests.post(f"{BASE}/leads", json=payload, timeout=40)
        assert r.status_code == 200, r.text[:400]
        lid = r.json()["id"]
        STATE.setdefault("lead_ids", []).append(lid)
        STATE["lead_id"] = lid
        time.sleep(1)
        admin_leads = requests.get(f"{BASE}/leads?limit=200", headers=H(STATE["admin_token"]), timeout=30).json()
        mine = [l for l in admin_leads if l["id"] == lid]
        assert len(mine) == 1, f"expected exactly 1 lead doc, found {len(mine)} (duplicate lead records)"
        assert mine[0]["assigned_to"] == STATE["agent_uid"], f"lead not routed: {mine[0].get('assigned_to')}"
        # no duplicates for same property+phone
        dupes = [l for l in admin_leads if l.get("property_id") == STATE["prop_id"] and l.get("phone") == payload["phone"]]
        assert len(dupes) == 1, f"duplicate lead records created: {len(dupes)}"

    def test_10_agent_sees_own_lead_only(self):
        r = requests.get(f"{BASE}/leads?limit=200", headers=H(STATE["agent_token"]), timeout=30)
        assert r.status_code == 200, r.text[:300]
        leads = r.json()
        assert any(l["id"] == STATE["lead_id"] for l in leads), "assigned agent cannot see their routed lead"
        for l in leads:
            assert l.get("assigned_to") == STATE["agent_uid"] or l.get("agent_id") == STATE["agent_uid"] \
                or l.get("property_id") == STATE["prop_id"], f"agent sees out-of-scope lead {l['id']}"

    def test_11_user_role_cannot_list_leads(self):
        tok = tok_of(login(*USER))
        r = requests.get(f"{BASE}/leads", headers=H(tok), timeout=30)
        assert r.status_code in (401, 403), f"plain user got {r.status_code} on /leads"

    # --- password set via edit dialog ---
    def test_12_admin_sets_password_directly(self):
        r = requests.put(f"{BASE}/admin/users/{STATE['agent_uid']}", json={"password": "BrandNew@789"},
                         headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 200, r.text[:400]
        assert "password_hash" not in r.json()
        assert login(STATE["agent_email"], "BrandNew@789").status_code == 200, "new password login failed"
        assert login(STATE["agent_email"], "TestPass@123").status_code in (400, 401), "old password still valid"
        STATE["agent_token"] = tok_of(login(STATE["agent_email"], "BrandNew@789"))

    def test_13_short_password_rejected(self):
        r = requests.put(f"{BASE}/admin/users/{STATE['agent_uid']}", json={"password": "short"},
                         headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 400, f"expected 400 for <8 char password, got {r.status_code}"

    def test_14_reset_password_endpoint(self):
        r = requests.post(f"{BASE}/admin/users/{STATE['agent_uid']}/reset-password",
                          headers=H(STATE["admin_token"]), timeout=40)
        assert r.status_code in (200, 502), r.text[:300]

    # --- guards ---
    def test_15_admin_cannot_delete_self(self):
        r = requests.delete(f"{BASE}/admin/users/{STATE['admin_id']}", headers=H(STATE["admin_token"]), timeout=30)
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text[:200]}"

    def test_16_non_admin_cannot_delete_user(self):
        tok = tok_of(login(*USER))
        r = requests.delete(f"{BASE}/admin/users/{STATE['agent_uid']}", headers=H(tok), timeout=30)
        assert r.status_code in (401, 403), f"non-admin got {r.status_code}"
        r2 = requests.delete(f"{BASE}/admin/users/{STATE['agent_uid']}", timeout=30)
        assert r2.status_code in (401, 403), f"anonymous got {r2.status_code}"

    def test_17_delete_user_reassigns_everything_to_admin(self):
        r = requests.delete(f"{BASE}/admin/users/{STATE['agent_uid']}",
                            headers=H(STATE["admin_token"]), timeout=40)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["deleted"] == 1 and d["reassigned_to"] == STATE["admin_id"]
        # listing untouched & still public
        pub = requests.get(f"{BASE}/properties/{STATE['prop_slug']}", timeout=30)
        assert pub.status_code == 200, "property no longer publicly viewable after owner deletion"
        assert pub.json()["status"] == "active"
        full = requests.get(f"{BASE}/my/properties/{STATE['prop_id']}",
                            headers=H(STATE["admin_token"]), timeout=30).json()
        assert full["owner_id"] == STATE["admin_id"]
        assert full["assigned_to"] == STATE["admin_id"]
        assert full["agent_id"] == STATE["admin_id"]
        # lead reassigned
        leads = requests.get(f"{BASE}/leads?limit=200", headers=H(STATE["admin_token"]), timeout=30).json()
        lead = [l for l in leads if l["id"] == STATE["lead_id"]]
        assert lead and lead[0]["assigned_to"] == STATE["admin_id"], "lead not reassigned to acting admin"
        # user gone
        users = requests.get(f"{BASE}/admin/users", headers=H(STATE["admin_token"]), timeout=30).json()
        assert not any(u["id"] == STATE["agent_uid"] for u in users)
        assert login(STATE["agent_email"], "BrandNew@789").status_code in (400, 401)
        STATE["agent_uid"] = None

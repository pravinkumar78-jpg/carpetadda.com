"""UI fixture helper for iteration 12 frontend tests.

Usage:  python setup_ui_fixture.py setup    → creates TEST agent (with phone) + active property assigned to them
        python setup_ui_fixture.py teardown → deletes the property, leads and user created above
State is kept in /app/test_reports/ui_fixture_it12.json
"""
import json
import os
import sys
import time

import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL")
        or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/") + "/api"
STATE_FILE = "/app/test_reports/ui_fixture_it12.json"
ADMIN = {"email": "admin@estatehub.in", "password": "Admin@123"}


def token(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=30)
    r.raise_for_status()
    return r.json().get("token") or r.json()["access_token"]


def H(t):
    return {"Authorization": f"Bearer {t}"}


def setup():
    ts = str(int(time.time()))
    at = token(**ADMIN)
    email = f"test_ui_agent_{ts}@qatest.com"
    pw = "TestPass@123"
    u = requests.post(f"{BASE}/admin/users", headers=H(at), timeout=30, json={
        "name": f"TEST_UI Agent {ts}", "email": email, "password": pw, "role": "agent",
        "phone": "9820011122"}).json()
    requests.put(f"{BASE}/admin/users/{u['id']}", headers=H(at), timeout=30,
                 json={"whatsapp": "9820011133"})
    dev = requests.post(f"{BASE}/admin/users", headers=H(at), timeout=30, json={
        "name": f"TEST_UI Developer {ts}", "email": f"test_ui_dev_{ts}@qatest.com",
        "password": pw, "role": "developer", "phone": "9820022211"}).json()
    gt = token(email, pw)
    slug = f"test-ui-contact-routing-{ts}"
    p = requests.post(f"{BASE}/properties", headers=H(gt), timeout=30, json={
        "title": f"TEST_UI Contact Routing {ts}", "slug": slug, "price": 9900000,
        "city": "mumbai", "location": "andheri-west", "listing_type": "sale",
        "property_type": "apartment", "bhk": 2, "carpet_area": 900,
        "description": "QA UI fixture listing.", "status": "pending_review"}).json()
    requests.put(f"{BASE}/admin/properties/{p['id']}/approve", headers=H(at), timeout=30)
    requests.put(f"{BASE}/admin/properties/{p['id']}/assign", headers=H(at), timeout=30,
                 json={"user_id": u["id"]})
    # find an unassigned active property for the fallback check
    items = requests.get(f"{BASE}/properties?page_size=20", timeout=30).json()["items"]
    unassigned = None
    for it in items:
        if it["id"] == p["id"]:
            continue
        d = requests.get(f"{BASE}/properties/{it['slug']}", timeout=30).json()
        if d.get("contact") is None:
            unassigned = it["slug"]
            break
    projects = requests.get(f"{BASE}/projects?page_size=5", timeout=30).json().get("items", [])
    state = {"agent_id": u["id"], "agent_email": email, "agent_name": u["name"],
             "agent_password": pw, "dev_id": dev.get("id"), "dev_email": dev.get("email"),
             "prop_id": p["id"], "prop_slug": slug,
             "unassigned_slug": unassigned,
             "project_slug": projects[0]["slug"] if projects else None}
    json.dump(state, open(STATE_FILE, "w"), indent=2)
    print(json.dumps(state, indent=2))


def teardown():
    if not os.path.exists(STATE_FILE):
        print("no state file")
        return
    s = json.load(open(STATE_FILE))
    at = token(**ADMIN)
    leads = requests.get(f"{BASE}/leads?limit=200", headers=H(at), timeout=30).json()
    for l in leads:
        if l.get("property_id") == s.get("prop_id") or (l.get("name") or "").startswith("TEST_"):
            requests.delete(f"{BASE}/leads/{l['id']}", headers=H(at), timeout=30)
    print("prop delete", requests.delete(f"{BASE}/properties/{s['prop_id']}", headers=H(at), timeout=30).status_code)
    for uid in (s.get("agent_id"), s.get("dev_id")):
        if uid:
            print("user delete", uid, requests.delete(f"{BASE}/admin/users/{uid}", headers=H(at), timeout=30).status_code)
    os.remove(STATE_FILE)


if __name__ == "__main__":
    (setup if sys.argv[1] == "setup" else teardown)()

"""Verify UI-created QA records through APIs, then remove every QA-prefixed artifact."""
import re
from pathlib import Path

import requests
from dotenv import dotenv_values

BASE_URL = (dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")


def _admin_client():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    match = re.search(r"\|\s*Super Admin\s*\|\s*([^|\s]+)\s*\|\s*([^|\s]+)\s*\|", content, re.I)
    assert match, "Super Admin credentials missing"
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    login = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": match.group(1), "password": match.group(2)},
        timeout=20,
    )
    assert login.status_code == 200, login.text
    session.headers.update({"Authorization": f"Bearer {login.json()['token']}"})
    return session


def test_verify_ui_records_and_cleanup_all_qa_prefixes():
    admin = _admin_client()
    project_response = admin.get(
        f"{BASE_URL}/api/admin/projects", params={"q": "QA", "page_size": 200}, timeout=30
    )
    property_response = admin.get(
        f"{BASE_URL}/api/admin/properties", params={"q": "QA", "page_size": 200}, timeout=30
    )
    lead_response = admin.get(f"{BASE_URL}/api/leads", params={"limit": 500}, timeout=30)
    assert project_response.status_code == 200, project_response.text
    assert property_response.status_code == 200, property_response.text
    assert lead_response.status_code == 200, lead_response.text

    projects = [p for p in project_response.json()["items"] if p.get("name", "").startswith("QA")]
    properties = [p for p in property_response.json()["items"] if p.get("title", "").startswith("QA")]
    leads = [lead for lead in lead_response.json() if lead.get("name", "").startswith("QA")]

    try:
        config_repro = next(p for p in projects if p["name"] == "QA Config Repro 20260816")
        assert config_repro["status"] == "active"
        assert config_repro["configurations"] == ["1 BHK", "2 BHK", "3 BHK"]
    finally:
        for project in projects:
            deleted = admin.delete(f"{BASE_URL}/api/projects/{project['id']}", timeout=20)
            assert deleted.status_code == 200, deleted.text
            assert deleted.json()["deleted"] == 1
        for prop in properties:
            deleted = admin.delete(f"{BASE_URL}/api/properties/{prop['id']}", timeout=20)
            assert deleted.status_code == 200, deleted.text
            assert deleted.json()["deleted"] == 1
        for lead in leads:
            deleted = admin.delete(f"{BASE_URL}/api/leads/{lead['id']}", timeout=20)
            assert deleted.status_code == 200, deleted.text
            assert deleted.json()["deleted"] == 1

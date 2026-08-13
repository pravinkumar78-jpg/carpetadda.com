"""Lead notification email dispatch — Emergent-managed Resend integration.

Fixed recipient: LEAD_RECIPIENT_EMAIL (contact@carpetadda.com).
Non-blocking async send via httpx. Never blocks the request even on failure.
"""
import os
import logging
import smtplib
from email.message import EmailMessage
from datetime import datetime, timezone
from html import escape
from typing import Optional

import httpx

log = logging.getLogger("carpetadda.email")

# Emergent managed email proxy — CONSTANT, never read from env.
EMAIL_BASE_URL = "https://integrations.emergentagent.com"


def _cfg():
    return {
        "key": os.environ.get("EMERGENT_EMAIL_KEY"),
        "from_name": os.environ.get("EMAIL_FROM_NAME", "CarpetAdda"),
        "to": os.environ.get("LEAD_RECIPIENT_EMAIL", "contact@carpetadda.com"),
        "smtp_host": os.environ.get("SMTP_HOST"),
        "smtp_port": int(os.environ.get("SMTP_PORT", "465")),
        "smtp_user": os.environ.get("SMTP_USER"),
        "smtp_password": os.environ.get("SMTP_PASSWORD"),
        "smtp_from": os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_USER"),
    }

async def _send_smtp(to: str, subject: str, html: str) -> bool:
    cfg = _cfg()
    if not (cfg["smtp_host"] and cfg["smtp_user"] and cfg["smtp_password"] and cfg["smtp_from"]):
        return False

    msg = EmailMessage()
    msg["From"] = f'{cfg["from_name"]} <{cfg["smtp_from"]}>'
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("Please view this message in an HTML-capable email client.")
    msg.add_alternative(html, subtype="html")

    try:
        if cfg["smtp_port"] == 465:
            with smtplib.SMTP_SSL(cfg["smtp_host"], cfg["smtp_port"], timeout=15) as server:
                server.login(cfg["smtp_user"], cfg["smtp_password"])
                server.send_message(msg)
        else:
            with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=15) as server:
                server.starttls()
                server.login(cfg["smtp_user"], cfg["smtp_password"])
                server.send_message(msg)
        return True
    except Exception as e:
        log.error("SMTP email failed: %s", e)
        return False


def _fmt_row(label: str, value) -> str:
    if value is None or value == "":
        return ""
    v = escape(str(value))
    return (
        f'<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;'
        f'text-transform:uppercase;letter-spacing:0.08em;width:180px;'
        f'border-bottom:1px solid #e2e8f0;">{escape(label)}</td>'
        f'<td style="padding:8px 12px;color:#0f172a;font-size:14px;'
        f'font-weight:500;border-bottom:1px solid #e2e8f0;">{v}</td></tr>'
    )


def _fmt_budget(lo, hi) -> Optional[str]:
    def _inr(x):
        x = float(x)
        if x >= 10_000_000:
            return f"₹{x/10_000_000:.2f} Cr"
        if x >= 100_000:
            return f"₹{x/100_000:.1f} L"
        return f"₹{int(x):,}"
    if lo and hi:
        return f"{_inr(lo)} – {_inr(hi)}"
    if hi:
        return f"Up to {_inr(hi)}"
    if lo:
        return f"From {_inr(lo)}"
    return None


def _build_html(lead: dict, kind: str, ctx: dict) -> str:
    now = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
    interest_label = "Interested Property"
    interest_value = ctx.get("property_title") or ctx.get("project_name") or "General enquiry"
    if ctx.get("project_name"):
        interest_label = "Interested Project"

    rows = [
        _fmt_row("Name", lead.get("name")),
        _fmt_row("Mobile", lead.get("phone")),
        _fmt_row("Email", lead.get("email")),
        _fmt_row(interest_label, interest_value),
        _fmt_row("Configuration", lead.get("configuration") or (f"{lead.get('bhk')} BHK" if lead.get("bhk") else None)),
        _fmt_row("Budget", _fmt_budget(lead.get("budget_min"), lead.get("budget_max"))),
        _fmt_row("Preferred Location", lead.get("preferred_location")),
        _fmt_row("Preferred Visit", " ".join(filter(None, [lead.get("preferred_visit_date"), lead.get("preferred_visit_time")])) or None),
        _fmt_row("Message", lead.get("message")),
        _fmt_row("Source Page", lead.get("source_url")),
        _fmt_row("Source", lead.get("source")),
        _fmt_row("Submitted At", now),
    ]

    return f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f9fc;padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);color:#ffffff;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.14em;opacity:0.9;">CarpetAdda</div>
            <div style="font-size:22px;font-weight:700;margin-top:6px;">New {escape(kind)} Enquiry</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              {''.join(r for r in rows if r)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;border-top:1px solid #e2e8f0;">
            Lead ID: {escape(str(lead.get('id') or '—'))} · Sent by CarpetAdda lead pipeline
          </td>
        </tr>
      </table>
    </div>
    """


async def send_lead_notification(lead: dict, kind: str = "Property", ctx: dict | None = None) -> bool:
    """Send a lead notification using SMTP when configured, with Emergent as a legacy fallback."""
    cfg = _cfg()
    ctx = ctx or {}
    html = _build_html(lead, kind, ctx)
    subject_target = ctx.get("property_title") or ctx.get("project_name") or "Website"
    subject = f"[CarpetAdda Lead] {kind} · {lead.get('name', 'Unknown')} · {subject_target}"

    if await _send_smtp(cfg["to"], subject, html):
        return True

    if not cfg["key"]:
        log.warning("No SMTP configuration or EMERGENT_EMAIL_KEY; skipping email dispatch")
        return False

    payload = {
        "to": [cfg["to"]],
        "subject": subject,
        "html": html,
        "from_name": cfg["from_name"],
    }
    if lead.get("email"):
        payload["contact_email"] = lead["email"]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": cfg["key"]},
                json=payload,
            )
        if resp.status_code >= 400:
            log.error("Legacy email send failed %s: %s", resp.status_code, resp.text[:200])
            return False
        log.info("Lead email delivered to %s", cfg["to"])
        return True
    except Exception as e:
        log.error("Legacy email exception: %s", e)
        return False


async def send_account_email(to: str, subject: str, html: str) -> bool:
    cfg = _cfg()
    if await _send_smtp(to, subject, html):
        return True
    if not cfg["key"]:
        log.warning("No SMTP configuration or EMERGENT_EMAIL_KEY; account email not sent")
        return False
    payload = {"to": [to], "subject": subject, "html": html, "from_name": cfg["from_name"]}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": cfg["key"]},
                json=payload,
            )
        if resp.status_code >= 400:
            log.error("Legacy account email failed %s: %s", resp.status_code, resp.text[:200])
            return False
        return True
    except Exception as e:
        log.error("Legacy account email exception: %s", e)
        return False

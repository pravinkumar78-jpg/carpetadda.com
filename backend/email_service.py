"""CarpetAdda single backend email service.

Priority: business SMTP (when SMTP_HOST/USER/PASSWORD configured, e.g. Hostinger)
→ Emergent managed email proxy (EMERGENT_EMAIL_KEY). Every send attempt is logged
to the email_log collection with status + real error. Never fabricates success.
"""
import os
import re
import ipaddress
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from html import escape
from html.parser import HTMLParser
from typing import Optional
from urllib.parse import urlparse

import httpx

log = logging.getLogger("carpetadda.email")

# Emergent managed email proxy — constant by design (survives deployment)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"

# Demo/test domains — never CC confidential leads to these
DEMO_EMAIL_DOMAINS = {"estatehub.in", "example.com", "example.in", "example.org", "test.com"}

_db = None


def bind_db(db):
    global _db
    _db = db


def _cfg():
    return {
        "key": os.environ.get("EMERGENT_EMAIL_KEY"),
        "from_name": os.environ.get("SMTP_FROM_NAME") or os.environ.get("EMAIL_FROM_NAME", "CarpetAdda"),
        "to": os.environ.get("LEAD_RECIPIENT_EMAIL", "contact@carpetadda.com"),
        "smtp_host": os.environ.get("SMTP_HOST"),
        "smtp_port": int(os.environ.get("SMTP_PORT", "465")),
        "smtp_user": os.environ.get("SMTP_USER"),
        "smtp_password": os.environ.get("SMTP_PASSWORD"),
        "smtp_from": os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_USER"),
        "smtp_secure": (os.environ.get("SMTP_SECURE", "ssl")).lower(),
    }


def smtp_configured() -> bool:
    c = _cfg()
    return bool(c["smtp_host"] and c["smtp_user"] and c["smtp_password"] and c["smtp_from"])


# ---------------------------------------------------------------- logging ----
async def record_email_log(kind: str, to, subject: str, status: str, error: Optional[str] = None,
                           provider: Optional[str] = None, payload: Optional[dict] = None,
                           meta: Optional[dict] = None, resend_of: Optional[str] = None):
    """Persist every send attempt so admins can see real delivery status and resend failures."""
    if _db is None:
        return
    try:
        await _db.email_log.insert_one({
            "id": __import__("uuid").uuid4().hex,
            "kind": kind, "to": to if isinstance(to, list) else [to],
            "subject": subject[:200], "status": status, "error": error,
            "provider": provider, "at": datetime.now(timezone.utc).isoformat(),
            "payload": payload, "meta": meta or {}, "resend_of": resend_of,
        })
    except Exception as e:
        log.error("email_log write failed: %s", e)


# ------------------------------------------------- safety gate (G2/G3) -------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _absolutize(html: str) -> str:
    """Convert app-relative asset URLs to absolute https before the safety gate."""
    base = (os.environ.get("FRONTEND_URL") or "https://carpetadda.com").rstrip("/")
    html = re.sub(r'(src|href)=(["\'])(?!https?://|mailto:|tel:|cid:|#)(/[^"\']*)\2',
                  lambda m: f'{m.group(1)}={m.group(2)}{base}{m.group(3)}{m.group(2)}', html, flags=re.I)
    return html


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


# ------------------------------------------------------------------ senders --
async def _send_smtp(to: str, subject: str, html: str, cc=None, reply_to=None) -> tuple:
    """Returns (ok, error). error is the real failure reason."""
    cfg = _cfg()
    if not smtp_configured():
        return False, "SMTP not configured"
    msg = EmailMessage()
    msg["From"] = f'{cfg["from_name"]} <{cfg["smtp_from"]}>'
    msg["To"] = to
    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = reply_to
    msg["Subject"] = subject
    msg.set_content("Please view this message in an HTML-capable email client.")
    msg.add_alternative(html, subtype="html")
    try:
        if cfg["smtp_secure"] == "ssl" or cfg["smtp_port"] == 465:
            with smtplib.SMTP_SSL(cfg["smtp_host"], cfg["smtp_port"], timeout=15) as server:
                server.login(cfg["smtp_user"], cfg["smtp_password"])
                server.send_message(msg)
        else:
            with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=15) as server:
                server.starttls()
                server.login(cfg["smtp_user"], cfg["smtp_password"])
                server.send_message(msg)
        return True, None
    except smtplib.SMTPAuthenticationError as e:
        return False, f"SMTP authentication failed: {e}"
    except smtplib.SMTPRecipientsRefused as e:
        return False, f"SMTP recipients rejected: {e}"
    except smtplib.SMTPSenderRefused as e:
        return False, f"SMTP sender rejected: {e}"
    except Exception as e:
        return False, f"SMTP error: {type(e).__name__}: {e}"


async def _send_proxy(to: str, subject: str, html: str, cc=None, reply_to=None) -> tuple:
    """Emergent managed email proxy. Returns (ok, error)."""
    cfg = _cfg()
    if not cfg["key"]:
        return False, "EMERGENT_EMAIL_KEY not configured"
    try:
        _assert_safe_email(subject, html)
    except ValueError as e:
        return False, f"Email safety gate: {e}"
    payload = {"to": [to] + list(cc or []), "subject": subject, "html": html,
               "from_name": cfg["from_name"]}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": cfg["key"]},
                json=payload,
            )
        if resp.status_code >= 400:
            return False, f"Email proxy HTTP {resp.status_code}: {resp.text[:300]}"
        return True, None
    except Exception as e:
        return False, f"Email proxy error: {type(e).__name__}: {e}"


async def _deliver(to: str, subject: str, html: str, cc=None, reply_to=None, kind="general") -> bool:
    """Single delivery path: SMTP if configured, else managed proxy. Logs the real result."""
    html = _absolutize(html)
    if smtp_configured():
        ok, err = await _send_smtp(to, subject, html, cc=cc, reply_to=reply_to)
        provider = "smtp"
    else:
        ok, err = await _send_proxy(to, subject, html, cc=cc, reply_to=reply_to)
        provider = "emergent-proxy"
    recipients = [to] + list(cc or [])
    await record_email_log(kind, recipients, subject, "sent" if ok else "failed", None if ok else err, provider)
    if not ok:
        log.error("Email delivery failed (%s): %s", kind, err)
    return ok


async def smtp_self_test() -> dict:
    """Admin diagnostics: report config status; when SMTP configured, really connect + authenticate."""
    cfg = _cfg()
    if smtp_configured():
        try:
            if cfg["smtp_secure"] == "ssl" or cfg["smtp_port"] == 465:
                with smtplib.SMTP_SSL(cfg["smtp_host"], cfg["smtp_port"], timeout=12) as server:
                    server.login(cfg["smtp_user"], cfg["smtp_password"])
            else:
                with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=12) as server:
                    server.starttls()
                    server.login(cfg["smtp_user"], cfg["smtp_password"])
            return {"smtp_status": "CONNECTED", "provider": "smtp", "detail": f"Authenticated with {cfg['smtp_host']} as {cfg['smtp_user']}"}
        except smtplib.SMTPAuthenticationError as e:
            return {"smtp_status": "FAILED", "provider": "smtp", "detail": f"Authentication failed: {e}"}
        except Exception as e:
            return {"smtp_status": "FAILED", "provider": "smtp", "detail": f"{type(e).__name__}: {e}"}
    if cfg["key"]:
        return {"smtp_status": "NOT CONFIGURED", "provider": "emergent-proxy",
                "detail": "Business SMTP not configured — using Emergent managed email delivery. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL to use your own mailbox."}
    return {"smtp_status": "NOT CONFIGURED", "provider": None,
            "detail": "Missing env vars: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL (or EMERGENT_EMAIL_KEY)"}


# ------------------------------------------------------------- formatting ----
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


def _lead_html(lead: dict, kind: str, ctx: dict) -> str:
    rows = "".join([
        _fmt_row("Name", lead.get("name")),
        _fmt_row("Mobile", lead.get("phone")),
        _fmt_row("Email", lead.get("email")),
        _fmt_row("Message", lead.get("message")),
        _fmt_row("Enquiry Type", kind),
        _fmt_row("Interested Property", ctx.get("prop_name") or ctx.get("project_name")),
        _fmt_row("Listing ID", lead.get("property_id") or lead.get("project_id")),
        _fmt_row("Location", ctx.get("location")),
        _fmt_row("Price", ctx.get("price_label")),
        _fmt_row("Agent / Developer", ctx.get("agent_name") or ctx.get("developer_name")),
        _fmt_row("Budget", _fmt_budget(lead.get("budget_min"), lead.get("budget_max"))),
        _fmt_row("Preferred Location", lead.get("preferred_location")),
        _fmt_row("Visit", " ".join(x for x in [lead.get("preferred_visit_date"), lead.get("preferred_visit_time")] if x)),
        _fmt_row("Profession", lead.get("profession")),
        _fmt_row("Designation", lead.get("designation")),
        _fmt_row("Company", lead.get("company_name")),
        _fmt_row("Property Finalised", {True: "Yes", False: "No"}.get(lead.get("property_finalised"), None)),
        _fmt_row("Property Cost", _inr_safe(lead.get("property_cost"))),
        _fmt_row("Loan Amount", _inr_safe(lead.get("loan_amount"))),
        _fmt_row("Lead ID", lead.get("id")),
        _fmt_row("Submitted At", lead.get("created_at")),
        _fmt_row("Source Page", ctx.get("source_page") or lead.get("landing_page")),
        _fmt_row("Source URL", lead.get("source_url")),
    ])
    photo = ctx.get("photo") or ""
    photo_html = (
        f'<div style="margin-top:16px"><img src="{escape(photo)}" alt="Listing photo" '
        f'style="max-width:520px;width:100%;border-radius:12px;border:1px solid #e2e8f0"/></div>'
        if photo else ""
    )
    return (
        f'<div style="font-family:Poppins,Arial,sans-serif;max-width:640px;margin:0 auto">'
        f'<div style="background:#708DE6;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">'
        f'<div style="font-size:18px;font-weight:600">New {escape(kind)} Enquiry</div>'
        f'<div style="font-size:12px;opacity:.85">CarpetAdda.com</div></div>'
        f'<div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:8px 20px 20px">'
        f'<table style="width:100%;border-collapse:collapse;margin-top:12px">{rows}</table>{photo_html}'
        f'<p style="font-size:11px;color:#94a3b8;margin-top:16px">Reply to this email to respond directly to the client. Sent by CarpetAdda.com — we never ask for passwords or card details by email.</p>'
        f'</div></div>'
    )


def _inr_safe(x) -> Optional[str]:
    try:
        if not x:
            return None
        x = float(x)
        if x >= 10_000_000:
            return f"₹{x/10_000_000:.2f} Cr"
        if x >= 100_000:
            return f"₹{x/100_000:.1f} L"
        return f"₹{int(x):,}"
    except Exception:
        return str(x) if x else None


async def send_lead_notification(lead: dict, kind: str = "Property", ctx: dict | None = None) -> bool:
    """Send enquiry to the business inbox; CC the linked agent/developer when provided.
    Never lets a CC failure block the primary email."""
    cfg = _cfg()
    ctx = ctx or {}
    prop_name = ctx.get("prop_name") or ctx.get("project_name")
    subject_map = {
        "Property": f"New Property Enquiry — {prop_name or 'General'}",
        "Project": f"New Project Enquiry — {prop_name or 'General'}",
        "Site Visit": f"New Site Visit Request — {prop_name or 'General'}",
        "Home Loan": "New Home Loan Enquiry",
        "Requirement": "New Property Requirement",
        "Contact": "New Contact Enquiry",
    }
    subject = subject_map.get(kind, f"New {kind} Enquiry — {prop_name or 'CarpetAdda'}")
    html = _lead_html(lead, kind, ctx)
    reply_to = lead.get("email") if lead.get("email") and "@" in str(lead.get("email")) else None
    cc = [e for e in (ctx.get("extra_recipients") or []) if e and e != cfg["to"]]
    return await _deliver(cfg["to"], subject, html, cc=cc or None, reply_to=reply_to, kind=f"lead:{kind.lower()}")


async def send_lead_notification_report(lead: dict, kind: str = "Property", ctx: dict | None = None) -> tuple:
    """Same as send_lead_notification but returns (ok, error) for status write-back."""
    cfg = _cfg()
    ctx = ctx or {}
    prop_name = ctx.get("prop_name") or ctx.get("project_name")
    subject_map = {
        "Property": f"New Property Enquiry — {prop_name or 'General'}",
        "Project": f"New Project Enquiry — {prop_name or 'General'}",
        "Site Visit": f"New Site Visit Request — {prop_name or 'General'}",
        "Home Loan": "New Home Loan Enquiry",
        "Requirement": "New Property Requirement",
        "Contact": "New Contact Enquiry",
    }
    subject = subject_map.get(kind, f"New {kind} Enquiry — {prop_name or 'CarpetAdda'}")
    html = _absolutize(_lead_html(lead, kind, ctx))
    reply_to = lead.get("email") if lead.get("email") and "@" in str(lead.get("email")) else None
    raw_cc = [e for e in (ctx.get("extra_recipients") or []) if e and e != cfg["to"]]
    # Never send confidential leads to demo/test addresses — admin must set a real email first
    demo_cc = [e for e in raw_cc if e.lower().split("@")[-1] in DEMO_EMAIL_DOMAINS]
    cc = [e for e in raw_cc if e not in demo_cc]
    for d in demo_cc:
        await record_email_log(f"lead:{kind.lower()}:cc", [d], subject, "skipped",
                               "Demo address — set a real Agent/Developer email to enable CC delivery",
                               meta={"lead_id": lead.get("id"), "listing": prop_name})
    meta = {"lead_id": lead.get("id"), "listing": prop_name, "client": lead.get("name")}

    # STEP 1: primary business email — never blocked by CC issues
    payload = {"to": [cfg["to"]], "subject": subject, "html": html, "reply_to": reply_to}
    if smtp_configured():
        ok, err = await _send_smtp(cfg["to"], subject, html, cc=None, reply_to=reply_to)
        provider = "smtp"
    else:
        ok, err = await _send_proxy(cfg["to"], subject, html, cc=None, reply_to=reply_to)
        provider = "emergent-proxy"
    await record_email_log(f"lead:{kind.lower()}", [cfg["to"]], subject, "sent" if ok else "failed",
                           None if ok else err, provider, payload=payload, meta=meta)
    if not ok:
        log.error("Primary enquiry email failed (%s): %s", kind, err)

    # STEP 2: agent/developer copy — separate send, failure never affects the primary
    if cc:
        if smtp_configured():
            cc_ok, cc_err = await _send_smtp(cc[0], subject, html, cc=cc[1:] or None, reply_to=reply_to)
        else:
            cc_ok, cc_err = await _send_proxy(cc[0], subject, html, cc=cc[1:] or None, reply_to=reply_to)
        await record_email_log(f"lead:{kind.lower()}:cc", cc, subject, "sent" if cc_ok else "failed",
                               None if cc_ok else cc_err, provider,
                               payload={**payload, "to": cc}, meta=meta)
        if not cc_ok:
            log.warning("Agent/Developer CC failed (%s): %s", kind, cc_err)
            err = (err + " | " if err else "") + f"CC failed: {cc_err}"
    return ok, err


async def send_account_email(to: str, subject: str, html: str, kind: str = "account") -> bool:
    return await _deliver(to, subject, html, kind=kind)


_VALID_EMAIL = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


async def send_client_auto_reply(lead: dict, kind: str, ctx: dict | None = None) -> tuple:
    """Auto-confirm receipt to the client. Only when a valid client email exists."""
    ctx = ctx or {}
    client_email = (lead.get("email") or "").strip()
    if not _VALID_EMAIL.match(client_email):
        return False, "no valid client email"
    listing = ctx.get("prop_name") or ctx.get("project_name")
    name = escape(str(lead.get("name") or "there"))
    rows = "".join([
        _fmt_row("Enquiry Type", kind),
        _fmt_row("Property / Project", listing),
        _fmt_row("Reference ID", lead.get("id")),
    ])
    html = _absolutize(
        f'<div style="font-family:Poppins,Arial,sans-serif;max-width:640px;margin:0 auto">'
        f'<div style="background:#708DE6;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">'
        f'<div style="font-size:18px;font-weight:600">We received your enquiry</div>'
        f'<div style="font-size:12px;opacity:.85">CarpetAdda.com</div></div>'
        f'<div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px">'
        f'<p style="color:#0f172a;font-size:14px">Hello {name},</p>'
        f'<p style="color:#475569;font-size:14px;line-height:1.7">Thank you for reaching out to CarpetAdda. '
        f'We have received your enquiry and our team will get back to you shortly.</p>'
        f'<table style="width:100%;border-collapse:collapse;margin-top:12px">{rows}</table>'
        f'<p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px">Need anything sooner? '
        f'Reply to this email or WhatsApp us at +91 88288 30707.</p>'
        f'<p style="font-size:11px;color:#94a3b8;margin-top:16px">CarpetAdda.com — we never ask for passwords or card details by email.</p>'
        f'</div></div>'
    )
    if smtp_configured():
        ok, err = await _send_smtp(client_email, "We received your enquiry — CarpetAdda", html)
        provider = "smtp"
    else:
        ok, err = await _send_proxy(client_email, "We received your enquiry — CarpetAdda", html)
        provider = "emergent-proxy"
    await record_email_log("auto_reply", [client_email], "We received your enquiry — CarpetAdda",
                           "sent" if ok else "failed", None if ok else err, provider,
                           payload={"to": [client_email], "subject": "We received your enquiry — CarpetAdda", "html": html},
                           meta={"lead_id": lead.get("id"), "listing": listing, "client": lead.get("name")})
    return ok, err


async def resend_email_log(log_id: str) -> tuple:
    """Admin resend: re-deliver a stored payload; records a new attempt."""
    if _db is None:
        return False, "database unavailable"
    doc = await _db.email_log.find_one({"id": log_id}, {"_id": 0})
    if not doc:
        return False, "Email log entry not found"
    payload = doc.get("payload") or {}
    to = (payload.get("to") or doc.get("to") or [])
    to = to if isinstance(to, list) else [to]
    if not payload.get("html") or not to:
        return False, "This log entry has no stored email content to resend (only entries logged after this update carry resend data)"
    if smtp_configured():
        ok, err = await _send_smtp(to[0], payload.get("subject", doc.get("subject", "CarpetAdda")),
                                   payload["html"], cc=to[1:] or None, reply_to=payload.get("reply_to"))
        provider = "smtp"
    else:
        ok, err = await _send_proxy(to[0], payload.get("subject", doc.get("subject", "CarpetAdda")),
                                    payload["html"], cc=to[1:] or None, reply_to=payload.get("reply_to"))
        provider = "emergent-proxy"
    await record_email_log(doc.get("kind", "resend"), to, payload.get("subject", doc.get("subject", "")),
                           "sent" if ok else "failed", None if ok else err, provider,
                           payload=payload, meta=doc.get("meta") or {}, resend_of=log_id)
    return ok, err

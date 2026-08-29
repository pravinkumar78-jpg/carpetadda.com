import api from "@/lib/api";

/**
 * Minimal anonymous visitor tracking. Fire-and-forget — analytics never block the site.
 * Identity = random localStorage visitor id + per-tab session id. No personal data is sent.
 */
export const getVisitorId = () => {
  let v = localStorage.getItem("eh_visitor_id");
  if (!v) { v = crypto.randomUUID(); localStorage.setItem("eh_visitor_id", v); }
  return v;
};

const getSessionId = () => {
  let s = sessionStorage.getItem("eh_session_id");
  if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("eh_session_id", s); }
  return s;
};

let sessionMarked = false;

export const track = (event, meta = {}) => {
  try {
    const sessionStart = !sessionMarked;
    sessionMarked = true;
    api.post("/analytics/track", {
      event,
      path: window.location.pathname,
      referrer: document.referrer || "",
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      session_start: sessionStart,
      meta,
    }).catch(() => {});
  } catch { /* ignore */ }
};

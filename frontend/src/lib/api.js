import axios from "axios";

// Production uses same-origin `/api` and lets Express proxy to the backend.
// REACT_APP_BACKEND_URL is optional and intentionally not required for Hostinger.
const configured = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
// Production default: same-origin /api, which Hostinger's Express server proxies.
export const API = configured ? `${configured}/api` : "/api";

const client = axios.create({ baseURL: API, timeout: 20000 });

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("eh_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  (resp) => resp,
  (err) => {
    // Fingerprint: HTML body means the request hit a static host instead of the real API.
    const ct = err?.response?.headers?.["content-type"] || "";
    if (ct.includes("text/html")) {
      console.error(
        "[CarpetAdda] API returned HTML instead of JSON. Check the Hostinger BACKEND_URL/proxy configuration."
      );
    }
    if (err?.response?.status === 503) {
      console.error("[CarpetAdda] Backend is not configured or unavailable.", err.response?.data);
    }
    return Promise.reject(err);
  }
);

export default client;

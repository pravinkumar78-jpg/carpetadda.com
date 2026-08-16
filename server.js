// CarpetAdda — Hostinger Node entry point.
// Serves the React production build and proxies /api to the FastAPI backend.
// The FastAPI backend must be running on the same host (see HOSTINGER_DEPLOYMENT.md).
const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8001";

app.use("/api", createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { "^/api": "/api" },
  proxyTimeout: 30000,
}));

const buildDir = path.join(__dirname, "frontend", "build");
app.use(express.static(buildDir, { maxAge: "7d", index: false }));

// SPA fallback — every non-API route serves index.html
app.get("*", (req, res) => res.sendFile(path.join(buildDir, "index.html")));

app.listen(PORT, () => console.log(`CarpetAdda frontend serving on :${PORT}, /api -> ${BACKEND_URL}`));

/* CarpetAdda Hostinger wrapper: static React build + /api reverse proxy + SPA fallback. */
const path = require("path");
const express = require("express");
const httpProxy = require("http-proxy");

const PORT = parseInt(process.env.PORT || "8080", 10);
const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:8001").replace(/\/$/, "");
const BUILD_DIR = path.resolve(process.env.BUILD_DIR || path.join(__dirname, "..", "..", "frontend", "build"));

const app = express();
const proxy = httpProxy.createProxyServer({ target: BACKEND_URL, changeOrigin: true, ws: true });

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/api") {
    return proxy.web(req, res, {}, (err) => {
      res.statusCode = 502;
      res.end("Backend unavailable");
    });
  }
  next();
});

app.use(express.static(BUILD_DIR, { maxAge: "1d", index: "index.html" }));

app.get("*", (req, res) => res.sendFile(path.join(BUILD_DIR, "index.html")));

const server = app.listen(PORT, () => {
  console.log(`CarpetAdda listening on :${PORT} (api -> ${BACKEND_URL}, build: ${BUILD_DIR})`);
});
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/api/")) proxy.ws(req, socket, head);
});

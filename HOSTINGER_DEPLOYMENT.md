# CarpetAdda — Hostinger Deployment Guide

Stack: React (CRA) frontend + FastAPI backend + MongoDB. FastAPI must run on a host with Python — use a **Hostinger VPS (KVM)**. This is the recommended and simplest path.

## Option A — Hostinger VPS (recommended)

1. **Upload** the project to the VPS (e.g. `/var/www/carpetadda`) via SFTP/SSH or Git.
2. **MongoDB**: create a free MongoDB Atlas cluster (or install MongoDB on the VPS). Whitelist the server IP.
3. **Backend** (`/var/www/carpetadda/backend`):
   ```bash
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env   # then fill values (see below)
   ```
   Fill `.env`: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`/`SITE_URL` (your domain), SMTP (Hostinger mailbox works) or `EMERGENT_EMAIL_KEY`.
   Run it as a service:
   ```bash
   uvicorn server:app --host 127.0.0.1 --port 8001   # use systemd/supervisor to keep alive
   ```
4. **Frontend**: either pre-build locally and upload `frontend/build`, or on the VPS:
   ```bash
   cd frontend && cp .env.example .env   # leave REACT_APP_BACKEND_URL empty for same-origin /api
   yarn install && yarn build
   ```
5. **Node wrapper** (project root):
   ```bash
   npm install
   PORT=3000 BACKEND_URL=http://127.0.0.1:8001 node server.js   # keep alive with pm2: pm2 start server.js
   ```
6. **Domain/SSL**: point your domain to the VPS; install Let's Encrypt via `certbot` or Hostinger panel; proxy port 80/443 → 3000 (nginx or Hostinger's Node app config).

Uploaded files are stored under `backend/uploads/` (served at `/api/files/...`) — back up this folder.

## Option B — Hostinger shared hosting (Node.js plan) + external API

Shared hosting cannot run Python. Host the FastAPI backend elsewhere (any Python host/VPS), then:
- `frontend/.env`: `REACT_APP_BACKEND_URL=https://api.your-domain.com` before `yarn build`.
- Upload `server.js`, `package.json`, and `frontend/build/`; set the app startup file to `server.js` and env `BACKEND_URL=https://api.your-domain.com` (no trailing slash).
- Backend `.env`: set `CORS_ORIGINS=https://your-domain.com`.

## Environment files
- `backend/.env.example` — all backend variables (MongoDB, JWT, CORS, URLs, email).
- `frontend/.env.example` — `REACT_APP_BACKEND_URL` (empty = same-origin `/api`).

## Post-deploy smoke test
- `/` loads, search works; `/projects?category=commercial` shows Commercial Projects.
- Admin login at `/login` → `/admin`; submit one test enquiry → email arrives at contact@carpetadda.com.

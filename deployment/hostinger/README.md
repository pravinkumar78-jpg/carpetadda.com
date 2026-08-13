# CarpetAdda — Hostinger Web App deployment

Everything in this folder reproduces the original Hostinger packaging:
a single Node/Express process that serves the built React app and proxies
`/api/*` to the FastAPI backend.

## Layout
```
deployment/hostinger/
├── package.json      # Node deps for the wrapper (express + http-proxy)
├── server.js         # Express static host + /api proxy + SPA fallback
└── README.md         # this file
```

## Steps
1. Backend: upload `/app/backend` to the server (or a Python-capable host).
   ```
   pip install -r requirements.txt
   cp .env.example .env   # fill MONGO_URL, JWT_SECRET, SMTP_* etc.
   uvicorn server:app --host 0.0.0.0 --port 8001
   ```
2. Frontend build:
   ```
   cd frontend
   cp .env.example .env   # set REACT_APP_BACKEND_URL (empty = same origin)
   yarn install && yarn build
   ```
3. Serve: copy `frontend/build` next to this folder and run:
   ```
   cd deployment/hostinger
   npm install
   BACKEND_URL=http://127.0.0.1:8001 BUILD_DIR=../../frontend/build PORT=8080 node server.js
   ```
4. Point the Hostinger Web App start command at `node server.js` with the
   environment variables above configured in the Hostinger panel.

## Environment variables
- `PORT` — port Hostinger assigns (default 8080)
- `BACKEND_URL` — where the FastAPI backend listens (default http://127.0.0.1:8001)
- `BUILD_DIR` — path to the React build folder (default ../../frontend/build)

Backend env: see /app/backend/.env.example
Frontend env: see /app/frontend/.env.example

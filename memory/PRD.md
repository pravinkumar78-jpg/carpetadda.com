# CarpetAdda — PRD

## Original Problem Statement
"Start with ZIP file for real estate website" — user uploaded `CarpetAdda_FINAL_DEPLOY_FIXED.zip`, a full-stack premium Indian real-estate marketplace (React + FastAPI + MongoDB) previously packaged for Hostinger. Follow-up directive: make it genuinely award-worthy (Awwwards SOTD level) — bold dark editorial luxury art direction, kinetic hero with masked line-by-line reveal, clipped-frame photography, numbered manifesto chapters, slow editorial marquee, framer-motion scroll reveals, lenis smooth scrolling, parallax hero.

## Architecture
- Backend: FastAPI + Motor (async MongoDB) at /app/backend/server.py — routes under /api (auth JWT+bcrypt, properties, projects, locations, developers, agents, leads, favorites, admin CMS, settings, homepage aggregate)
- Frontend: React 19 + CRA/craco + Tailwind + shadcn/ui + framer-motion + lenis at /app/frontend
- DB: MongoDB via MONGO_URL / DB_NAME env; seed.py creates demo dataset (48 properties, 10 projects, 5 developers, 5 agents, 17 locations, 4 blogs, 4 testimonials)
- Art direction: Dark Editorial Luxury — obsidian #0B0C0E, champagne gold #D4AF37, Playfair Display / Cinzel / Plus Jakarta Sans / Space Mono

## User Personas
- Luxury buyer/investor browsing curated MMR listings
- Renter searching verified homes
- Agent/developer managing listings via role dashboards
- Super admin managing all content via /admin

## Implemented (2026-08-13)
- ZIP restored into Emergent environment (Hostinger Express wrapper dropped; standard React↔FastAPI wiring)
- Fixed broken regex in src/lib/api.js from ZIP export
- Backend deps installed (httpx), JWT_SECRET added, DB seeded
- Full Home page redesign: kinetic hero (masked line reveal + mouse-parallax floating clipped frames + scroll parallax), editorial marquee, spotlight property cards with city filter pills, numbered manifesto chapters (01–04 accordion), new-launch showcase, locality explorer with YoY trends, live EMI widget (sliders + principal/interest split), developer/agent/testimonial directory, VIP concierge lead capture (POST /api/leads, verified in DB)
- Dark glassmorphic gold header + monumental gold-shimmer footer
- Lenis momentum scrolling globally

## Verified
- API: /api/properties, /api/projects, /api/locations, /api/auth/login, /api/admin/stats, /api/leads (curl)
- E2E: hero search → /properties filtering, lead form submit → success toast → lead in DB, EMI calculator output correct, no console errors

## Backlog
- P0: none blocking
- P1: extend dark editorial theme to inner pages (Properties, Property Detail, Projects) — currently light theme with dark chrome
- P1: hero background could rotate dusk skyline imagery per settings CMS
- P2: AI Search page restyle to match; lead email SMTP config (currently no SMTP creds set)
- P2: 3D tilt/tilt-glare on property cards, page transitions between routes

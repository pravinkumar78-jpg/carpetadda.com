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

## Implemented (2026-08-13, iteration 2 — client change list)
- Reverted to LIGHT theme globally (Poppins; Arial for ₹ via .rupee class)
- Header: Home | Properties (dropdown: Buy/Rent/Residential/Commercial Projects) | Home Loan | New & Blog | Sign-in | List Property; Journal removed
- Footer: light, no giant wordmark, header items + About/Contact/FAQs, RERA A51700039535 in copyright, phone 8828830707 everywhere (DB settings + all wa/tel links)
- Home hero: new headline, overline/stats/floating images removed; "Expert Choice Projects"; "Share Your Requirement" lead form; Projects tab search shows Status: Residential|Commercial (backend category filter added)
- Directory: "Landmark Developers", agents gallery removed
- /home-loan page: Full Name/Mobile/Email/Profession/Designation/Company form → POST /leads (source=home_loan, new Lead fields) → Thank You; EMI page "Apply for Home Loan" button → /home-loan
- Property form: Unit Plan upload (fixed broken /media upload URL → /api/files), Add New Amenity (persists to amenities collection), rich-text description editor (bold/size/lists/alignment)
- Project form: Upload RERA QR, Upload Main Image above gallery, Add New Amenity, rich description, location link + nearby locations, Manage Units button
- Units: extended model (balcony, parking, unit_plan upload, description, published toggle, auto unit no, Save & Publish); published units included in public project detail
- Location: google_map_link + nearby_locations on both property & project; displayed on detail pages with map
- Project detail: main image + gallery as slider only (embla, arrows, loop); sections reordered per spec; collapsible Unit Plans accordion; Similar Projects
- Property detail: sections reordered per spec (gallery grid → overview → description → details → amenities → nearby+map → unit plan → schedule visit → similar)
- Admin: all tabs on LEFT, quick-action boxes clickable, SEO tab (per-page meta/OG/canonical editor, applied live via SeoManager), Archive tab with Restore; Delete replaced with Archive on properties & projects (status=archived, excluded everywhere public); SEO fields added to FAQs/Testimonials/Blogs dialogs
- Public /faqs page

## Verified (iteration 2)
- UI: header dropdowns, hero, project-status search → /projects?category=residential, home-loan form → Thank You → lead in DB with profession/company, admin login, quick actions, archive→Archive tab→Restore (toast confirmed), SEO save → live title on home, project slider arrows, property detail section order, amenity add persisted, EMI apply → /home-loan, FAQs page, mobile menu; console clean
- API: amenities POST, archive/restore, seo-pages PUT/GET, units POST with new fields, project detail includes units

## Backlog
- P0: none blocking
- P1: extend dark editorial theme to inner pages (Properties, Property Detail, Projects) — currently light theme with dark chrome
- P1: hero background could rotate dusk skyline imagery per settings CMS
- P2: AI Search page restyle to match; lead email SMTP config (currently no SMTP creds set)
- P2: 3D tilt/tilt-glare on property cards, page transitions between routes

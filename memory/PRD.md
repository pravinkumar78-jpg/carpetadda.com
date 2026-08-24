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

## Implemented (2026-08-13, iteration 3 — roles/CMS/email/security list)
- Property detail: arrow slider gallery, Balconies in Overview, contextual amenity icons (pool/gym/security/…), nearby-location category tabs (Schools|Hospitals|Metro|Railway|Buses|Market & Mall) with per-tab filtering
- Project detail: Download Brochure only when a real brochure URL exists
- Header: separate New Launch + Blog items
- Home loan form: + Property Finalised (Y/N), Property Cost, Loan Amount (Lead model extended)
- Admin users: Add User dialog (role/name/mobile/email/password/active/verified); POST /admin/users
- Security: register now creates email-verification flow (auto-verifies when no SMTP/EMERGENT_EMAIL_KEY configured), /auth/verify-email, /auth/resend-verification, PUT /auth/profile; change-password existed and is now in dashboards
- User dashboard: Overview (favorites/saved searches), My Listings with Archive/Restore, List Property (full form at /dashboard/list-property), Profile, Change Password, verification status, Logout
- Agent dashboard: List Residential/Commercial (full PropertyForm at /agent/list-property), Manage Leads, Clients, My Listings w/ archive, Profile, Password, Favorites/Saved/Browse/Compare links
- Developer dashboard: Add Project (full ProjectForm at /developer/projects/new), My Projects w/ units/edit/archive/restore (owner-scoped backend)
- Ownership-aware archive/restore + update endpoints (owner_id/agent_id or admin)
- FAQs seeded with 10 real Q&As; CMS pages module (admin CRUD + /page/:slug + auto footer links); Privacy Policy + Disclaimer seeded
- Blog content now rich-text editor; blog pages render HTML
- SEO defaults seeded for 12 major pages
- Hero text: "Every Dream Deserves an Address"
- Performance: removed Lenis scroll-hijack (instant native scroll); images lazy/eager tuned
- Admin overview stat cards clickable → jump to tabs
- Hostinger deployment package at /app/deployment/hostinger (server.js proxy wrapper + package.json + README) + backend/.env.example + frontend/.env.example
- Email alerts: pipeline live (background task → lead notification to LEAD_RECIPIENT_EMAIL); requires SMTP_* or EMERGENT_EMAIL_KEY in backend/.env to actually send

## Verified (iteration 3)
- API: register auto-verify, change password + re-login, forgot-password generic response, 403 on non-owner archive, FAQ list, seo pages, admin user create, CMS page CRUD + public fetch
- UI: hero text, header items, property slider + balconies + nearby tabs (Metro filter verified), FAQs live, user/agent/developer dashboards, full property form in agent dashboard, project form in developer dashboard, CMS page publish → footer link → public page with SEO title, home loan 9 fields, mobile instant scroll, zero console errors

## Implemented (2026-08-13, iteration 4 — approval workflow & ops)
- Approval workflow: non-admin submissions → status pending_review (invisible publicly until admin approve → active; reject → owner retains access via /my/properties/{id} for correction); block/unblock user accounts (blocked = 403 login + cannot publish, listings preserved); admin Approve/Reject buttons with confirms on Properties/Projects tabs; status labels (Pending Review/Approved/Rejected/Archived) shown in dashboards
- Agent/Developer forms: publish button = "Submit for Admin Review"; Flags tab (verified/featured) hidden from non-admins; backend force-strips verified/featured for non-admin creates
- Admin: Site Visits tab (enriched with listing + agent/developer names, status dropdown), Overview cards all real DB counts (incl. Pending Reviews, Approved Live, Agents, Developers), Users tab: create user + role edit + activate/deactivate + block/unblock with confirms
- Schedule Visit popup appears once per listing per session after 40% scroll; feeds Site Visits + email pipeline
- Lead emails now also go to the assigned agent/developer of approved listings (plus business inbox); blocked/inactive accounts excluded
- Property camera/location verification: optional camera capture (mobile capture=environment) + Use Current Location in Location tab; admin /verify endpoint grants the Verified badge
- Units: statuses Available/Limited Units/Hold/Token/Booked/Sold Out; buyer fields removed; unit plan upload; description; published toggle
- Blog: category dropdown with 10 real categories; Testimonial dialog scrollable; SEO: robots field added, tab verified error-free
- Home: "Best Ready to Move Properties"; city/category counts confirmed DB-real
- Terms of Use CMS page created + auto-linked in footer
- Fixed: public detail endpoints 404 for pending/rejected/draft listings; /my/properties|projects owner edit view added

## Verified (iteration 4)
- API: agent submit → pending_review (public 404) → admin approve → live 200 → reject → owner still sees via /my → agent self-approve 403 → block user → login 403 → unblock → 200
- UI: scroll popup at 40% → schedule dialog → visit saved → appears in Admin Site Visits with names; SEO tab dropdown/save no overlay error; agent form label + hidden flags; home title; real counts

## Implemented (2026-08-13, iteration 5 — SEO nav + polish)
- SEO moved to left sidebar as its own group below Settings: SEO ▸ Pages opens the page-by-page SEO editor (meta/OG/canonical/robots)
- ResizeObserver runtime error fixed at the ROOT: ResizeObserver callbacks now defer to requestAnimationFrame (eliminates the loop), plus capture-phase error interception as a safety net — verified with dropdown spam + refresh + page switching, zero overlays
- Pending Review quick-filter chip on admin Properties and Projects
- Rejection now opens a reason modal (required) and emails the listing owner (listing name, status, reason, resubmit instructions); reason stored in DB
- Agent workspace leads tab: performance board (Total/Contacted/Converted/Conversion rate) from real lead data
- email_service now reads SMTP_FROM_NAME; .env.example documents SMTP_HOST/PORT/USER/PASSWORD/FROM_EMAIL/FROM_NAME
- Admin property status dropdown shows proper labels

## Verified (iteration 5)
- UI: SEO ▸ Pages open/switch/save/refresh — no runtime error; Pending Review chip filters (0 shown, correct after QA cleanup); agent performance board renders real counts; rejection dialog code path
- Note: rejection email sends only once SMTP is configured (env-based, no hardcoded credentials)

## Pending manual step
- Add SMTP credentials (or EMERGENT_EMAIL_KEY) to backend/.env per backend/.env.example to activate live email delivery (lead alerts, verification, password reset). Until then emails are skipped and accounts auto-verify.

## Backlog
- P0: none blocking
- P1: extend dark editorial theme to inner pages (Properties, Property Detail, Projects) — currently light theme with dark chrome
- P1: hero background could rotate dusk skyline imagery per settings CMS
- P2: AI Search page restyle to match; lead email SMTP config (currently no SMTP creds set)
- P2: 3D tilt/tilt-glare on property cards, page transitions between routes

## Implemented (2026-08-13, iteration 6 — admin P0 fixes)
- Admin Leads status tabs crash fixed: load()/addNote() now catch errors with toasts; success toast on status/priority update
- Admin Site Visits: added missing PUT /api/site-visits/{id} (whitelisted fields, status validation, 404 JSON for unknown id); verified via testing agent (iteration_1.json: backend 12/12, E2E pass)

## Implemented (2026-08-13, iteration 7 — 13-item incremental batch)
- Hero de-washed (white/85 overlay → directional gradient); borders darkened to slate-300 (#CBD5E1) incl. --border var
- Dark mode: footer-only toggle (localStorage eh_theme + pre-paint init script), light default; full .dark CSS override system
- Post-property auth gate: logged-out → Login/Create Account with ?next=/post-property redirect; logged-in → form directly
- Commercial filter: category=commercial swaps BHK selector for Commercial Sub-Category (office/shop/showroom/warehouse/industrial/commercial_land/other via property_type param)
- New Launch /projects: grid/list toggle, keyword + BHK + location + price-slider filters, sort (newest/price low/high); GET /projects extended (bhk regex on configurations, price overlap, sorts); ProjectCard list layout
- Blog: category chips + keyword search (client-side over real data)
- Manage Profile (all roles): ordered form — Full Name, Mobile, Email readonly + Verify button/status, Office Address, DOB, Logo upload, Save; agents additionally get RERA Number; backend PUT /auth/profile extended (office_address/dob/avatar/rera_number; User/UserOut models extended)
- Admin SEO: selection ONLY via left sidebar (SEO ▸ Pages ▸ per-page items), page list with Configured/Not-set badges, dedicated edit screen, no in-dashboard dropdown
- 3D CSS isometric lead/conversion charts (LeadsChart.jsx) on Admin overview + Agent leads tab + Developer "Leads & Performance" tab; role-scoped GET /stats/leads (agent: own/agent-linked properties; developer: own projects)
- Developer project import: POST /projects/import (httpx fetch + meta/JSON-LD/price/BHK/RERA regex parsing, no LLM — Hostinger-safe) → pending_review draft, owner-scoped, never live until admin approves; developer dashboard banner + import modal
- POST /uploads (any authenticated user, images only) + ImageUpload 403 fallback (fixes agent/developer uploads); "avatars" kind added
- Fixed latent 500: Project model lacked owner_id (create_project crashed); added owner_id + import_source_url fields

## Implemented (2026-08-13, iteration 8 — fixes + theme list)
- Compilation fixed: RoleDashboards.jsx ClientDashboard restored (was clipped in edit); RegisterDeveloper.jsx confirmed; yarn build exits 0 clean
- Admin → Project form → Developer select: "+ Register New Developer" option + link → RegisterDeveloper modal (name/mobile/email/RERA/office address/website/experience/logo/about) → POST /admin/developers (dedupe by name/email) → auto-appears + auto-selected, form state preserved
- Global primary colour → #708DE6 via Tailwind blue palette override (blue-600=#708DE6) + index.css vars; Admin Quick Action buttons = WHITE bg + BLACK text (exception); Approve/Reject/Save/Update/etc. = #708DE6 + white
- Hero SearchBar bg → #C3CFF5 (tabs white/70, inputs stay readable)
- Dark mode: bg #162E2A, all primary/heading/label/nav/card/table text WHITE (secondary #C4D6D0/#A9C0B9), Poppins enforced on inputs/selects/modals, placeholders #9DB4AC, popover/listbox/menu surfaces #1C3833 with light options (CSS var override + role selectors — root fix for white-on-white Select panels); dark hero image /hero-dark.webp (only in dark); white logo /logo-dark.png swaps in header+footer in dark mode
- Site-wide "RERA A51700039535" removed from footer (verified no other occurrences in code/settings/SEO APIs)
- Pending Review filter + Approve/Reject row buttons: whitespace-nowrap, consistent h-8/h-10, flex-wrap rows — no overlap/clipping at 375px (verified iteration_3.json)
- Add New Amenity: now opens modal (AddAmenity.jsx) in Property + Project forms; client+server dedupe, auto-select, success/error toasts; inline quick-add retained with empty-input error toast

## Verified
- iteration_1.json: leads/site-visits fixes 12/12 backend + E2E pass
- iteration_2.json: 13-item batch E2E
- iteration_3.json: 96% frontend pass; sole HIGH (dark Select white-on-white) fixed via popover var override — self-verified rgb(28,56,51) panel + white options
- yarn build: exit 0, no "Compiled with problems"

## Backlog
- P1: React Hook dependency warnings in build (Compare, DashboardPages, RoleDashboards, AdminLeads, AdminProjects, AdminProperties, AdminUnits, AdminUsers, ProjectForm, PropertyForm) — non-breaking
- P1: ProjectForm data-testids on key fields/tabs/developer select/publish controls
- P2: SMTP creds for live email (backend/.env per .env.example)
- P2: hero image rotation via settings CMS; AI Search restyle

## Visual edit (2026-08-13, agentic edit — SearchBar)
- Hero search card: WHITE background + thin BLACK outer border (was #C3CFF5); Buy/Rent/Projects tabs now #708DE6 with WHITE text (active = same colour + shadow/bold); no layout/functionality change; verified via computed styles

## Implemented (2026-08-13, iteration 9 — admin Fetch Project Details)
- POST /api/projects/fetch-details (admin-only): scrape-only endpoint — fetches developer landing page (httpx), parses OG/meta/JSON-LD, prices (₹ L/Cr), BHK configs (incl. "2 & 3 BHK" pattern), carpet area range, RERA no, brochure link, gallery images, address/locality; matches developer by og:site_name against db.developers; matches page text against amenities collection; returns fields WITHOUT saving (nothing auto-created/published)
- Shared helpers _normalise_url (clear 400 for invalid URL; allows localhost/IP) + _fetch_page (clear 400 when site unreachable); 422 when nothing extractable; import_project refactored to use them
- ProjectForm Basic tab: prominent "Fetch Project Details" panel (URL input + button, spinner, duplicate-click guard, Enter key); prefill = fill-empty-only (edit mode) / factory defaults replaced on NEW form; developer auto-selected when matched, else prompts Register New Developer; source URL stored on project (import_source_url) and shown in panel
- Verified: curl 400 invalid/400 unreachable/422 empty/403 non-admin + full browser flow (title, description, developer, prices, configs, areas, RERA, brochure, images, amenities all prefilled; toast lists mapped fields)
- Light mode global theme (earlier same day): body bg #E0E7FA (unlayered body rule so components keep own bg), --border/--input #B9C4DA, layered border remaps (slate-100/200/300 darker), text-slate-400→#64748B / slate-500→#52617A, placeholders #6B7A90, tab active ring #5C76D4, card border #AEBBD2; dark mode unaffected (verified rgb(22,46,42))

## Implemented (2026-08-13, iteration 10 — comms, map cleanup, scroll popup)
- Emails: all enquiry forms → POST /api/leads → contact@carpetadda.com (LEAD_RECIPIENT_EMAIL default); linked agent/developer copies only for ACTIVE listings, now with blocked/rejected user guard (create_lead); email body carries name/mobile/email/message/listing name/lead ID/type/timestamp
- WhatsApp: all customer-facing buttons → wa.me/918828830707 (agent cards, agent detail, directory, contact, property/project cards+detail); testids added (contact-whatsapp, agent-detail-whatsapp, project-detail-whatsapp, agent-wa-<slug>); AdminLeads per-lead WA link intentionally kept (admin→lead CRM tool)
- Light-mode page bg → #E0F6FA (body + section-blue gradient #EAFBFD→#E0F6FA + bg-soft-blue); dark mode untouched
- /post-property → redirects logged-out users to /register (register → /dashboard); dashboard Overview now shows a prominent List Property CTA (dash-list-property) immediately after registration
- Map View removed from /properties listing (half_map layout + toggle + panel deleted); detail-page maps kept; List View toggle hidden on mobile (hidden md:inline-flex) on /properties + /projects
- Schedule Site Visit stacking fixed at root: .leaflet-container isolation:isolate + panes z-index:1 → maps can't paint over dialogs; ScrollVisitPopup rebuilt as centered modal overlay (z-[80], backdrop, close X, once per listing per session at 40% scroll, both Property+Project details); overlay closes before opening ScheduleVisitDialog (fixed dialog-unmount bug: dialog rendered outside the !show guard); slideUp/fadeIn keyframes added (were missing)
- Verified: 31/31 pytest (backend tests incl. new lead/site-visit persistence tests), yarn build clean, browser checks (popup above map + centered, register redirect, mobile list hidden, WA hrefs, dashboard CTA)

## Implemented (2026-08-13, iteration 11 — gallery/loan/nearby/menu batch)
- Gallery root cause: image chain (upload→storage→DB→API→serve) verified working on public URL; broken only in dev (no proxy) — added "proxy": "http://localhost:8001" to package.json so relative /api/files images render in dev too; existing uploaded images unaffected
- Main image alignment: gallery slides now absolute-fill w/h with object-cover object-center (no empty right area, no stretch)
- Fetch Project Details upgraded: possession (month-year/ready), construction_status, parking hint, content <img> scraping (up to 8, skips logos/icons); fetch-details + import both return/save them; form prefills possession_date/construction_status
- Floating WhatsApp: single fixed bottom-right green button → wa.me/918828830707 (z-60, all pages); ChatWidget removed entirely from App.js
- Mobile menu: scrollable Sheet (flex-1 overflow-y-auto overscroll-contain), collapsible Properties submenu with rotating caret (mobile-nav-properties-toggle), closes on destination select; desktop nav untouched
- Unit Plan: PropertyForm "Unit Plan URL" text input → real upload (ImageUpload kind=properties, no URL); existing data preserved
- Multiple gallery upload: MultiImageUpload.jsx (multi-select, previews, per-image remove, ordered upload-all with 403 fallback to /uploads) wired into PropertyForm gallery; existing images grid with remove buttons
- Description colour: RichTextEditor gained controlled colour palette (7 brand-safe colours) via foreColor + DOMParser sanitizer (strips scripts/styles/classes except inline color) on exec+blur; public .rich-content CSS forces Poppins/sizes/spacing with !important (colour allowed)
- Fetch Nearby Locations: POST /api/nearby/fetch (auth) — Nominatim geocode (hyphen-safe) + Overpass with kumi.systems mirror fallback; categories Schools/Hospitals/Metro/Railway/Buses/Market & Mall, haversine distances, nearest-5 per category; buttons in PropertyForm + ProjectForm merge without overwriting manual entries; clear errors + manual fallback
- Apply Loan: PropertyDetail + ProjectDetail "Apply Loan" buttons link /home-loan?property_id|project_id&property_name&property_cost (project uses price_from); HomeLoan reads params → linked-listing banner, Property Finalised=yes, cost prefilled; FIXED latent bug: submit now actually sends property_cost/loan_amount/property_finalised/property_id/project_id; leads identifiable by source=home_loan + linked listing
- Properties/Projects list layout: mobile falls back to grid (list hidden md-only)
- Verified: 31/31 pytest, yarn build clean, browser checks (gallery loads via proxy, Apply Loan prefill ₹4.34 Cr, floating WA, fetch-nearby real OSM data, mobile menu submenu+close, unit plan upload UI)

## Fix (2026-08-13 — Invalid Host header on preview)
- After adding the dev proxy + restarting the frontend, webpack-dev-server rejected the preview domain's Host header ("Invalid Host header" page). Root fix: `allowedHosts: "all"` in craco.config.js devServer config. Verified: public preview URL returns 200 and homepage renders.

## Implemented (2026-08-13, iteration 12 — email readiness, WA context, header)
- Email go-live prep: SMTP_* placeholders + LEAD_RECIPIENT_EMAIL=contact@carpetadda.com added to backend/.env (no secrets in code); pipeline verified: every form (contact/requirement/property/project/home-loan/site-visit) + verification + password reset route through send_lead_notification/send_account_email → SMTP first, Emergent-key fallback, clean skip-with-log when unconfigured; agent/developer copies only for active listings, blocked accounts excluded
- WhatsApp context: new src/lib/whatsapp.js (WA_NUMBER 918828830707, waLink/waPropertyMsg/waProjectMsg/waAgentMsg with name/ID/location/config/price, URL-encoded); applied to property cards, project cards (new button, both layouts), property/project detail buttons, agents list/detail, home directory
- Header: List Property hidden for logged-in users (desktop + mobile menu); visible logged-out (register flow); dashboard List Property retained
- Verified in browser: logged-out shows button, logged-in hides it; encoded contextual WA hrefs on cards; lead POST 200 with clean email-skip log

## Implemented (2026-08-13, iteration 13 — REAL email delivery)
- ROOT CAUSE of "emails not arriving": no email provider configured (SMTP empty, no Emergent key). Fixed by wiring Emergent managed email proxy (EMERGENT_EMAIL_KEY set in backend/.env) as default; business SMTP (SMTP_HOST/USER/PASSWORD/FROM/SECURE) takes priority when filled for Hostinger
- email_service.py rewritten as ONE service: _deliver (SMTP→proxy priority), mandatory safety gate (G2/G3) with _absolutize (app-relative→https FRONTEND_URL) so templates pass; Reply-To = client email; professional enquiry subjects per type; full email content (name/mobile/email/type/listing name+ID/location/price/agent-dev/budget/visit/profession/cost/loan/lead ID/timestamp/source)
- Agent/Developer copies now sent as SEPARATE send after primary — a bad/unverifiable CC address can NEVER block the primary business email (was the latent "property enquiry failed" bug: fake demo agent emails made the proxy 422 the whole payload)
- email_log collection records every attempt (kind, to, status, real error, provider, at); leads/site_visits get email_status sent/failed + email_error write-back via _notify_lead background wrapper; SMTP failure never deletes/affects the saved enquiry
- Admin → Settings → "Email Delivery Status": CONNECTED/MANAGED/NOT CONFIGURED badge, provider detail, missing-var guidance, last email (status/type/time/error), admin-only Send Test Email (POST /admin/email/test) with real result; GET /admin/email/status; GET /admin/email/test never exposed to public
- FRONTEND_URL/SITE_URL set in .env (verification/reset links https — were http://localhost which the safety gate correctly rejected); .env.example updated with SMTP_SECURE
- Verified REAL delivery: test email, contact, requirement, property enquiry, home loan, site visit, verification = SENT (proxy accepted); password-reset to demo user@estatehub.in = FAILED with real reason (undeliverable fake demo domain — expected; real user emails deliver, proven by verification send); CC to fake demo agent/developer emails fail separately without touching primary
- 31/31 pytest, build clean

## Implemented (2026-08-14, iteration 14 — email logs, hero projects)
- Real email flow: Emergent managed proxy live; client auto-reply on enquiry; every attempt recorded in email_log collection; leads/site_visits carry email_status
- Admin → Email Logs page (AdminEmailLogs.jsx): full delivery history with status/errors + Resend button (POST /admin/email-logs/{id}/resend)
- Hero Projects: `show_on_homepage` flag on projects (admin ProjectForm toggle); GET /homepage returns hero_projects; Home hero = auto-rotating carousel (5s) of hero project images, slide click-through to project detail, dots navigation; search bar pulled to hero boundary

## Fix (2026-08-14 — mobile hero overlap)
- Root cause: search bar -mt-12 straddle band (48px) collided with absolutely-positioned hero chip/dots at bottom-8 at every width < ~1794px (worst on mobile where search bar is full-width); chip & dots also collided with each other at 320px; footer email caused horizontal page overflow at 768px; ProjectCard nested <a> in <Link> caused hydration console error
- Fix: search bar in normal flow (mt-6 mb-8) below xl, straddle (-mt-12) preserved at xl+ (desktop design untouched, verified 48px); chip bottom-8 xl:bottom-16 + max-w truncate; dots own line bottom-3 on mobile, xl:bottom-16 aligned with chip; footer email break-all; ProjectCard WA inner anchor -> button (stopPropagation + window.open)
- Verified geometrically + functionally at 320/360/375/390/414/430/768/1024/1280/1440/1920: zero overlaps, zero h-overflow, zero console errors, dot nav PASS, chip click-through PASS, search PASS, dark mode PASS

## Pending
- P0: Full QA pass of Admin Email Logs page + client auto-reply delivery (testing agent)
- P0: User decision: real emails for demo agent/developer accounts (a) all -> contact@carpetadda.com, (b) user provides real addresses, (c) leave fake seed data

## Implemented (2026-08-14, iteration 15 — hero background rotation + slide captions)
- Admin → Settings → "Hero Settings": Hero Background Images manager — multi-upload (kind="hero" added to ALLOWED_UPLOAD_KINDS), preview thumbnails, enable/disable toggle, up/down reorder, delete; saved via existing PUT /admin/settings into settings singleton (`hero_backgrounds: [{url, enabled}]`, SiteSettings model extended)
- Homepage hero: rotating background layer (7s crossfade, first image eager, rest lazy) behind the existing Hero Project carousel — fully independent layers; only enabled images render; all-disabled/absent → existing static hero_image/hero-dark fallback (no broken images)
- Hero slide chip upgraded to 3-line premium card: project name + arrow, prettified location (slug→"Andheri West, Mumbai", dedupes locality⊃city), real price (₹ range "₹90 L – ₹2.22 Cr" or "₹X onwards"; hidden when no price) — all from DB, no hardcoding
- Hero bottom padding bumped (pb-36 / lg:pb-44) so the taller chip never touches hero text; chip stays bottom-8 xl:bottom-16 above the search straddle band; mobile alignment from iteration-14 fix preserved
- Verified: admin toggle/reorder UI, API save/public read, rotation opacity advance, fallback state, chip click-through → correct project page, geometry 320–1920 (zero overlap/overflow/errors), dark mode, 31/31 pytest, yarn build clean (Hostinger-safe)
- Demo note: two generated dusk-skyline test images currently active as hero backgrounds — replace anytime via Admin → Settings → Hero Settings

## Fix (2026-08-14 — hero chip invisible text in dark mode)
- Root cause: dark-mode CSS forces .text-slate-900→white, but chip bg used bg-white/90 which had no dark override → white text on white chip. Fixed at root in index.css: .dark .bg-white\/90 → rgba(28,56,51,0.92) and .bg-white\/95 → 0.95 (also fixes gallery carousel arrow buttons in dark mode). Verified: chip bg rgb(28,56,51), name #FFF, readable in dark; light mode unchanged.

## Fix (2026-08-14 — List Property redirect flow)
- /post-property now redirects logged-out visitors to /register?next=/post-property (intended destination preserved; was plain /register). Register/Login already honor next → after authentication user returns straight to the Property Listing form.
- Header List Property now visible for logged-in users too (desktop + mobile) — logged-in click opens the form directly, logged-out click starts the register flow. Guards intact: /post-property + /dashboard/list-property both redirect unauthenticated visitors.
- Verified all 3 cases in browser: A) new visitor → register → authenticated → form (account really created); B) existing user via Sign-in link (next carried over) → form; C) logged-in → form directly. Full submit e2e: property saved as pending_review owned by the new account. No loops/404/blank/auth errors. QA artifacts cleaned from DB.

## Implemented (2026-08-14, iteration 16 — All Images galleries + welcome email)
- New reusable AllImagesGallery.jsx: aggregates existing listing image fields (deduped by URL, labeled) into responsive grid (2/3/4 cols, aspect-[4/3], object-cover, lazy) + lightbox (dark overlay, counter "Image N of M · label", Prev/Next pills, close X, Esc/Arrow keys, touch swipe >40px, body scroll lock, image contained in viewport)
- ProjectDetail: All Images section directly below Map — main_image, images[], floor_plans[].image, units[].unit_plan, rera_qr_url
- PropertyDetail: All Images section directly below Map — main_image, images[], floor_plan, unit_plan
- No master_plan field exists in the schema (verified) — closest stored plans (floor/unit/RERA) included; nothing fabricated
- Welcome email: register() now fires background _send_welcome_email (FastAPI BackgroundTasks — never blocks/fails registration): branded HTML, user name, account-ready confirmation, Explore Properties/New Launch CTA buttons + dashboard link (absolute https URLs pass the safety gate), kind="welcome" recorded in email_log. Verified: register succeeds + welcome attempt logged (fake test domain correctly refused by proxy; real addresses deliver)
- Root fix: html/body overflow-x:clip (off-canvas embla slides caused 2–7px horizontal scroll at 320px on detail pages; `clip` preserves the sticky header — verified)
- Verified: lightbox open/next/prev/keyboard/close/fits on both pages, section order (below Map, above Unit Plans), zero broken images, zero console errors, 320–430/768/1920 widths, 31/31 pytest, yarn build clean

## Audit + Fix (2026-08-14 — "rollback social posting / email log reliability" request)
- FINDING: No Automatic Social Media Posting feature exists in this codebase — verified full git history + codebase-wide search (no FB/X/LinkedIn posting, queues, workers, OAuth, polling, cron). Nothing to roll back; current state already IS the stable state. Only social references are footer/settings social LINK fields (legitimate, kept).
- PERFORMANCE AUDIT: Home/Property/Project/Admin on desktop+mobile load in 1.3–1.9s with 8–10 API calls at load and ZERO background requests during 8–10s idle; zero console errors. Only timers: hero rotation (5s/7s, lightweight). Backend has no daemons — only per-request FastAPI BackgroundTasks. No bottleneck found.
- EMAIL LOGS: verified reliable → KEPT per user's condition (33 entries logging correctly across kinds, admin-only 401 guard, UI + Resend working). Fixed one real reliability bug: failed resends returned HTTP 502 which the preview CDN replaced with a generic Cloudflare HTML error page (hid the reason) — endpoint now returns JSON 200 {ok:false,message}; frontend shows the real reason; error column renders human-readable text (raw JSON envelope stripped); squashed To column fixed (min-w). 
- Email delivery untouched (test email still sends); DB untouched; 31/31 pytest; yarn build clean.

## Change (2026-08-14 — List Property lands on Login first)
- /post-property logged-out redirect changed from /register to /login?next=/post-property (user request). Login returns to the listing form; the "Create account" link on the login page carries next so new users still reach the form after registering. Verified in browser: click→/login?next=..., login→form visible, register link carries next.

## Implemented (2026-08-14, iteration 17 — homepage & mobile dashboard UI batch)
- Hero search tabs: ONLY the active tab is #708DE6 + white text; inactive tabs are white/slate with blue hover (per new instruction, superseding the all-blue tabs). Projects tab Residential/Commercial behaviour untouched.
- Browse by Categories: exactly 6 cards — Residential / Commercial / Buy / Rent / Projects / Home Loan (→ /home-loan), all counts real from new browse_counts in GET /homepage (5 count queries); Home Loan shows "EMI & eligibility" (no fake count)
- Browse by City: top 6 ranked by real listing counts (5 cities exist in DB); Landmark Developers limited to top 6 with initials-avatar fallback for missing/broken logos
- Testimonials removed from homepage; NEW public /testimonials page (existing GET /testimonials) + Footer link; admin + DB untouched
- Mobile menu scrolling: verified with real CDP touch input — sheet scrolls naturally, all items reachable at 320–430px and short viewports; no change needed
- Dashboards (Admin/User/Agent/Developer): new shared DashNav.jsx — mobile sidebar collapsed by default, floating arrow pill at RIGHT screen-middle ("MENU"/"Close"), slide-in drawer from right with backdrop + X, auto-closes on tab select, desktop sidebar unchanged (lg+ static, toggle hidden)
- Fixed corrupted stray lines at end of server.py (duplicate _shutdown fragment) that crashed backend reload
- Verified: all 4 dashboards open/close/select at 390px with zero h-overflow + zero console errors; desktop admin sidebar inline; categories/cities/developers counts; home-loan card navigation; testimonials page 4 cards; 31/31 pytest; yarn build clean

## Audit (2026-08-14 — complete error audit)
- Full audit executed: production build, backend startup, 25 public pages × desktop+mobile sweeps (console+network+overflow), all 4 role dashboards, all admin tabs, auth positive/negative flows, upload→serve chain, archive/restore, PUT /site-visits/{id}, email test send, logout, idle-polling watch
- FIX: nested <form> (AdminPasswordChange inside AdminSettings form) → React hydration error on admin Settings; converted to div + onClick
- FIX (earlier same day): server.py trailing corrupted _shutdown fragment removed; email resend 502→JSON 200
- PostHog "t is not a function" in preview = Emergent platform's own injected recorder script (assets.emergent.sh in public/index.html), NOT app code; no app error triggered
- Results: build PASS (warnings only — known React Hook dependency hints, non-breaking), backend PASS, all API routes PASS, uploads PASS, email PASS, zero app console errors, zero failed requests, zero idle polling, no hardcoded localhost/preview URLs in app code

## Change (2026-08-14 — BHK off commercial + Signature Projects label)
- Projects page: BHK filter hidden when category=commercial; a Commercial Sub-Category select (Shop/Office Space/Showroom) takes its place via new additive `config` param on GET /projects (matches configurations prefix, case-insensitive); bhk stripped from API call when commercial. Properties page already had the correct swap (verified). SearchBar/NewLaunch have no BHK (verified).
- "Commercial Projects" display text → "Signature Projects" on homepage section, header nav, footer link (URLs + DB category + filtering unchanged). Note: 0 commercial projects exist in seed data — commercial project pages legitimately show empty.
- Verified in browser: both categories on /projects + /properties, sub-category select filters, footer link navigation, no console errors, 31/31 pytest, build clean.

## Implemented (2026-08-14, iteration 18 — RTMI, RERA, gallery zoom, YouTube)
- RTMI: /rtmi page (projects with construction_status="ready") + RTMI in header nav (desktop+mobile) + homepage "RTMI Projects" section (max 6, hidden when empty, "View All RTMI Projects" link); GET /projects accepts construction_status; /homepage returns rtmi_projects. Demo: skyline-marina + aksh-boulevard marked ready (admin-editable via existing Construction Status select)
- Similar Properties/Projects: Grid↔List toggle on both detail pages (no reload, list rows link to correct detail)
- RERA: Project.rera_entries[] (number/description/url/qr_url/certificate_url) with legacy-field back-compat (first entry synced to rera_number/rera_link/rera_qr_url on save; detail falls back to legacy fields); Admin RERA tab = multi-entry editor (add/remove/reorder/QR+certificate upload via existing storage); detail page "RERA Details" renders one professional block per entry (mono number, description, QR→official link, certificate + official links); empty → section hidden
- Master Plan: dedicated Project.master_plan field + admin upload (Media tab); appears as labeled "Master Plan" entry in All Images (deduped by URL)
- Lightbox zoom: click/double-tap toggle, wheel, +/- buttons, drag pan (clamped), pinch (2-pointer), swipe disabled while zoomed, zoom resets on nav/close, zoomed image clipped so it never covers controls, body scroll restored on close
- YouTube: youtube_url on Project + Property (admin forms, media sections), ytEmbedId parser (watch/youtu.be/embed/shorts) in lib/utils.js, responsive aspect-video nocookie embed section on both detail pages — fully hidden when absent
- Cleanup: leftover TEST_QA property set back to pending_review (was wrongly active); demo youtube on lodha-premier
- Verified: all flows above in browser (desktop+mobile), admin RERA editor add/remove/reorder/load, zero console errors, no h-overflow, 31/31 pytest, yarn build clean

## Fix (2026-08-16 — invisible dashboard CTA text in dark mode)
- Root cause: dark-mode CSS turns .text-slate-900/600 white, but the CTA card gradient (bg-gradient-to-r from-blue-50 to-white) uses Tailwind gradient CSS variables that had no dark override → white text on near-white gradient in dark mode (DashboardPages.jsx dash-list-property-cta; same latent bug on RoleDashboards.jsx dev-listing-banner)
- Fix (global, index.css): .dark .from-blue-50 → translucent brand-blue gradient stop; .dark .to-white → #1C3833 — covers both affected cards and any future use of the pattern; light mode untouched
- Accessibility: dashboard primary CTA buttons moved from bg-blue-600 (#708DE6, 3.16:1) → bg-blue-800 (#4A5FA8, ~6:1, WCAG AA pass), hover bg-blue-900 — DashboardPages (2 buttons) + RoleDashboards (dev banner + shared RoleShell primary action)
- Deployment package refreshed: rebuilt with REACT_APP_BACKEND_URL="" (same-origin /api for Hostinger; api.js supports empty URL); production-hostinger-ready.zip regenerated — verified 0 preview-domain refs in packaged JS, dark gradient rules present in packaged CSS, no .env/node_modules/caches included
- Verified: testing agent iteration_8.json (dark/light card contrast PASS on user + developer dashboards, tab switching, sidebar, empty states, homepage sanity) + iteration_9.json (button color computed styles PASS); self-verified final blue-800 computed rgb(74,95,168) + final zip integrity

## Backlog (updated 2026-08-16)
- P1: React Hook dependency warnings in build (non-breaking)
- P1: ProjectForm data-testids on key fields/tabs/developer select/publish controls
- P2: SMTP creds for live email on Hostinger (backend/.env per .env.example; preview uses Emergent managed email)
- P2: hero image rotation via settings CMS (done — Hero Settings); AI Search restyle
- P2: consider site-wide primary button (btn-primary #708DE6) contrast alignment with the new darker dashboard CTAs

## Implemented (2026-08-17 — dedicated New Launch Projects page)
- New route `/new-launch` renders the existing Projects listing with a locked filter: `Projects` accepts optional `fixedStatus` prop which forces `construction_status=new_launch` on the existing GET /projects API (no new API, no duplicate data; `new_launch` boolean flag is unused in seed data — construction_status is the real marker, same pattern as /rtmi)
- Header "New Launch" menu (desktop NavLink + mobile drawer link) now opens `/new-launch` directly; `/projects` remains the generic all-projects listing (Residential/Commercial dropdown links unaffected)
- All existing filters (keyword, BHK/commercial sub-category, location, price slider), sort, grid/list toggle and project-detail links work on top of the locked filter; heading already read "New Launch Projects"
- Verified: header click → /new-launch with 5 new-launch-only projects; keyword search narrows to 1; detail link → /project/hariyali-elysium; mobile 390px responsive with zero h-overflow; /projects still shows all 9; console/network clean (only platform Cloudflare RUM beacons aborted, not app code)

## Verified (2026-08-17 — List Property auth gate, no code change needed)
- Confirmed the requested flow already exists and works end-to-end: header "List Property" → /post-property → logged-out visitors redirect to /login?next=/post-property → Sign In → returns to the listing form; "Create account" link carries ?next → Register → returns to the form; logged-in users go straight to the form. Verified all 5 paths in browser, zero errors.

## Implemented (2026-08-17, iteration 11 — units/gallery/uploads/forms batch)
- Project Units: public accordion shows Configuration/Carpet/Built-up/Balcony/status badge + "Request Price" WhatsApp (waUnitMsg: unit details + absolute unit-plan URL → configured business number); AdminUnits form trimmed to BHK/Config, Unit no, Carpet, Built-up (new field), Balcony, Status, Unit Plan, Description, Notes (internal), Availability(published)
- Project Detail: Live Availability removed from public UI (API kept); "All Images" → "Image Gallery" showing ONLY gallery images (main image URL filtered out — fixes iteration-11 HIGH); hero slider = single main image + "View Gallery" scroll button; developer profile block removed (also fixed latent stray `)}` text + null-developer crash); developers pages/API untouched
- Uploads: ImageUpload broken-image fallback (visible "Preview unavailable" instead of white card), Replace testid; PropertyForm gallery switched to per-image ImageUpload (Preview/Replace/Delete per image)
- Multi-step forms: Save & Next per section with section validation toasts (property basic=title, location=city+locality; project basic=name+developer, location=city+locality); final section shows Save in Draft + Save & Publish; publish validation (name/title, price-or-rent/developer, city+location, main image) jumps to failing section; drafts allow incomplete data
- Admin: Developers management tab (name-only create via existing POST /admin/developers); Properties menu hang investigated — no hang reproduced on preview (48 listings load, dropdown survives rapid toggles)
- Drafts security fixes (iteration_10 criticals): non-admin PUT status=active → forced pending_review + verified/featured re-stamped from DB; developer/agent public profiles filter nested listings to active; /projects/featured requires active; DraftsPanel onChanged refreshes dashboard listings
- Verified: backend pytest 8/8 (test_iteration11.py) + browser spot checks

## Implemented (2026-08-19 — assignment & approval workflow)
- Super admin "Assign User" (UserPlus icon) on Admin Properties/Projects rows → AssignUserDialog (select existing user or Unassigned) → PUT /admin/{kind}/{id}/assign (admin-only, validates user)
- Edits by non-admins (owner/agent/assigned) to a LIVE listing are staged as pending_changes + pending_approval (live doc untouched; status/flags/ownership stripped from staged payload); non-live listings save directly as before
- Admin → Approvals tab (AdminApprovals): listing, type, assigned user, field-level change summary (old → new), Approve (applies changes, keeps status active) / Reject (clears pending, live unchanged, user can resubmit)
- User/Agent/Developer dashboards: "Assigned to Me" tab (AssignedPanel) — assigned listings with status + "Pending Approval" badge + edit links; new route /dashboard/edit-project/:id/edit (ProjectForm allows role user, role-aware backTo); MyListings shows "Edits Pending Approval" badge
- Backend-enforced: /my/assigned, /my/properties|projects/{id} and PUT guards include assigned_to; cross-user edits 403; admin-only assign/approve/reject/pending-changes
- Verified full curl flow: assign → user sees → edit staged → live unchanged → admin approves → live updated (status active) → second edit → reject → live unchanged → 403s for cross-user/admin-endpoint attempts; seed restored

## Implemented (2026-08-19 — Agent workspace)
- /agent rebuilt into full workspace: Overview (7 stat cards: Total/New Leads, Follow-ups Due, Site Visits, Upcoming Visits, Assigned Listings, Pending Approvals + derived Recent Activity feed), Leads (status filter chips, call/WhatsApp per lead, next-follow-up date picker, notes with add-note), Follow-ups (Overdue-Due-Today ≤ today / Upcoming > today), Site Visits (Upcoming/Completed/Cancelled, notes on blur, status select, WhatsApp follow-up), Assigned (existing AssignedPanel), plus existing Listings/Drafts/Clients/Profile
- SECURITY: GET/PUT /leads and /site-visits are agent-scoped (agent sees only own/agent-linked/assigned property leads + visits; 403 on out-of-scope updates; plain users 403)
- Lead model +next_follow_up; User model +whatsapp; PUT /auth/profile accepts whatsapp; AccountPanel WhatsApp Number field
- Fix pass 2 (reported "Agent Overview issue"): WhatsApp contact actions now target the CLIENT's phone (new waTo helper; previously opened the business number); follow-ups today counted as due/overdue; missing testids added; seeded demo data for agent account (2 assigned properties, 3 leads, 1 visit) since the account had zero data (root cause of the "empty overview")
- Verified: overview shows real counts (3/1/2/2/1/2/0), lead WhatsApp href targets client number, follow-up sections split correctly, visits/assigned rows render, mobile no overflow, console clean

## Fix (2026-08-19 — role-based dashboard routing)
- User reported agent (production, carpetadda.com/dashboard) landing on the plain user dashboard instead of the Agent workspace
- Root cause: /dashboard always rendered UserDashboard regardless of role
- Fix (DashboardPages.jsx, 3 lines): /dashboard now redirects — agent → /agent, developer → /developer, admin/super_admin → /admin; regular users stay on /dashboard
- Verified: agent opening /dashboard lands on Agent Workspace; regular user still gets the user dashboard. NOTE: requires REDEPLOY for production; also ensure the production user's role is "agent" (Admin → Users)

## Implemented (2026-08-19 — category-aware amenities)
- Amenities split into Residential / Commercial using the EXISTING amenities system (GET /amenities gained optional ?category= filter; Amenity model already had category field)
- Data: 26 existing amenities recategorized to residential (they were all residential-flavored); 15 commercial amenities added (24x7 Access, High-Speed Elevators, Central AC, Conference Room, Reception/Lobby, Loading Bay, Signage, Pantry, Fiber Internet, Access Control, etc.)
- PropertyForm + ProjectForm: amenity list refetches on property_category change (instant switch); quick-add + AddAmenity now tag new amenities with the current category; fallback lists split residential/commercial
- Save/restore unchanged (amenities stored as name array in the existing field); verified E2E: residential hides commercial options, commercial switch is instant, selected commercial amenity saved to draft and restored on edit; QA draft cleaned up

## Fix (2026-08-19 — PERMANENT image disappearing fix, root cause)
- Root cause (proven): uploads were stored ONLY on the container's ephemeral local disk. Every redeploy/restart/fork wipes it while MongoDB keeps the /api/files/... paths → DB pointed at files that no longer existed (Lodha Signet's 6 images 404'd on production; same class of loss on preview forks)
- Fix: backend/storage.py now writes to Emergent object storage (INTEGRATION_PROXY_URL + EMERGENT_LLM_KEY, added to backend/.env) with the local uploads dir as a write-through cache. Same interface (init_storage/put_object/get_object), same path scheme (carpetadda/...), same /api/files URLs, same DB records — zero changes needed anywhere else; no-key environments (Hostinger VPS) fall back to local-only (durable there)
- Migrated all 32 existing preview files to durable storage (0 failures)
- Durability proven: upload → 200 → deleted local cache file (simulated container wipe) → still 200 from remote → cache auto-repopulated
- .gitignore: removed .env blocks so EMERGENT_LLM_KEY deploys to production; deployment_agent re-check PASS
- HONEST CAVEAT: production images lost BEFORE this fix (Lodha Signet main+5 gallery, homepage hero, etc.) are unrecoverable — the bytes were wiped with the old container. After redeploy, re-upload those once via admin; everything uploaded afterwards persists permanently
- ACTION REQUIRED: redeploy to production, then re-upload the previously-lost images once

## Fix (2026-08-23 — duplicate drafts + approval verification)
- ROOT CAUSE of duplicate draft listings: PropertyForm/ProjectForm `save()` always POSTed for new listings — every "Save & Next" created a NEW record. Fix: first save captures the created id (createdId state); every subsequent save (Save & Next, Save Draft, exit autosave) PUTs that same record. Added double-submit guard (if saving return) and exit-autosave now uses the effective id (PUT) and re-arms after intermediate saves
- Verified: agent created one rent listing clicking Save & Next ×3 + Save in Draft → exactly ONE draft; continuing the draft updates the same record (draft count stays 1); data + images restore on edit
- Images: full chain re-verified on the durable storage fix (upload ×2 → save → fresh GET persists → both URLs 200; survives local wipe)
- Approval workflow verified correct on current code: admin create/publish → active directly (never queued); agent → pending_review; developer → pending_review. If an "admin" listing was queued on production, that account's role is not admin/super_admin, or production predates these fixes — redeploy + check role in Admin → Users
- All QA test data cleaned up

## Implemented (2026-08-23 — 12-point production batch)
1. ProjectDetail stat "Total Units" → "Land Area" (existing land_size field)
2. Project.total_floors int → str (multi-tower text, e.g. "Tower A: 20, Tower B: 30"); form input now text; existing int data passes through raw reads untouched
3. RERA certificate upload accepts PDF: ImageUpload gained `accept` passthrough (accept="image/*,application/pdf") + PDF preview chip; backend already allowed PDF for admin uploads
4. NEW LAUNCH root cause: projects are marked via flags array ("new_launch" in flags), page filtered only construction_status → backend list_projects now matches BOTH (construction_status=new_launch OR flags contains new_launch)
5. RTMI: added "rtmi" to PROJECT_FLAGS; RTMI page filter matches construction_status=ready OR flags contains rtmi; property RTMI flag added to MARKETING_FLAGS (uses existing flags array, no model change)
6. Hero blur = white overlay gradients (from-white/90 + bottom fade) — softened to from-white/70 via-white/20, bottom fade removed; headline still readable
7. Project hero H1 + description: Project model +hero_title/hero_description; ProjectForm media fields (80/300 char limits); ProjectDetail displays over main image (white text on existing dark gradient = auto-readable, moves with the image)
8. Website hero CMS already existed (hero_image + hero_headline + hero_subtitle + multiple rotating hero_backgrounds in Admin → Settings → Hero) — verified present, no duplication needed
9. Property listing: images fixed via durable storage; amenity chips now render selected-but-other-category amenities (nothing hidden/"deleted" on category switch); admin publish verified → active directly, agent/developer → pending_review
10. Admin → Users edit dialog now edits name/phone/whatsapp (PUT /admin/users already accepted them) + existing password reset
11. Properties hang root cause: Properties.jsx fetch had NO .catch — any API failure left the page on "Loading…" forever; added catch + request cancellation + removed stray `layout` dep from effect
12. Verified: /new-launch 7 projects (incl. flag-marked), /rtmi includes rtmi-flagged, Land Area stat + existing int floors render, hero sharp, project form hero fields/floors text, users edit dialog fields, syntax checks all green; test flag changes reverted

## Confirmed (2026-08-23 — File & Media Storage integration, official)
- User asked to "add the File & media storage integration" — already implemented per the official playbook; audited against it point-by-point: EMERGENT_LLM_KEY + INTEGRATION_PROXY_URL env pattern ✓, session storage_key with force re-mint on 404 ✓, app-name-prefixed paths (carpetadda/...) ✓, DB file records with is_deleted soft-delete ✓, startup init ✓, /api/files served through backend ✓, 8MB + content-type validation ✓, .env deploys to production (.gitignore fixed) ✓
- Fresh round-trip verified: upload → read → wipe local cache → read from remote — all pass
- Going-live checklist: only step left is REDEPLOY so EMERGENT_LLM_KEY + code reach production

## Implemented (2026-08-23 — dedicated Commercial Properties page)
- New route /commercial-properties reusing the Properties listing with a locked filter (Properties accepts fixedCategory prop → qp.set("category","commercial"); heading "Commercial Properties"; Category select hidden, BHK hidden, commercial sub-category filter shown)
- Header "Properties" dropdown gained "Commercial Properties" item (desktop + mobile via shared PROPERTY_MENU)
- ROOT-CAUSE fix (affects the screenshot's "Property not found"): get_property/get_project matched slug WITHOUT status in the query — an inactive duplicate draft with the same slug (from the old duplicate-draft bug) could be returned first and 404 the live listing; the status=active filter is now INSIDE the find_one query
- Verified: menu → page opens with 18 commercial-only listings (0 residential leak via API), sub-category/sort/pagination/detail links/images all work, mobile clean, no console errors. Backend param is `category` (NOT property_category) — verified via API
- Production note: the "Commercial Properties Not Available" text lives in the old production build; redeploy ships the new page

## Implemented (2026-08-23 — commercial page entry points)
- Homepage "Commercial" browse card now links to /commercial-properties (Home.jsx line 166)
- Footer Explore gained "Commercial Properties" link (footer-link-commercial)
- SEO: saved /commercial-properties meta via the existing admin SEO API; fixed SeoManager STATIC_PAGES whitelist (the page was missing so saved meta never applied) — title/description now render
- Verified: card → page, footer → page, title "Commercial Properties in Thane — Shops, Offices & Showrooms | CarpetAdda" + description applied

## Implemented (2026-08-24 — SEO follow-up + deploy prep)
- /new-launch + /rtmi added to SeoManager STATIC_PAGES whitelist; meta title/description saved for both via the existing SEO API
- Commercial OG image set via existing SEO editor API using an existing durable uploaded image (og:image meta verified in DOM)
- Sitemap: existing /api/sitemap JSON endpoint extended with "pages": ["/commercial-properties", "/new-launch", "/rtmi"] (no XML renderer consumes it yet — noted)
- Deployment prep: .gitignore had a SECOND .env block (lines 106-108) — removed; deployment_agent re-check PASS; everything ready for redeploy
- Verified: browser tab titles for /new-launch + /rtmi, og:image meta tag, sitemap pages list, image 200

## Implemented (2026-08-24 — lead routing, contact buttons, admin user management)
- FIXED broken server.py (previous fork left truncated admin_update_user + duplicate admin_delete_user — backend would not start)
- Lead routing: create_lead auto-links assigned_to from the listing's assigned user; agent lead scope now also matches lead.assigned_to (list + update guards); admin sees all leads globally — no duplicate records
- Contact buttons: GET /properties/{id} + /projects/{id} return a `contact` (assigned user → agent → developer fallback); PropertyDetail/ProjectDetail Call + WhatsApp buttons now target that contact's phone (waTo/telTo helpers, waPropertyMsg/waProjectMsg accept optional phone; fallback = business 8828830707); "You'll be connected with {name}" label
- Admin delete user (Option A): transfers ALL owned/assigned properties+projects and linked leads to the acting admin (owner_id/assigned_to/agent_id) — listings stay live, images/URLs/approvals intact; self-delete 400, non-admin 403; confirm dialog explains the transfer
- Admin edit user: name/phone/whatsapp/role/verified/active + NEW optional direct password set (PUT /admin/users accepts password ≥8 → hashed); email reset-link flow retained
- Verified by curl E2E: assign → public contact=agent → lead routed → agent sees it → admin edit+password login → delete → listing live + transferred + lead reassigned; QA data cleaned

## Implemented (2026-08-24 — Admin Amenities management)
- Admin → Amenities tab (AdminAmenities.jsx): Residential + Commercial sections, Add/Edit/Delete per amenity, reuses existing amenities model/API and form integration (no duplicate system)
- Backend: PUT /admin/amenities/{id} (rename, per-category dedupe guard) + DELETE /admin/amenities/{id} (SOFT delete active=False — existing property records untouched); admin/super_admin only (agent 403 verified)
- GET /amenities?category= already powers Property/Project forms → add/edit/delete reflect instantly in the correct category dropdown
- Verified all 5 required checks: add res (27 total, no commercial leak), add com (16 total), rename, delete disappears from selections, existing properties intact (10 with amenities unchanged); UI smoke PASS (41 rows, both sections)

## Implemented (2026-08-24 — admin user edit: email + avatar)
- Admin → Users edit dialog now includes an editable Email field and a Profile Photo / Logo upload (existing ImageUpload component, kind="avatars" → existing durable object storage, no local-disk writes, no new APIs/models)
- Backend admin_update_user no longer strips email: normalizes (trim/lowercase), rejects invalid emails (400) and emails already used by another account (400, self-update allowed); avatar URL saved via the same update payload
- Verified: email change → login with new email works; duplicate/invalid email 400; non-admin 403; dialog renders photo upload + prefilled email with name/phone/whatsapp/role/password untouched; temp test user cleaned up

## Fix (2026-08-24 — mobile Property Detail layout)
- Root cause: title/address block and price block shared one wrapping flex row above the gallery — on mobile they collided
- Fix (PropertyDetail.jsx, layout-only): header + gallery now one single-source flex container with responsive order utilities — mobile sequence: Title → Main Image → Address (left) | Price (right, share/save below it); long titles/addresses wrap cleanly (break-words, min-w-0), price no-wrap and smaller on mobile, desktop (lg+) visually unchanged (title left, price right, address under title, image below)
- Verified geometrically: 390px PASS (title→image→address|price order, zero h-overflow) + 1920px PASS (desktop unchanged); no API/data/component changes

## Implemented (2026-08-24 — mobile sticky enquiry bar, Property Detail)
- Mobile-only (lg:hidden) fixed bottom bar on Property Detail: Call / WhatsApp / Enquire — reuses existing telTo/waMsg (assigned agent/developer contact when set, business 8828830707 fallback) and the existing enquiry form (Enquire smooth-scrolls to it + focuses the name field; form id="enquiry-form")
- Page root gained pb-20 lg:pb-0 so the bar never covers end-of-page content; FloatingWhatsApp (App.js, route-aware via useLocation) hides on mobile ONLY on /property/* pages to avoid overlap — desktop and all other pages unchanged
- Verified mobile 390px: assigned-agent hrefs tel:/wa.me/919820033311 → after unassign fallback tel:/wa.me/918828830707; Enquire → form visible + name focused; desktop 1920px bar hidden + floating WA intact; zero API/lead-system changes. Seed state restored

## Fix (2026-08-24 — 3 UI fixes: projects H1, project hero tags, filter UX)
1. Projects.jsx H1: /projects?category=residential now shows "Residential Projects" (was wrongly "New Launch Projects" for every non-commercial page); New Launch page (fixedStatus) and Commercial branch untouched
2. ProjectDetail hero: RERA / Verified Property / status tags MOVED to a top overlay of the main image (pointer-events-none, no duplication — bottom badge row removed); main image stays fully visible; Verified tag renders when project.verified (existing field)
3. Filter UX: Projects.jsx top filter card replaced with the existing "Filters" button pattern (FunnelSimple) opening a RIGHT-side Sheet with the same controls/testids (pf-*) — listings visible immediately on mobile+desktop; Properties.jsx mobile Sheet flipped side=left→right to match; filter logic/API untouched. NOTE: /new-launch + /rtmi share Projects.jsx so they inherit the same button+panel pattern
- Verified: H1 text PASS; aksh-boulevard hero tags at top + 440px image PASS; residential/commercial projects listings-first + right sheet + keyword/BHK filtering PASS; residential properties mobile right sheet + Rent filter 32→10 PASS

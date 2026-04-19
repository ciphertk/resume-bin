# resume-bin — Feature Status

> **Open source · Privacy first · All data stays on your machine**
> No accounts. No servers. No telemetry. Everything lives in your browser's IndexedDB.

---

## Phase 0 + 1 — Foundation ✅ SHIPPED

### Project scaffold
- Chrome MV3 extension (Manifest V3, service worker)
- TypeScript strict + Vite + `@crxjs/vite-plugin`
- React 18, Tailwind CSS, Dexie (IndexedDB), Zod schemas, Vitest

### Profile editor (Options page)
- Tabbed profile editor: Personal, Links, Preferences, Summary, Skills, Experience, Education, Files
- First name, last name, email, phone
- Location: address, city, state, country, ZIP
- Headline + professional summary
- Skills (comma-separated input, tag display, remove)
- Links: LinkedIn, GitHub, Portfolio, Website, Twitter
- Preferences: work authorization, notice period, current CTC, expected CTC, willing to relocate
- Dark / light theme toggle

### Autofill engine
- Floating "Fill" pill injected on every page
- Heuristic field discovery (label text, aria-label, placeholder, name/id attributes, nearby text)
- Confidence scoring (0–100%) per matched field
- Interactive preview panel: checkboxes to select/deselect fields before filling
- Field fill: `input`, `textarea`, `select`, `contenteditable`
- React event dispatch so SPA frameworks (React, Vue) pick up the change

### Autofill dictionary — 25 canonical keys
`email`, `phone`, `firstName`, `lastName`, `fullName`, `city`, `state`, `country`, `address`, `zip`, `summary`, `linkedinUrl`, `githubUrl`, `portfolioUrl`, `websiteUrl`, `twitterUrl`, `workAuthorization`, `noticePeriodDays`, `currentCtcAnnual`, `expectedCtcAnnual`, `yearsOfExperience`, `currentCompany`, `currentTitle`, `latestDegree`, `latestInstitution`

### Application tracker
- Manual "Mark Applied" from popup
- Applications list in Options with: company, role, URL, date applied, status
- Status values: applied, interviewing, offer, rejected, withdrawn
- CSV export

### Popup
- Quick-fill button (opens autofill preview on active tab)
- Quick Copy panel — one-click copy of any profile field (25 fields)
- Mark Applied button
- Link to Options

---

## Phase 2 — Coverage ✅ SHIPPED

### Work Experience section
- Add / edit / remove positions
- Fields: company, title, start date, end date, current (checkbox), location, description
- Cards with inline edit form

### Education section
- Add / edit / remove entries
- Fields: institution, degree, field of study, GPA, start year, end year
- Cards with inline edit form

### Files (PDF upload)
- Drag-and-drop or browse for resume PDF
- Drag-and-drop or browse for cover letter PDF
- Stored in IndexedDB (local only)
- Shows filename, size, upload date; remove button

### Expanded autofill dictionary
- 8 → 25 canonical keys (see list above)
- `yearsOfExperience` computed from work experience date ranges

### Site adapters (5 job boards)
- **LinkedIn Easy Apply** — maps Easy Apply form field IDs to canonical keys
- **Naukri** — maps Naukri `name`/`id` attributes
- **Wellfound** (AngelList) — maps Wellfound field names
- **Greenhouse** — label-text matching for consistent DOM structure
- **Lever** — maps Lever `name` attributes (`urls[LinkedIn]`, `org`, etc.)
- All adapters also parse job title + company from page metadata

### Preview panel improvements
- Profile context section: shows 2 most recent work experience entries + latest education
- Adapter-aware field identification (URL-matched per page)

---

## Phase 3 — Apply Detection 🔜 PLANNED

Auto-detect form submissions, capture job metadata, eliminate manual "Mark Applied".

→ See `docs/superpowers/plans/2026-04-19-resume-bin-phase-3.md`

---

## Phase 4 — Variants 📋 BACKLOG

Profile variants (inherit/override fields), match rules by domain, auto-suggest in popup.
Adapters: Workday, Ashby.

## Phase 5 — Saved-answer library 📋 BACKLOG

Passively capture Q&A from application forms. Review queue. Reuse in future applications.

## Phase 6 — AI integration 📋 BACKLOG

Draft answers, tailor to job description, extract job metadata via AI.
Supports OpenAI, Anthropic, Gemini (user supplies own API key — privacy preserved).

## Phase 7 — Cover letter + resume tailoring 📋 BACKLOG

AI-generated cover letter from profile + JD. Resume bullet tailoring. Diff/preview UI.

## Phase 8 — Reminders + dashboard 📋 BACKLOG

`chrome.alarms`-based reminders, snooze, notifications. Overview dashboard with stats.
Import / export all data.

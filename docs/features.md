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

## Phase 3 — Apply Detection ✅ SHIPPED

Auto-detect form submissions, capture job metadata, eliminate manual "Mark Applied".

### Apply detector
- 3-signal detection: form submit, submit-button click, SPA URL change (pushState/popstate)
- Debounced to prevent double-fire; respects ignored-site list
- Fires after any one signal triggers

### Job metadata parser
- Priority chain: site adapter → JSON-LD `JobPosting` → `og:title`/`og:site_name` → `<h1>` fallback
- JD text snapshot: largest matching `<div>`/`<section>` capped at 8000 chars

### "Applied?" confirmation banner
- Fixed bottom-right banner with 12-second countdown
- "Yes, log it" → logs `ApplicationRecord` with `source: 'auto'`
- "Not a job app" → adds hostname to ignore list, never triggers again
- Auto-dismisses on timeout

### Ignore list
- `ignoredApplyPatterns[]` stored in settings (local IndexedDB)
- Manageable in Settings → Ignored sites section

### Auto-tracker enhancements
- `ApplicationRecord` gains `source`, `jdText`, `detectedAt` fields
- Deduplication by normalized URL
- Applications view: `AUTO` badge, All/Manual/Auto-detected filter, expandable JD preview

→ See `docs/superpowers/plans/2026-04-19-resume-bin-phase-3.md`

---

## Phase 4 — Variants ✅ SHIPPED

### Profile variants
- Create / edit / delete profile variants
- Each variant overrides: headline, summary, skills (Phase 4); all fields (future)
- Priority ordering — lowest number activates first
- Managed from Options → Variants tab

### Variant auto-activation
- Match rules: site hostnames, job-title keywords, JD keywords
- Content script resolves active variant after apply detection fires
- `buildMappings` merges variant overrides before field resolution

### New site adapters
- **Workday** — maps `data-automation-id` attributes (used by Amazon, Microsoft, etc.)
- **Ashby** — maps `name` attributes + JSON-LD `JobPosting` metadata

→ See `docs/superpowers/plans/2026-04-19-resume-bin-phase-4.md`

## Phase 5 — Saved-answer library 📋 PLANNED

Passively capture Q&A from application forms. Review queue. Reuse in future applications.

## Phase 6 — AI integration 📋 BACKLOG

Draft answers, tailor to job description, extract job metadata via AI.
Supports OpenAI, Anthropic, Gemini (user supplies own API key — privacy preserved).

## Phase 7 — Cover letter + resume tailoring 📋 BACKLOG

AI-generated cover letter from profile + JD. Resume bullet tailoring. Diff/preview UI.

## Phase 8 — Reminders + dashboard 📋 BACKLOG

`chrome.alarms`-based reminders, snooze, notifications. Overview dashboard with stats.
Import / export all data.

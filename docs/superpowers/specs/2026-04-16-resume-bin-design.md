# resume-bin — Design Spec

**Date:** 2026-04-16
**Status:** Approved for implementation planning
**Audience:** Personal tool (single user, self-installed unpacked). Not for Chrome Web Store distribution.

## 1. Purpose

Applying to jobs across LinkedIn, Naukri, Wellfound, and arbitrary company career portals requires retyping the same information dozens of times. `resume-bin` is a Chrome extension that:

- stores the user's profile data once (including variants by role),
- autofills application forms with one click,
- tracks applied URLs and metadata in a local log,
- optionally assists with free-text answers, cover letters, and resume tailoring through a user-provided AI API key.

The tool is local-only. No backend, no accounts, no sync server. All data lives in the user's browser.

## 2. Constraints and principles

- **Personal use.** No multi-tenant concerns, no auth, no billing, no compliance.
- **Local-first.** Source of truth is IndexedDB. No external services required to run.
- **AI is optional.** Core autofill and tracker must work with zero API key configured. Every AI-touching UI element hides or disables when no provider is set.
- **Modular by feature, layered inside.** Each feature module (`profile`, `autofill`, `tracker`, `answers`, `ai`, `reminders`) owns its data, services, UI, and tests. Only `shared/` is imported across features.
- **Walking skeleton first.** Phase 1 ships a usable extension within a week; every later phase adds one layer while the user dogfoods the previous phases.

## 3. System architecture

### 3.1 Extension surfaces (Chrome Manifest V3)

- **Content script** — injected into every HTTP(S) page. Runs autofill detection, the apply-capture banner, the saved-answer suggest tooltip. Holds no persistent state; sends messages to the background worker.
- **Background service worker** — single source of truth for runtime state. Owns IndexedDB access, AI calls, `chrome.alarms`, and the typed message router. Coordinates across tabs.
- **Popup** (toolbar icon) — compact React UI. Shows whether the active tab is a known site/apply page, offers quick actions (Fill now, Mark applied, Open dashboard), current profile + variant selector, AI status.
- **Options page / dashboard** — full-tab React UI. Profile + variant editor, applied-log table with filters/export, saved-answer library, AI config, reminders, import/export.

### 3.2 Messaging

A thin typed wrapper over `chrome.runtime.sendMessage` using discriminated unions — e.g. `{ type: 'fill-form', payload: {...} }`. All content↔background traffic runs through it so every message is loggable and testable.

### 3.3 Module layout (`src/`)

```
background/        service worker entrypoint, alarm handlers
content/           content script entrypoint, DOM observers
popup/             React popup app
options/           React options / dashboard app
features/
  profile/         Profile + variant data, editor UI
  autofill/        Engine, field dictionary, adapters/
  tracker/         Application record store, capture banner, export
  answers/         Saved-answer library (capture, match, tailor)
  ai/              Provider interface, providers/{openai,anthropic,gemini}
  reminders/       Alarm scheduling, notification surface
shared/
  storage/         Dexie (IndexedDB wrapper) + migrations
  messaging/       Typed message bus
  schema/          Zod schemas shared across modules
  util/            DOM helpers, fuzzy match, logger
```

Each feature module exposes a narrow public API through `index.ts`. Features do not import from other features' internals.

### 3.4 Runtime optionality for AI

The `ai` module is lazy-loaded from the background worker only if `AIConfig` has at least one provider key. Without AI configured, every AI-touching UI element hides or shows a disabled state with "Configure AI in settings" affordance. Core paths never call into `ai`.

### 3.5 Tech stack

TypeScript (strict), Vite + `@crxjs/vite-plugin`, React 18 for popup/options, Tailwind + Radix UI primitives for accessible components, Dexie for IndexedDB, Zod for schemas, Zustand for in-React UI state, Vitest for unit tests, Playwright for E2E against local fixture HTML.

## 4. Data model

All schemas live in `shared/schema/` as Zod schemas — runtime validation on read (corrupt migrations, imported JSON) plus inferred TS types on write. Dexie migrations are versioned; each bumps `schemaVersion` on the kv singleton row.

### 4.1 Profile (base)

```ts
Profile {
  id, name, isDefault
  // personal
  firstName, lastName, email, phone
  location: { city, state, country, zip? }
  // links
  linkedinUrl?, githubUrl?, portfolioUrl?, websiteUrl?, twitterUrl?
  // common form fields
  workAuthorization?, willingToRelocate?, noticePeriodDays?,
  currentCtcAnnual?, expectedCtcAnnual?, desiredStartDate?
  // narrative
  headline, summary
  // collections
  workExperience[], education[], skills[],
  certifications[], languages[], projects[]
  // files & templates
  resumeFileId?, coverLetterFileId?, coverLetterTemplate?
  createdAt, updatedAt
}
```

### 4.2 Variant

```ts
Variant {
  id, baseProfileId, name, priority
  matchRules: {
    jobTitleKeywords?: string[]   // ["frontend","react"]
    sites?: string[]              // ["wellfound.com"]
    jdKeywords?: string[]         // ["react","typescript"]
  }
  overrides: Partial<Profile>     // any subset of Profile fields
  createdAt, updatedAt
}
```

At apply-time, the **effective profile** = `deepMerge(base, bestMatchingVariant.overrides)`.

### 4.3 ApplicationRecord

```ts
ApplicationRecord {
  id, url (normalized, used for dedupe), appliedAt
  companyName, jobTitle, jobLocation?, jobId?
  sourcePlatform    // "linkedin" | "naukri" | "wellfound" | "greenhouse" | ...
  profileId, variantId?
  status: 'applied'|'screening'|'interview'|'offer'|'rejected'|'withdrawn'|'ghosted'
  notes?, followUpAt?
  jdSnapshot?       // raw JD text saved at apply time
  salaryRange?
  createdAt, updatedAt
}
```

URL normalization strips fragments, trailing slashes, and tracking params (`utm_*`, `gclid`, `ref`, `fbclid`). Normalized URL is the dedupe key.

### 4.4 SavedAnswer

```ts
SavedAnswer {
  id, label                         // "Why this company?"
  questionSamples: string[]         // exact texts observed
  answer                            // canonical text
  tags?, useCount, lastUsedAt?
  createdAt, updatedAt
}
```

### 4.5 Reminder

```ts
Reminder {
  id, applicationId?, title, dueAt, notes?,
  status: 'pending'|'done'|'dismissed'
}
```

### 4.6 FileBlob

```ts
FileBlob { id, name, mimeType, size, data: Blob, createdAt }
```
Resume and cover-letter PDFs stored directly in IndexedDB.

### 4.7 Singletons (stored in `kv` table)

```ts
Settings {
  activeProfileId
  applyDetectionMode: 'auto-confirm'|'manual-only'|'off'
  passiveAnswerCapture: boolean
  captureJdSnapshot: boolean
  theme: 'light'|'dark'|'system'
}

AIConfig {
  enabledProviders: ('openai'|'anthropic'|'gemini')[]
  defaultProvider?
  apiKeys: { openai?, anthropic?, gemini? }   // plaintext in chrome.storage.local — see 4.9
  modelByProvider: { openai?, anthropic?, gemini? }
  featuresEnabled: {
    qaAnswering, coverLetter, resumeTailoring,
    metadataExtraction, jdSummary
  }
}
```

### 4.8 Storage layout (Dexie tables)

| Table | Stores | Indexes |
|---|---|---|
| `profiles` | Profile | `id`, `isDefault` |
| `variants` | Variant | `id`, `baseProfileId` |
| `applications` | ApplicationRecord | `id`, `url`, `appliedAt`, `companyName`, `status` |
| `savedAnswers` | SavedAnswer | `id`, `label`, `lastUsedAt` |
| `pendingAnswerCaptures` | captured draft answers awaiting user review | `id`, `createdAt` |
| `reminders` | Reminder | `id`, `dueAt`, `applicationId` |
| `files` | FileBlob | `id` |
| `kv` | `Settings`, `AIConfig`, `variantOverrides`, `ignoredApplyPatterns`, `schemaVersion` | key |

### 4.9 API key storage

API keys are stored in `chrome.storage.local`. Chrome sandboxes extension storage per-extension, so no other site or extension can read them, but they sit on disk in plaintext. Acceptable for a personal tool. The AI settings UI shows a note recommending scoped keys with spend caps. A passphrase-encrypted keystore is a Phase 9 enhancement.

### 4.10 Import / export

Settings tab exposes **Export all** (single JSON with every table; FileBlobs base64-encoded; AI keys redacted; `schemaVersion` stamped) and **Import** with Replace / Merge semantics. Merge resolves by `id`; newer `updatedAt` wins. Round-trip fidelity is a requirement — re-importing an export produces equivalent state.

## 5. Autofill engine

### 5.1 Pipeline

1. **Discover.** On `DOMContentLoaded` and on `MutationObserver` changes (debounced 250 ms), walk the page for fillable nodes: `input` (text/email/tel/url/number/radio/checkbox/file), `textarea`, `select`, `[contenteditable]`. Open shadow roots are traversed; closed shadow roots are skipped (documented limitation).

2. **Extract.** Per candidate, gather signals: associated `<label>`, `aria-label` / `aria-labelledby`, `name`, `id`, `placeholder`, preceding sibling text, ancestor fieldset legend, input type.

3. **Identify (generic engine).** Score each candidate against the **field dictionary**. Each dictionary entry:
   ```ts
   {
     key: 'email',
     synonyms: ['email','e-mail','mail','contact email'],
     regexHints: [/e[- ]?mail/i],
     expectedTypes: ['email','text']
   }
   ```
   Canonical keys cover personal fields (`email`, `phone`, `firstName`, `lastName`, name variations), address parts, profile links, work-auth / CTC / notice period / years-of-experience, repeated collections (`workExperience.{i}.company`, `education.{i}.degree`, etc.), `resumeUpload`, `coverLetterUpload`, and `customQa.{hash}` for recognized free-text questions.
   The highest-scoring key above a confidence threshold wins; below threshold → `unknown`.

4. **Override (site adapter).** If a registered adapter matches the URL, its hooks run *after* generic identification and may fix or add mappings. Adapters live in `features/autofill/adapters/{linkedin,naukri,wellfound,greenhouse,lever,workday,ashby}.ts`. Generic engine is always the fallback for any URL without a matching adapter.

5. **Fill.** Per field type:
   - `input` / `textarea`: set value via **native setter** (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val)`), then dispatch `input` and `change`. This is the only reliable way to make React/Vue controlled components see the change.
   - Native `<select>`: set `value`, dispatch `change`.
   - Custom dropdowns (React-Select, Workday pickers, Ashby combos, …): adapter-only — open via click, find option by visible text, click.
   - `input[type=file]`: build a `DataTransfer`, attach a `File` constructed from the stored `FileBlob`, dispatch `change`.
   - `[contenteditable]`: set `innerHTML`, dispatch `input`.
   - Radios / checkboxes: match option label, click.

### 5.2 Adapter interface

```ts
interface SiteAdapter {
  id: string                                  // 'linkedin'
  matches(url: URL): boolean
  detectApplyPage?(doc: Document): boolean
  parseJob?(doc: Document): Partial<JobMeta>  // company, title, jobId, location
  overrideFieldMap?(
    cands: FieldCandidate[],
    mapping: FieldMapping[]
  ): FieldMapping[]
  performFill?(mapping: FieldMapping[], values: FillValues): Promise<FillResult>
  detectSubmit?(doc: Document, onSubmit: () => void): Unsubscribe
}
```

### 5.3 User interaction

- **Floating pill** injected by the content script when ≥1 fillable field maps to a known key: "Autofill · N fields". Click → preview panel.
- **Preview panel** lists every mapping (canonical key → value) with per-row checkboxes and confidence indicators. User unchecks any row. "Fill selected" commits.
- **Post-fill overlays** briefly outline each field: green (filled), yellow (skipped — no value or low confidence), red (failed). Per-field undo.
- Popup has a "Fill this page" button triggering the same flow.

### 5.4 Saved-answer suggest in forms

For `textarea` or input with `maxlength > 200` whose label looks like a question (contains `?`, or matches known question patterns, or exceeds length threshold), the engine calls `features/answers.match(questionText, jd?)`. Top match above threshold appears inline as a chip: *"Insert saved: 'Why this company?' · 92%"*. Click inserts. If AI is configured and `qaAnswering` is enabled, a second button *"Tailor with AI"* runs the saved answer through the provider with the JD as context; a diff preview follows.

### 5.5 Edge cases

- **Multi-step forms.** MutationObserver re-scans on each step; pill re-appears with new mappings.
- **Hidden / disabled / readonly fields.** Skipped.
- **Ambiguous mapping** (two candidates for the same key). Both marked lower confidence; resolved in preview.
- **Unknown fields.** Listed under a collapsible "Unrecognized — N" section in the preview so the user can drop in values; future dictionary-learning enhancement will take the hint.

### 5.6 Testing

- Vitest unit tests for dictionary matching against labeled HTML fragments (`test/fixtures/fields/`).
- Vitest unit tests per adapter against saved HTML dumps (`test/fixtures/adapters/`), covering `matches`, `parseJob`, `overrideFieldMap`.
- Playwright E2E runs the extension against those fixture pages served locally. Never against live LinkedIn / Naukri / etc. (ToS + fragility).

## 6. Application tracker

### 6.1 Apply detection

Three signal types (content script). Any one triggers the confirmation banner:

1. **Submit-button click** — likely-apply buttons matched by text/attributes (`/submit|apply|send application/i`) + submit-role inputs. Adapters override when the text is non-standard.
2. **Form submit event** — document-level listener on forms flagged as apply forms during discovery.
3. **URL change to confirmation** — after submit, if URL matches `/confirmation|thank|applied|success/` or body text contains known phrases ("application received", "thanks for applying"), treat as confirmed.

On trigger, the content script asks the background worker for metadata. Metadata comes from the matching adapter's `parseJob` or from generic heuristics: `<meta og:title>`, JSON-LD `JobPosting`, page `<title>`, first `<h1>`, breadcrumbs. Falls back to AI `extractJobMetadata` only when AI is configured and generic parse returns low confidence.

### 6.2 Confirmation banner

Injected inline near the top of the viewport inside a Shadow DOM root (CSS isolation):

```
✔ Looks like you applied to [Acme Corp] — [Senior Engineer] · [NYC]
  Profile used: Base · Frontend variant (auto-suggested)
  [ Save to tracker ]  [ Edit details ]  [ Not an application ]
```

- **Edit details** expands to a compact form overriding any auto-parsed field before save.
- **Not an application** trains a per-domain ignore flag (30-day TTL) so the same URL pattern doesn't nag again.
- If the user closes the tab without confirming, a `beforeunload`-triggered draft record (`status: 'draft'`) is saved. The dashboard shows drafts in a separate tab for review.

### 6.3 Dedupe

Normalized URL is the dedupe key. On save, if a record with the same normalized URL exists, update it (bump `updatedAt`, preserve status/notes) and notify "Already tracked — updated timestamp." The background worker arbitrates across tabs: if two tabs race, the second sees the existing record and updates rather than creates.

### 6.4 Manual fallback

The popup always shows "Mark this page as applied" regardless of detection — same save path.

### 6.5 Status lifecycle

`applied → screening → interview → offer | rejected | withdrawn | ghosted`. Transitions are free (no enforcement). Dashboard row dropdown changes status. Moving to `screening` or `interview` prompts: "Add follow-up reminder? [+7d / +14d / Custom / No]".

### 6.6 Dashboard — Applications view

Columns: Company, Title, Applied At, Source, Status, Profile/Variant, Follow-up. Row click opens a detail drawer (full URL, JD snapshot collapsed by default, markdown notes, variant used, all captured metadata). Filters: status, source platform, date range, free-text search across company/title/notes. Sort on any column. Stats strip above the table shows counts by status over last 7 / 30 / 90 days.

### 6.7 Export format

- **CSV:** `id, url, appliedAt, companyName, jobTitle, jobLocation, jobId, sourcePlatform, profileId, variantId, status, notes, followUpAt, salaryRange`. Export scope is the current filter set.
- **JSON:** full-fidelity (includes `jdSnapshot` and all metadata). Reimportable.

CSV excludes `jdSnapshot` (too long, often multi-line).

### 6.8 Edge cases

- **LinkedIn "Easy Apply"** — modal doesn't navigate, so adapter-specific submit detection is required.
- **False-positive** ("Save search" vs "Apply") — *Not an application* deletes the draft and marks the URL pattern ignored.
- **User without network** — tracker saves locally; no external calls in the core path.

### 6.9 Testing

- URL normalization and dedupe unit tests.
- Metadata extraction unit tests on fixture pages.
- Playwright E2E for banner flow on synthetic apply pages.

## 7. Profiles, variants, saved-answer library

### 7.1 Profile & variant editor

Sidebar lists base profiles, each expandable to show its variants. Main pane edits the selected node.

**Base profile pane** — tabbed sections matching the data model (Personal, Links, Preferences, Headline & Summary, Work Experience, Education, Skills, Certifications, Languages, Projects, Files, Cover Letter Template). React forms bound to Zod schemas, autosave on blur.

**Variant pane** — split view. Left = base profile fields (read-only, greyed). Right = variant overrides with per-field **Inherit / Override** toggle. Only Override fields persist in `variant.overrides`. Match rules sit on top:

```
Name: [Frontend Engineer]     Priority: [5]
Job title contains: [react, frontend, ui, typescript]
Site is one of:     [wellfound.com, *.lever.co]
JD contains any of: [react, tailwind, nextjs]
```

Resume / cover-letter PDFs: drag-drop upload → `FileBlob`. A base profile may hold multiple; variants override `resumeFileId`, `coverLetterFileId`, or `coverLetterTemplate`.

### 7.2 Auto-suggest scoring

For each variant of the active base profile:
```
score = 0
if url.hostname ∈ rules.sites:          score += 3
for kw ∈ rules.jobTitleKeywords:
  if kw ⊂ parsedJobTitle (ci):          score += 2
for kw ∈ rules.jdKeywords:
  if kw ⊂ pageText (ci):                score += 1
```
Highest score wins; ties broken by `priority`, then by `updatedAt`. Score 0 → base profile alone. The suggested variant appears in the popup and banner with a dropdown for manual pick. A "Pin this variant for this domain" checkbox persists the choice in `variantOverrides` (kv).

### 7.3 Saved-answer library — passive capture

1. Content script listens for `blur` on textareas and long inputs. Triggers if answer length > 60 chars AND the field was identified as `customQa.*` or had a question-like label.
2. Background worker receives `{ questionText, answerText, url, sourcePlatform }` and checks `savedAnswers`:
   - `questionText` already in some entry's `questionSamples` → no-op.
   - `answerText` near-duplicate (>90% token similarity) of an existing `answer` → append `questionText` to that entry's `questionSamples`, bump `useCount`.
   - Otherwise → enqueue in `pendingAnswerCaptures` and surface a non-modal toast: *"Save this answer for reuse? [Label…] [Save] [Not now] [Don't ask on this site]"*.

Queueing before prompting means dismissed captures aren't lost — the dashboard's **Review captures** tray shows the queue for bulk save/discard. Sensitive canonical-key fields (SSN, DOB, gender, race, disability status) are excluded from capture.

### 7.4 Saved-answer library — retrieval

`answers.match(questionText, jd?)` scores each entry:
- Exact match against any `questionSamples[*]` → 100
- Token-overlap + normalized Levenshtein vs. `label` → 0–70
- Token-overlap + normalized Levenshtein vs. best `questionSamples[*]` → 0–60
- Tag match (if JD was AI-tagged) → +10

Returns all entries scoring ≥40, sorted desc. Top match appears inline as a chip; a "More matches" expander reveals the rest.

### 7.5 Saved-answer library — manual management

Dashboard **Answers** view: card list (label, first 200 chars, tags, useCount). Click to edit full answer, samples, tags, or delete. Search/filter by label, tag, content. Scoped JSON import/export.

### 7.6 AI tailoring

If `AIConfig.featuresEnabled.qaAnswering` is true, the inline chip includes *"Tailor with AI"*. Calls `ai.tailorAnswer({ savedAnswer, questionText, jd, effectiveProfile })`, shows a diff preview, user accepts or discards. Accepted tailored text can be: saved as a new SavedAnswer, replace the original, or inserted one-off (user choice). If AI is off, the tailor button is hidden; insert-saved still works.

## 8. AI integration

### 8.1 Provider interface

```ts
interface AIProvider {
  id: 'openai' | 'anthropic' | 'gemini'
  validateKey(key: string): Promise<boolean>
  complete(req: {
    model: string
    system: string
    messages: Array<{ role: 'user'|'assistant', content: string }>
    maxTokens?: number
    temperature?: number
  }): Promise<{
    text: string
    usage: { inputTokens: number, outputTokens: number }
    stopReason: string
  }>
}
```

Implementations under `features/ai/providers/{openai,anthropic,gemini}.ts`. Consumers never call providers directly.

### 8.2 Feature API

```ts
ai.draftAnswer({ questionText, jd, profile, savedAnswers })       // → string
ai.tailorAnswer({ savedAnswer, questionText, jd, profile })       // → string
ai.generateCoverLetter({ jd, profile, template? })                // → string
ai.tailorResumeBullets({ bullets, jd })                           // → string[]
ai.extractJobMetadata({ pageText })                               // → Partial<JobMeta>
ai.summarizeJd({ jd, profile })
  // → { summary, pros, cons, redFlags }
```

Each feature function:
1. Reads `AIConfig` for provider + model.
2. Loads its prompt from `features/ai/prompts/*.md` (versioned filename, e.g. `draft-answer.v1.md`) with `{{placeholder}}` substitution.
3. Calls `provider.complete`.
4. Zod-validates structured outputs.
5. Records token usage to a rolling stats blob in `kv`.

Prompt versioning preserves reproducibility when prompts change.

### 8.3 Caching

In-memory LRU (50 entries) keyed on `hash(prompt + model)`. Cleared when provider/model changes. Same JD + same question → same output within a session, no recompute.

### 8.4 Errors

Provider errors map to a shared union: `invalid-key`, `rate-limited (retryAfter?)`, `quota-exceeded`, `network`, `server(status)`, `parse`. UI renders a human-readable message with *Retry* for transient errors and *Open AI settings* for auth/quota issues.

### 8.5 Streaming

Not in v1. Answers (~300 tok) and cover letters (~600 tok) are small enough for non-streaming. Streaming is a Phase 9 enhancement.

### 8.6 Optional-by-design

The `ai` module is lazy-imported from the background worker only when `AIConfig.apiKeys` contains at least one key. With no key, every AI-touching UI element hides or shows a disabled "Configure AI" hint. Core paths (autofill, tracker, saved-answer insert) never depend on `ai`.

### 8.7 AI settings UI (dashboard)

- Per provider: enable toggle · API key input (masked with show/test) · model dropdown
- Default provider picker
- Per-feature toggles (one per `ai.*` function)
- Usage stats (input/output tokens, estimated cost via a shipped pricing table)
- Warning note: "Keys live in `chrome.storage.local` in plaintext. Use scoped keys with spend caps."

## 9. Reminders

Scheduled via `chrome.alarms` (survives browser restart). On Reminder create, the background worker schedules an alarm named `reminder:<id>`. The alarm handler fires `chrome.notifications.create` with:
- title = `reminder.title`
- body = optional note + linked job title/company
- buttons: *Open application*, *Snooze 3d*, *Mark done*

Notification click opens the linked application URL (new tab) or the Reminders view if none.

**Creation entry points:**
- Apply banner (after save): *Remind me in +7d / +14d / Custom*
- Dashboard Reminders view: *+ New reminder* with application picker
- Application-status transition to `screening` or `interview` — optional prompt

Edit / dismiss / snooze from the Reminders view (table: due, application, title, status, actions).

## 10. Dashboard (options page)

Left-rail navigation:

```
● Overview      — stats strip, recent applications, upcoming reminders, captures to review
● Applications  — tracker table (§6.6)
● Profiles      — base + variants editor (§7.1)
● Answers       — saved-answer library (§7.5)
● Reminders     — list + create
● AI            — provider config + usage (§8.7)
● Settings      — detection mode, capture toggles, theme, import/export, danger zone
```

**Overview** is the landing view. The *captures to review* tile surfaces the `pendingAnswerCaptures` queue.

**Settings tab:**
- Detection mode: `auto-confirm | manual-only | off`
- Passive answer capture on/off
- Capture JD snapshot on/off
- Theme
- Export all data (single JSON, FileBlobs base64, keys redacted, schemaVersion stamped)
- Import (replace / merge)
- Danger zone: *Clear all data*, *Reset dictionary overrides*

## 11. Popup (toolbar icon)

Compact, contextual to the active tab:

```
resume-bin                     ⚙
─────────────────────────────────
Site: wellfound.com · apply page
Autofill: 12 fields detected
[ Fill this page ]

Profile: [ Base ▾ ]
Variant: [ Frontend (auto) ▾ ]  ☐ Pin to this domain

[ Mark this page as applied ]
Tracker: already applied 2026-04-14 · [edit]

AI: ● connected (openai · gpt-4o-mini)
     (or ○ disabled  [configure])

[ Open dashboard ]
```

Sections hide when irrelevant (no form → hide autofill block; not an apply page → hide *Mark applied*; already tracked → show applied date + edit).

## 12. Project scaffold

```
resume-bin/
├── manifest.json                 (MV3)
├── package.json · vite.config.ts · tsconfig.json · tailwind.config.js
├── src/
│   ├── background/index.ts
│   ├── content/index.ts
│   ├── popup/{index.html,main.tsx}
│   ├── options/{index.html,main.tsx}
│   ├── features/
│   │   ├── profile/
│   │   ├── autofill/{engine.ts,dictionary/,adapters/}
│   │   ├── tracker/
│   │   ├── answers/
│   │   ├── ai/{index.ts,providers/,prompts/}
│   │   └── reminders/
│   └── shared/{storage,messaging,schema,util}
├── public/icons/                 16/32/48/128
├── test/
│   ├── fixtures/{fields,adapters}
│   ├── unit/
│   └── e2e/                      Playwright
└── docs/superpowers/specs/
```

## 13. Manifest essentials

```json
{
  "manifest_version": 3,
  "name": "resume-bin",
  "version": "0.1.0",
  "action": { "default_popup": "src/popup/index.html" },
  "options_page": "src/options/index.html",
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["src/content/index.ts"],
    "run_at": "document_idle"
  }],
  "permissions": ["storage", "alarms", "notifications", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"]
}
```

`<all_urls>` is required for generic autofill on arbitrary career portals.

## 14. Testing strategy

- **Unit (Vitest + jsdom):** dictionary matching, URL normalization, dedupe, variant scoring, answer matching, schema migrations, prompt rendering, per-provider error mapping.
- **Adapter tests:** per-adapter saved HTML dumps in `test/fixtures/adapters/`, exercising `matches`, `parseJob`, `overrideFieldMap`. Refresh fixtures whenever a site changes.
- **E2E (Playwright):** built extension loaded into headed Chromium, navigated to fixture pages on a local static server. Flows: discover → preview → fill → apply-detect → banner → save → dashboard → export.
- **Never against live sites** (ToS + fragility).

## 15. Development and distribution

- `npm run dev` — HMR dev build; load `dist/` unpacked in `chrome://extensions`.
- `npm run build` → production `dist/`.
- `npm run pack` → `resume-bin-vX.Y.Z.zip`.
- `npm run test` — Vitest; `npm run e2e` — Playwright.
- Pre-commit: `typecheck + lint + unit` via husky/lefthook.
- Distribution: unpacked install from git + build. No Chrome Web Store submission.
- Optional GitHub Actions: typecheck/lint/unit on push; Playwright on PR; tag → build artifact.

## 16. Phased roadmap

**Phase 0 — Scaffold** (~1–2 days)
Vite + CRX plugin + TS + React + Tailwind. Empty background / content / popup / options wired together. Dexie with empty schema. Zod schemas for all entities. Typed messaging bus. CI.

**Phase 1 — Walking skeleton** (~1 week, *first usable version*)
Minimal profile editor (Personal, Links, Preferences, Summary, Skills). Popup with site info + *Fill this page*. Generic heuristic autofill for ~8 canonical keys (email, phone, firstName, lastName, linkedinUrl, githubUrl, city, summary). Preview panel with per-field checkboxes. Tracker via manual *Mark applied* button. Applications table + CSV export. Settings (theme, Clear all). **Dogfood real applications from here on.**

**Phase 2 — Coverage** (~1–2 weeks)
Full dictionary (address parts, work auth, CTC, notice, work-experience and education collections). Adapters: LinkedIn, Naukri, Wellfound, Greenhouse, Lever + fixtures. Resume/cover-letter PDF upload + fill.

**Phase 3 — Apply detection** (~1 week)
Auto-detect banner (submit-button + form-submit + URL-change). Metadata parser (og:title, JSON-LD, adapter overrides). *Not an application* ignore list. Shadow-DOM banner UX. JD snapshot capture.

**Phase 4 — Variants** (~1 week)
Variant editor (Inherit/Override). Match rules, scoring, auto-suggest in popup + banner. Pin-to-domain. Adapters: Workday, Ashby.

**Phase 5 — Saved-answer library** (~1 week)
Passive capture + toast. `pendingAnswerCaptures` queue + Review view. Manual management. Retrieval matching + inline chip.

**Phase 6 — AI integration** (~1.5–2 weeks)
Provider interface + OpenAI / Anthropic / Gemini. AI config UI. Features: `draftAnswer`, `tailorAnswer`, `extractJobMetadata`, `summarizeJd`. Versioned prompts. Error mapping + usage stats.

**Phase 7 — Cover letter + resume tailoring** (~1 week)
`generateCoverLetter` (template-aware). `tailorResumeBullets` (outputs text for user to paste). Diff / preview UI.

**Phase 8 — Reminders + dashboard polish** (~1 week)
`chrome.alarms` + notifications + snooze. Reminders view. Overview page (stats, recent, upcoming, captures). Import/export all.

**Phase 9 — Refinement (ongoing)**
Passphrase-encrypted keys. Streaming AI responses. Additional adapters as encountered. Dictionary learning from user corrections. Closed-shadow-DOM workarounds where practical.

Rough total: **~8–10 weeks** of part-time work; Phase 1 ships within one week.

## 17. Open questions (deferred to implementation)

- Exact list of canonical keys in the Phase 2 full dictionary (will be enumerated during implementation planning).
- Provider default models (e.g. OpenAI `gpt-4o-mini` vs. `gpt-4.1-mini`) — pinned during Phase 6.
- Precise pricing-table numbers for cost estimation — sourced during Phase 6.
- Whether `ignoredApplyPatterns` TTL should be configurable per entry rather than a global 30-day default — revisit after dogfooding Phase 3.

# resume-bin — Phase 3 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Auto-detect when the user submits a job application — no more manual "Mark Applied" clicks. Capture job metadata automatically, let users dismiss false positives with an ignore list, and snapshot the job description for later reference.

**Privacy note:** All captured data stays in the user's local IndexedDB. Zero network calls are made for detection or storage.

**Spec reference:** `docs/superpowers/specs/2026-04-16-resume-bin-design.md` §Phase 3 (line ~612)

---

## Summary of changes

| Area | What ships |
|------|-----------|
| Apply detection | Detect form submit + submit-button click + URL change heuristics |
| Job metadata parser | Extract title + company from `og:title`, JSON-LD, adapter, `<h1>` fallback |
| Auto-tracker | Write `ApplicationRecord` automatically on detection (deduplicated by URL) |
| Ignore list | "Not a job application" button on banner; stores URL pattern in settings |
| Banner UX | Replace plain pill with a richer "Applied?" confirmation banner post-submit |
| JD snapshot | Capture visible job description text at apply-time, store in `ApplicationRecord` |
| Applications view | Show auto-captured entries separately / with a `source: 'auto'` badge |
| Tests | Unit tests for detector heuristics, metadata parser, ignore-list matching |

---

## Task 1 — Job metadata parser

**Files:**
- `src/features/autofill/adapters/parseJob.ts` (shared utility, extract from existing adapter `parseJob` methods)
- `src/features/tracker/parseJobMeta.ts` (new)

The 5 existing site adapters each have a `parseJob` method. Extract the common logic into a shared utility that any code can call.

- [ ] **Step 1:** Create `src/features/tracker/parseJobMeta.ts`

```ts
export interface JobMeta {
  title: string;
  company: string;
  location?: string;
  jdText?: string; // visible job description snapshot
}

export function parseJobMeta(doc: Document, adapter?: SiteAdapter): Partial<JobMeta>
```

Priority order:
1. `adapter.parseJob(doc)` if adapter present
2. JSON-LD `JobPosting` schema
3. `og:title` / `og:site_name`
4. `<h1>` + nearest company element heuristic

- [ ] **Step 2:** Extract JD text — find the largest readable `<div>` or `<section>` that contains job-description keywords ("responsibilities", "requirements", "about the role", "qualifications"). Take its `.innerText`, trim to 8000 chars max.

- [ ] **Step 3:** Unit test `parseJobMeta` with 3 fixture HTML strings (JSON-LD, og:title only, bare h1).

---

## Task 2 — Apply detector (content script)

**Files:**
- `src/features/tracker/applyDetector.ts` (new)
- `src/content/index.ts` (wire in)

Detect an application submission via three independent signals. Any one signal fires the detector.

- [ ] **Step 1:** Create `src/features/tracker/applyDetector.ts`

```ts
export interface ApplyDetectorOptions {
  onDetected: (meta: Partial<JobMeta>) => void;
}

export function mountApplyDetector(options: ApplyDetectorOptions): () => void
// returns a cleanup function
```

Three signals:

**Signal A — Form submit:**
Listen for `document.addEventListener('submit', handler, true)` (capture phase). Filter: only fire if the form has ≥ 2 fields and the URL looks like a job page (has `/jobs/`, `/apply`, `/careers/`, `/job/` in the path or current adapter matches).

**Signal B — Submit button click:**
Listen for `document.addEventListener('click', handler, true)`. Match buttons whose visible text / aria-label matches `/\b(apply|submit application|send application)\b/i`. Debounce 1s to avoid double-fire with Signal A.

**Signal C — URL change (SPA navigation):**
Use a `MutationObserver` on `document.title` + `setInterval`-free `history.pushState` / `popstate` intercept. Fire if the new URL contains `/confirmation`, `/success`, `/applied`, `/thank` and the previous URL was a job application page.

- [ ] **Step 2:** Wire `mountApplyDetector` into `src/content/index.ts` — call on load, store cleanup in module scope.

- [ ] **Step 3:** On detection, call `parseJobMeta(document, currentAdapter)` then `sendMessage('tracker/auto-apply', { meta, url: location.href, title: document.title })`.

- [ ] **Step 4:** Unit tests for each signal in isolation using jsdom.

---

## Task 3 — Ignore list (settings schema + UI)

**Files:**
- `src/shared/schema/settings.ts` — add `ignoredApplyPatterns: string[]`
- `src/options/views/SettingsView.tsx` — add Ignore list section

- [ ] **Step 1:** Add `ignoredApplyPatterns: z.array(z.string()).default([])` to `settingsSchema`.

- [ ] **Step 2:** In the detector (`applyDetector.ts`), before firing `onDetected`, check `settings.ignoredApplyPatterns` — if any pattern matches `location.href` (simple `includes` match), skip silently.

- [ ] **Step 3:** Add an "Ignored sites" section to `SettingsView`:
  - Shows list of ignored patterns with a Remove button each
  - No "Add" UI here — patterns are added via the banner (Task 4)

---

## Task 4 — "Applied?" confirmation banner

**Files:**
- `src/content/applyBanner.tsx` (new)
- `src/content/index.ts` (wire in)

After detection fires, show a non-intrusive banner (bottom-right, above the pill) that lets the user confirm or dismiss.

- [ ] **Step 1:** Create `src/content/applyBanner.tsx`

Banner UI (inline styles, same token approach as `preview.tsx`):
```
╔═══════════════════════════════════════╗
║ 🎯  Did you just apply?               ║
║  Acme Corp — Senior Engineer          ║
║  [✓ Yes, log it]  [✗ Not a job app]   ║
╚═══════════════════════════════════════╝
```

- "Yes, log it" → sends `tracker/auto-apply` message → banner closes
- "Not a job app" → sends `settings/add-ignore-pattern` with `location.hostname` → banner closes and this domain is never detected again
- Auto-dismisses after 12 seconds if no interaction

- [ ] **Step 2:** Export `openApplyBanner(meta: Partial<JobMeta>): void` and `closeApplyBanner(): void`.

- [ ] **Step 3:** Wire into `content/index.ts` — `onDetected` calls `openApplyBanner(meta)` instead of directly sending the message.

---

## Task 5 — Background handler: auto-apply message

**Files:**
- `src/shared/messaging/types.ts` — add `tracker/auto-apply`, `settings/add-ignore-pattern`
- `src/background/handlers.ts` — handle both
- `src/features/tracker/index.ts` — add `autoMarkApplied`

- [ ] **Step 1:** Add to `Message` union:
```ts
| MessageEnvelope<'tracker/auto-apply', { url: string; title: string; meta: Partial<JobMeta> }>
| MessageEnvelope<'settings/add-ignore-pattern', { pattern: string }>
```

Add to `ResponseMap`:
```ts
'tracker/auto-apply': ApplicationRecord;
'settings/add-ignore-pattern': Settings;
```

- [ ] **Step 2:** Add `autoMarkApplied` to `src/features/tracker/index.ts`:
  - Check `db.applications` for existing record with same URL — if found, return it (dedup)
  - Otherwise create new `ApplicationRecord` with `source: 'auto'`, `status: 'applied'`, populate from `meta`
  - Store `jdText` in record (add field to `ApplicationRecord` schema)

- [ ] **Step 3:** Register handlers in `background/handlers.ts`.

---

## Task 6 — ApplicationRecord schema: add auto-detect fields

**Files:**
- `src/shared/schema/application.ts`
- `src/shared/storage/db.ts` — bump Dexie version

- [ ] **Step 1:** Add to `applicationSchema`:
```ts
source: z.enum(['manual', 'auto']).default('manual'),
jdText: z.string().optional(),   // job description snapshot
detectedAt: z.number().optional(), // ms timestamp of auto-detection
```

- [ ] **Step 2:** Bump Dexie version — add `source` to the index: `'id, url, appliedAt, companyName, status, source'`.

---

## Task 7 — Applications view: show auto-captured badge

**Files:**
- `src/options/views/ApplicationsView.tsx`

- [ ] Add a small `AUTO` badge (accent colour, pill shape) next to the company name for records where `source === 'auto'`.
- [ ] Add a filter toggle: **All / Manual / Auto-detected**.
- [ ] Show `jdText` in the detail view / expandable row (truncated to 300 chars with a "Show more" toggle).

---

## Task 8 — Settings: add-ignore-pattern handler

**Files:**
- `src/features/settings/index.ts`

- [ ] Add `addIgnorePattern(pattern: string): Promise<Settings>` — appends to `ignoredApplyPatterns`, deduplicates, saves.
- [ ] Wire into the background handler registered in Task 5.

---

## Definition of Done

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run test` passes (all existing + new tests green)
- [ ] `npm run build` produces a loadable extension
- [ ] Submitting a form on a job page triggers the "Applied?" banner within 1 second
- [ ] Confirming logs an `ApplicationRecord` with `source: 'auto'` visible in Applications view
- [ ] "Not a job app" adds the hostname to ignore list; next visit never triggers the banner
- [ ] JD text is captured and visible in the application detail
- [ ] Duplicate submissions (same URL) do not create duplicate records

---

## Order of execution

1 → 6 → 2 → 3 → 4 → 5 → 7 → 8

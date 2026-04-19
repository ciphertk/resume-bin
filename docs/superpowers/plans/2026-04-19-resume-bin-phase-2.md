# resume-bin — Phase 2 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Expand coverage — complete the profile model with work experience and education, broaden the autofill dictionary to all canonical keys, ship site adapters for the top 5 job boards, and add resume/cover-letter PDF upload.

**Spec reference:** `docs/superpowers/specs/2026-04-16-resume-bin-design.md` §Phase 2 (line ~609)

---

## Summary of changes

| Area | What ships |
|------|-----------|
| Bug: Profile nav | Fix — ProfileEditor shown by default but nav highlight missing on first load |
| Bug: Comma-separated skills | ✅ Already fixed (split on `,` in SkillsSection.addSkill) |
| Profile model | Add `workExperience[]` and `education[]` collections to Zod schema + Dexie |
| Profile UI | Work Experience and Education sections in ProfileEditor (add/edit/remove entries) |
| Autofill dictionary | Expand from 8 → ~20 canonical keys (address, workAuth, CTC, notice, YOE, collections) |
| Site adapters | LinkedIn Easy Apply, Naukri, Wellfound, Greenhouse, Lever |
| PDF upload | Resume + cover letter drag-drop in options; fill logic sets file input or pastes name |
| Preview panel | Show workExperience and education matches in the floating panel |
| Tests | Unit tests per adapter (HTML fixture dumps), dictionary expansions, schema changes |

---

## Task 1 — Fix Profile nav highlight on first load

**Files:** `src/options/App.tsx`

The default route is `'profile'` but on first open the URL hash is empty, so `parseHash()` returns `'profile'` correctly. Verify the nav item is visually active on load. If not, the issue is that `useState(parseHash())` runs before `hashchange` fires — fix by ensuring initial state drives the active style.

- [ ] **Step 1:** Open options page, inspect whether the Profile nav button has the active style on load. If not, add a `useEffect` that calls `go('profile')` once if `location.hash === ''` so the hash is set and the active state is consistent.
- [ ] **Step 2:** Confirm all 3 nav items highlight correctly when clicked.

---

## Task 2 — Expand Zod schema: workExperience + education

**Files:**
- `src/shared/schema/profile.ts`
- `src/shared/schema/index.ts`
- `src/shared/storage/db.ts`

The `Profile` schema already has `workExperience: z.array(...)` and `education: z.array(...)` placeholders (or they need to be added).

- [ ] **Step 1: Add `WorkExperience` sub-schema to `profile.ts`**

```ts
export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  startMonth: z.string().optional(), // "YYYY-MM"
  endMonth: z.string().optional(),   // "YYYY-MM" or undefined = present
  current: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
});
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
```

- [ ] **Step 2: Add `Education` sub-schema**

```ts
export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string().optional(),      // "B.Tech", "M.S.", etc.
  field: z.string().optional(),       // "Computer Science"
  startYear: z.number().optional(),
  endYear: z.number().optional(),
  grade: z.string().optional(),       // "8.5 CGPA", "3.8 GPA"
});
export type Education = z.infer<typeof EducationSchema>;
```

- [ ] **Step 3: Add to `ProfileSchema`**

```ts
workExperience: z.array(WorkExperienceSchema).default([]),
education: z.array(EducationSchema).default([]),
```

- [ ] **Step 4: Bump Dexie schema version in `db.ts`** — profiles table already exists; Dexie does not need an index on nested arrays so just bump version number with no table changes (upgrade is a no-op, existing rows gain the new fields via `.default([])`).

- [ ] **Step 5: Update `src/shared/schema/index.ts`** — export new types.

- [ ] **Step 6: Run `npm run typecheck`** — fix any type errors from the schema change propagating to store/CopyPanel/etc.

---

## Task 3 — Work Experience UI section

**Files:**
- `src/features/profile/ui/WorkExperienceSection.tsx` (new)
- `src/features/profile/ui/ProfileEditor.tsx` (add tab)

- [ ] **Step 1: Create `WorkExperienceSection.tsx`**

Renders a list of work experience cards (company, title, date range, description). Each card has an Edit and Remove button. A "+ Add position" button opens an inline form below the list with fields: Company*, Title*, Start month, End month (or "Present" checkbox), Location, Description (textarea). Save adds/updates via `save({ workExperience: [...] })`. Cancel discards.

Design: same `rb-*` token classes as other sections. Each card is a rounded-xl surface border. Form fields use the existing `inputClass` / `labelClass` from `field.tsx`.

- [ ] **Step 2: Add "Experience" tab to ProfileEditor**

Add `'experience'` to the `tabs` array between `'links'` and `'preferences'`:
```
Personal | Links | Experience | Education | Preferences | Summary | Skills
```

- [ ] **Step 3: Render `<WorkExperienceSection />` for the experience tab.**

---

## Task 4 — Education UI section

**Files:**
- `src/features/profile/ui/EducationSection.tsx` (new)
- `src/features/profile/ui/ProfileEditor.tsx` (add tab)

- [ ] **Step 1: Create `EducationSection.tsx`**

Same card+form pattern as WorkExperienceSection. Fields: Institution*, Degree, Field of study, Start year, End year (or "Present"), Grade/GPA.

- [ ] **Step 2: Add "Education" tab to ProfileEditor** after "Experience".

- [ ] **Step 3: Render `<EducationSection />` for the education tab.**

---

## Task 5 — Expand autofill dictionary (full canonical set)

**Spec reference:** §4 Autofill pipeline — canonical keys list

**Files:**
- `src/features/autofill/dictionary/` — add new files
- `src/features/autofill/dictionary/index.ts` — register all

New keys to add (each in its own file following the existing pattern):

| Key | Source field | Notes |
|-----|-------------|-------|
| `fullName` | `${firstName} ${lastName}` | Combined |
| `address` | `profile.location.address` | Add `address` to location schema |
| `zip` | `profile.location.zip` | Add to location schema |
| `state` | `profile.location.state` | Already in schema |
| `country` | `profile.location.country` | Already in schema |
| `workAuthorization` | `profile.workAuthorization` | |
| `noticePeriodDays` | `profile.noticePeriodDays` | Format as "X days" |
| `currentCtcAnnual` | `profile.currentCtcAnnual` | Format as plain number |
| `expectedCtcAnnual` | `profile.expectedCtcAnnual` | |
| `yearsOfExperience` | derived from `workExperience[]` | Sum of durations |
| `currentCompany` | `workExperience[0].company` | Most recent |
| `currentTitle` | `workExperience[0].title` | Most recent |
| `latestDegree` | `education[-1].degree` | Most recent |
| `latestInstitution` | `education[-1].institution` | |
| `portfolioUrl` | `profile.portfolioUrl` | Already in schema |
| `websiteUrl` | `profile.websiteUrl` | |
| `twitterUrl` | `profile.twitterUrl` | |

- [ ] **Step 1:** Add `address`, `zip` to `LocationSchema` in `profile.ts`.

- [ ] **Step 2:** Add `fullName.ts`, `address.ts`, `zip.ts`, `state.ts`, `country.ts`, `workAuthorization.ts`, `noticePeriodDays.ts`, `currentCtcAnnual.ts`, `expectedCtcAnnual.ts`, `yearsOfExperience.ts`, `currentCompany.ts`, `currentTitle.ts`, `latestDegree.ts`, `latestInstitution.ts`, `portfolioUrl.ts`, `websiteUrl.ts`, `twitterUrl.ts` — each following the `FieldDef` shape used by existing dictionary files.

- [ ] **Step 3:** Register all in `dictionary/index.ts`.

- [ ] **Step 4:** Add/extend unit tests in `dictionary.test.ts` for all new keys.

---

## Task 6 — Site adapters: LinkedIn Easy Apply

**Files:**
- `src/features/autofill/adapters/linkedin.ts` (new)
- `test/fixtures/adapters/linkedin/` — HTML fixture dump

**Adapter shape:**
```ts
export interface SiteAdapter {
  matches(url: string): boolean;
  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[];
  parseJob?(doc: Document): Partial<JobMeta>;
}
```

- [ ] **Step 1:** Create `src/features/autofill/adapters/linkedin.ts`
  - `matches`: `/linkedin\.com\/jobs\//`
  - `overrideFieldMap`: map known LinkedIn Easy Apply field IDs (`firstName`, `lastName`, `phoneNumber`, `city`, `summary`, etc.) to canonical keys
  - `parseJob`: read `og:title`, JSON-LD `JobPosting`, or `<h1>` for job title + company

- [ ] **Step 2:** Save a real LinkedIn Easy Apply HTML dump to `test/fixtures/adapters/linkedin/easy-apply.html` (or use a mock fragment).

- [ ] **Step 3:** Write unit tests in `linkedin.test.ts` covering `matches`, `overrideFieldMap`, `parseJob`.

- [ ] **Step 4:** Register adapter in `src/features/autofill/adapters/index.ts` (create file if needed) and wire into `engine.ts` adapter resolution.

---

## Task 7 — Site adapters: Naukri

**Files:** `src/features/autofill/adapters/naukri.ts`, fixture, test

- [ ] Same structure as Task 6 but for `naukri.com`. Naukri uses named `id` attributes on form fields; map them to canonical keys.

---

## Task 8 — Site adapters: Wellfound (formerly AngelList)

**Files:** `src/features/autofill/adapters/wellfound.ts`, fixture, test

- [ ] `matches`: `/wellfound\.com\/jobs\//` and `/angel\.co\/jobs\//`

---

## Task 9 — Site adapters: Greenhouse

**Files:** `src/features/autofill/adapters/greenhouse.ts`, fixture, test

- [ ] `matches`: `/boards\.greenhouse\.io\//` and `/greenhouse\.io\/jobs\//`
- Greenhouse uses a consistent DOM structure with labeled `<div class="field">` wrappers — override map by label text.

---

## Task 10 — Site adapters: Lever

**Files:** `src/features/autofill/adapters/lever.ts`, fixture, test

- [ ] `matches`: `/jobs\.lever\.co\//`
- Lever uses `name` attributes like `"name"`, `"email"`, `"phone"`, `"org"`, `"urls[LinkedIn]"`.

---

## Task 11 — Wire adapters into autofill engine

**Files:** `src/features/autofill/engine.ts`, `src/features/autofill/adapters/index.ts`

- [ ] **Step 1:** Create `adapters/index.ts` that exports an array `ADAPTERS: SiteAdapter[]` of all registered adapters.

- [ ] **Step 2:** In `engine.ts`, after generic identify(), check `ADAPTERS.find(a => a.matches(location.href))` and if found, call `adapter.overrideFieldMap(candidates)`.

- [ ] **Step 3:** Pass `adapter.parseJob?.(document)` result back to the background to pre-populate tracker metadata.

- [ ] **Step 4:** Update engine tests to cover the adapter override path.

---

## Task 12 — Resume / cover-letter PDF upload

**Files:**
- `src/features/fileBlob/store.ts` (new)
- `src/features/fileBlob/index.ts` (new)
- `src/options/views/ProfileView.tsx` — add upload UI inside profile or as separate Files section
- `src/features/profile/ui/ProfileEditor.tsx` — add "Files" tab
- `src/shared/messaging/types.ts` — add `fileBlob/save`, `fileBlob/get`, `fileBlob/list`, `fileBlob/delete`
- `src/background/handlers.ts` — handle fileBlob messages
- `src/features/autofill/fill.ts` — handle `resumeUpload` and `coverLetterUpload` keys

**Schema:** `src/shared/schema/fileBlob.ts` already exists. `Profile` should add optional `resumeFileId?: string` and `coverLetterFileId?: string`.

- [ ] **Step 1:** Create `fileBlob/store.ts` with CRUD using `db.fileBlobs` (ensure Dexie table exists in `db.ts`).

- [ ] **Step 2:** Add messaging types for fileBlob operations.

- [ ] **Step 3:** Add handlers in `background/handlers.ts`.

- [ ] **Step 4:** Add "Files" tab to ProfileEditor with:
  - Drag-drop zone or file input (accept `.pdf`)
  - Shows currently stored resume filename + size + upload date
  - Shows currently stored cover letter filename + size + upload date
  - Remove buttons for each
  - "Set as active resume" / "Set as active cover letter" sets the ID on the profile

- [ ] **Step 5:** In `fill.ts`, handle `resumeUpload` key: find `<input type="file">` associated with the field, use `DataTransfer` API to programmatically set the file from the stored `ArrayBuffer`. If browser blocks this, fall back to copying the filename into the field as text.

---

## Task 13 — Update CopyPanel for new profile fields

**Files:** `src/popup/CopyPanel.tsx`

- [ ] Add entries for `workAuthorization`, `noticePeriodDays`, `currentCtcAnnual`, `expectedCtcAnnual`, `currentCompany`, `currentTitle`, `latestDegree` — all guarded with `!== undefined`.

---

## Task 14 — Update preview panel for collections

**Files:** `src/content/preview.tsx`

- [ ] Show up to 2 most-recent work experience entries (company + title + date range) as matched fields in the preview.
- [ ] Show most-recent education entry (institution + degree) as a matched field.

---

## Task 15 — Personal section: add address + zip fields

**Files:** `src/features/profile/ui/PersonalSection.tsx`

- [ ] Add `Address line` and `ZIP / Postal code` fields below City/State/Country.

---

## Definition of Done

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run test` passes (all existing + new tests green)
- [ ] `npm run build` produces a loadable extension
- [ ] Profile nav item is active/highlighted on first open
- [ ] Comma-separated skills split correctly on Add / Enter
- [ ] Work Experience and Education tabs appear and save to IndexedDB
- [ ] All 5 site adapters have unit tests with fixture coverage
- [ ] PDF upload UI allows drag-drop and stores file in IndexedDB
- [ ] CopyPanel shows expanded fields
- [ ] Preview panel shows experience/education matches

---

## Order of execution

1 → 2 → 15 → 3 → 4 → 5 → 6–10 (adapters can be parallel) → 11 → 12 → 13 → 14

# resume-bin Phase 4 — Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users maintain multiple tailored profile variants (e.g. "Startup roles", "India market") that auto-activate based on site domain or job-title keywords, and add Workday and Ashby site adapters.

**Architecture:** A `Variant` is a partial `Profile` override stored in `db.variants` (already wired). The autofill engine merges the active variant's overrides on top of the base profile before resolving field values. The content script resolves the active variant after parsing job metadata and passes it down to `buildMappings`. The Options page gains a "Variants" management view accessible via a new nav item.

**Tech Stack:** TypeScript strict, React 18, Vitest, Dexie (IndexedDB), Zod, Chrome MV3 messaging bus (`sendMessage`/`registerHandler`), Tailwind with `rb-*` CSS token classes.

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/features/variants/store.ts` | **Create** | CRUD + `resolveVariantForContext` |
| `src/features/variants/index.ts` | **Create** | Re-export store functions |
| `src/features/variants/store.test.ts` | **Create** | Unit tests for store |
| `src/shared/messaging/types.ts` | **Modify** | Add 4 variant message types |
| `src/background/handlers.ts` | **Modify** | Register variant handlers |
| `src/features/autofill/engine.ts` | **Modify** | Add `mergeProfileWithVariant`, extend `buildMappings` |
| `src/features/autofill/engine.test.ts` | **Create** | Tests for merge logic |
| `src/content/index.ts` | **Modify** | Resolve + cache active variant |
| `src/features/autofill/adapters/workday.ts` | **Create** | Workday ATS adapter |
| `src/features/autofill/adapters/workday.test.ts` | **Create** | Workday adapter tests |
| `src/features/autofill/adapters/ashby.ts` | **Create** | Ashby ATS adapter |
| `src/features/autofill/adapters/ashby.test.ts` | **Create** | Ashby adapter tests |
| `src/features/autofill/adapters/index.ts` | **Modify** | Register workday + ashby |
| `src/options/router.ts` | **Modify** | Add `'variants'` route |
| `src/options/App.tsx` | **Modify** | Add Variants nav + VariantsView render |
| `src/options/views/VariantsView.tsx` | **Create** | Full variants management UI |
| `docs/features.md` | **Modify** | Mark Phase 3 shipped, add Phase 4 detail |

---

## Task 1 — Variant store

**Files:**
- Create: `src/features/variants/store.ts`
- Create: `src/features/variants/index.ts`
- Create: `src/features/variants/store.test.ts`

### Context

`db.variants` already exists (Dexie table, indexed on `id, baseProfileId`). The `Variant` and `MatchRules` types are in `src/shared/schema/variant.ts`:

```ts
// existing — do not re-create
interface MatchRules {
  jobTitleKeywords?: string[];
  sites?: string[];
  jdKeywords?: string[];
}
interface Variant {
  id: string; createdAt: number; updatedAt: number;
  baseProfileId: string;
  name: string;
  priority: number;
  matchRules: MatchRules;
  overrides: Partial<Profile>;
}
```

Matching rule: for `resolveVariantForContext`, iterate variants sorted by `priority` (ascending — lower number = wins first). For each variant, try sites → jobTitleKeywords → jdKeywords; return on first hit. All string comparisons are case-insensitive.

- [ ] **Step 1: Write the failing tests**

Create `src/features/variants/store.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { saveVariant, listVariants, deleteVariant, resolveVariantForContext } from './store';
import type { Variant } from '@/shared/schema/variant';

const makeVariant = (over: Partial<Variant> = {}): Variant => ({
  id: crypto.randomUUID(),
  baseProfileId: 'base-1',
  name: 'Test',
  priority: 1,
  matchRules: {},
  overrides: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...over,
});

describe('variant store', () => {
  beforeEach(async () => { await resetDatabase(); });
  afterEach(async () => { await db.close(); });

  it('listVariants returns empty array when nothing stored', async () => {
    expect(await listVariants()).toEqual([]);
  });

  it('saveVariant persists and listVariants returns sorted by priority', async () => {
    const v2 = makeVariant({ id: 'v2', name: 'B', priority: 2 });
    const v1 = makeVariant({ id: 'v1', name: 'A', priority: 1 });
    await saveVariant(v2);
    await saveVariant(v1);
    const list = await listVariants();
    expect(list[0].id).toBe('v1');
    expect(list[1].id).toBe('v2');
  });

  it('deleteVariant removes the record', async () => {
    const v = makeVariant({ id: 'del' });
    await saveVariant(v);
    await deleteVariant('del');
    expect(await listVariants()).toHaveLength(0);
  });

  it('resolveVariantForContext returns null when no variants', async () => {
    const result = await resolveVariantForContext('https://example.com');
    expect(result).toBeNull();
  });

  it('resolveVariantForContext matches by site hostname', async () => {
    const v = makeVariant({ matchRules: { sites: ['wellfound.com'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://wellfound.com/jobs/123');
    expect(result?.id).toBe(v.id);
  });

  it('resolveVariantForContext matches by jobTitleKeywords case-insensitively', async () => {
    const v = makeVariant({ matchRules: { jobTitleKeywords: ['senior'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://example.com', 'Senior Engineer');
    expect(result?.id).toBe(v.id);
  });

  it('resolveVariantForContext matches by jdKeywords', async () => {
    const v = makeVariant({ matchRules: { jdKeywords: ['bangalore'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://example.com', undefined, 'Located in Bangalore');
    expect(result?.id).toBe(v.id);
  });

  it('higher priority (lower number) variant wins over lower priority', async () => {
    const vHigh = makeVariant({ id: 'high', priority: 1, matchRules: { sites: ['jobs.com'] } });
    const vLow  = makeVariant({ id: 'low',  priority: 2, matchRules: { sites: ['jobs.com'] } });
    await saveVariant(vLow);
    await saveVariant(vHigh);
    const result = await resolveVariantForContext('https://jobs.com/apply');
    expect(result?.id).toBe('high');
  });

  it('returns null when no patterns match', async () => {
    const v = makeVariant({ matchRules: { sites: ['wellfound.com'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://linkedin.com/jobs/123');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/variants/store.test.ts
```

Expected: multiple failures — `Cannot find module './store'`

- [ ] **Step 3: Create `src/features/variants/store.ts`**

```ts
import { db } from '@/shared/storage/db';
import type { Variant } from '@/shared/schema/variant';

export async function listVariants(): Promise<Variant[]> {
  const all = await db.variants.toArray();
  return all.sort((a, b) => a.priority - b.priority);
}

export async function saveVariant(variant: Variant): Promise<Variant> {
  const record = { ...variant, updatedAt: Date.now() };
  await db.variants.put(record);
  return record;
}

export async function deleteVariant(id: string): Promise<void> {
  await db.variants.delete(id);
}

export async function resolveVariantForContext(
  url: string,
  jobTitle?: string,
  jdText?: string,
): Promise<Variant | null> {
  const variants = await listVariants(); // already sorted by priority asc
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { /* ignore bad URLs */ }

  for (const v of variants) {
    const { sites = [], jobTitleKeywords = [], jdKeywords = [] } = v.matchRules;

    if (hostname && sites.some((s) => hostname.includes(s))) return v;

    if (jobTitle) {
      const titleLower = jobTitle.toLowerCase();
      if (jobTitleKeywords.some((k) => titleLower.includes(k.toLowerCase()))) return v;
    }

    if (jdText) {
      const jdLower = jdText.toLowerCase();
      if (jdKeywords.some((k) => jdLower.includes(k.toLowerCase()))) return v;
    }
  }

  return null;
}
```

- [ ] **Step 4: Create `src/features/variants/index.ts`**

```ts
export { listVariants, saveVariant, deleteVariant, resolveVariantForContext } from './store';
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/features/variants/store.test.ts
```

Expected: 8 tests passing, 0 failing

- [ ] **Step 6: Commit**

```bash
git add src/features/variants/
git commit -m "feat(variants): add store with CRUD and resolveVariantForContext"
```

---

## Task 2 — Messaging types + background handlers

**Files:**
- Modify: `src/shared/messaging/types.ts`
- Modify: `src/background/handlers.ts`

### Context

The messaging bus uses a discriminated union (`Message`) and a `ResponseMap`. Adding a new message requires both. Background handlers call `registerHandler(type, fn)`.

- [ ] **Step 1: Add variant message types to `src/shared/messaging/types.ts`**

Add the import at the top of the file (after the existing imports):

```ts
import type { Variant } from '@/shared/schema/variant';
```

Add to the `Message` union (after the `settings/add-ignore-pattern` line):

```ts
  // variants
  | MessageEnvelope<'variant/list'>
  | MessageEnvelope<'variant/save', { variant: Variant }>
  | MessageEnvelope<'variant/delete', { id: string }>
  | MessageEnvelope<'variant/resolve', { url: string; jobTitle?: string; jdText?: string }>
```

Add to `ResponseMap` (after `'settings/add-ignore-pattern': Settings;`):

```ts
  'variant/list': Variant[];
  'variant/save': Variant;
  'variant/delete': void;
  'variant/resolve': Variant | null;
```

- [ ] **Step 2: Register handlers in `src/background/handlers.ts`**

Add import at the top:

```ts
import { listVariants, saveVariant, deleteVariant, resolveVariantForContext } from '@/features/variants';
```

Add inside `registerAllHandlers()` (after the `settings/add-ignore-pattern` handler):

```ts
  registerHandler('variant/list', () => listVariants());
  registerHandler('variant/save', ({ variant }) => saveVariant(variant));
  registerHandler('variant/delete', ({ id }) => deleteVariant(id));
  registerHandler('variant/resolve', ({ url, jobTitle, jdText }) =>
    resolveVariantForContext(url, jobTitle, jdText));
```

- [ ] **Step 3: Typecheck**

```
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/shared/messaging/types.ts src/background/handlers.ts
git commit -m "feat(variants): add messaging types and background handlers"
```

---

## Task 3 — Autofill engine: variant merge

**Files:**
- Modify: `src/features/autofill/engine.ts`
- Create: `src/features/autofill/engine.test.ts`

### Context

`buildMappings(root, profile, url?)` currently resolves all field values from `profile`. When a variant is active, the engine should first merge `variant.overrides` on top of `profile`, then resolve values from the merged result. For scalar fields (strings, numbers), the variant value wins. For array fields (`workExperience`, `education`, `skills`, etc.), the variant's array replaces the entire base array if present.

- [ ] **Step 1: Write the failing tests**

Create `src/features/autofill/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeProfileWithVariant } from './engine';
import { createEmptyProfile } from '@/shared/schema/profile';
import type { Variant } from '@/shared/schema/variant';

const baseProfile = createEmptyProfile('Base');
const makeVariant = (overrides: Variant['overrides']): Variant => ({
  id: 'v1',
  baseProfileId: baseProfile.id,
  name: 'Test',
  priority: 1,
  matchRules: {},
  overrides,
  createdAt: 0,
  updatedAt: 0,
});

describe('mergeProfileWithVariant', () => {
  it('returns base profile unchanged when variant is null', () => {
    const result = mergeProfileWithVariant(baseProfile, null);
    expect(result).toBe(baseProfile);
  });

  it('variant scalar override wins over base', () => {
    const profile = { ...baseProfile, firstName: 'Alice' };
    const variant = makeVariant({ firstName: 'Bob' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.firstName).toBe('Bob');
  });

  it('base value used when variant does not override that field', () => {
    const profile = { ...baseProfile, email: 'a@b.com', firstName: 'Alice' };
    const variant = makeVariant({ firstName: 'Bob' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.email).toBe('a@b.com');
  });

  it('variant skills array replaces base skills', () => {
    const profile = { ...baseProfile, skills: ['JS', 'TS'] };
    const variant = makeVariant({ skills: ['Python'] });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.skills).toEqual(['Python']);
  });

  it('base skills preserved when variant has no skills override', () => {
    const profile = { ...baseProfile, skills: ['JS', 'TS'] };
    const variant = makeVariant({ summary: 'New summary' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.skills).toEqual(['JS', 'TS']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/autofill/engine.test.ts
```

Expected: FAIL — `mergeProfileWithVariant is not exported from './engine'`

- [ ] **Step 3: Add `mergeProfileWithVariant` to `src/features/autofill/engine.ts`**

Add this import at the top of `engine.ts` (after the existing imports):

```ts
import type { Variant } from '@/shared/schema/variant';
```

Add this function before `buildMappings`:

```ts
export function mergeProfileWithVariant(base: Profile, variant: Variant | null): Profile {
  if (!variant) return base;
  return { ...base, ...variant.overrides };
}
```

- [ ] **Step 4: Update `buildMappings` signature to accept an optional variant**

Replace the existing `buildMappings` function signature and body:

```ts
export function buildMappings(
  root: ParentNode,
  profile: Profile,
  url?: string,
  variant?: Variant | null,
): FieldMapping[] {
  const merged = mergeProfileWithVariant(profile, variant ?? null);
  let candidates: FieldCandidate[] = discover(root);

  if (url) {
    const adapter = findAdapter(url);
    if (adapter) {
      candidates = adapter.overrideFieldMap(candidates);
    }
  }

  const mappings = identify(candidates);
  for (const m of mappings) {
    if (m.key !== 'unknown') {
      m.value = resolveValue(m.key, merged);
    }
  }
  return mappings;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/features/autofill/engine.test.ts
```

Expected: 5 tests passing, 0 failing

- [ ] **Step 6: Typecheck**

```
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/features/autofill/engine.ts src/features/autofill/engine.test.ts
git commit -m "feat(variants): add mergeProfileWithVariant and extend buildMappings"
```

---

## Task 4 — Content script: resolve and apply variant

**Files:**
- Modify: `src/content/index.ts`

### Context

`content/index.ts` already has `currentProfile` and `currentMappings` module-level variables. The `parseJobMeta` result is passed to `mountApplyDetector`'s `onDetected` callback. We need to:
1. Add a `currentVariant: Variant | null` module-level variable
2. After `parseJobMeta` is available (in `onDetected`), send `variant/resolve` to the background
3. Pass `currentVariant` into `buildMappings`
4. Re-run `buildMappings` (via `refresh`) when the variant changes

- [ ] **Step 1: Modify `src/content/index.ts`**

Add the Variant import at the top (with existing imports):

```ts
import type { Variant } from '@/shared/schema/variant';
```

Add `currentVariant` module-level variable (after `currentMappings`):

```ts
let currentVariant: Variant | null = null;
```

Update the `refresh` function to pass `currentVariant` into `buildMappings`:

```ts
async function refresh(): Promise<void> {
  if (!currentProfile) {
    currentProfile = await sendMessage('profile/get-active', undefined as never);
  }
  if (!currentProfile) {
    pill.setCount(0);
    return;
  }
  currentMappings = buildMappings(document.body, currentProfile, location.href, currentVariant);
  const fillable = currentMappings.filter((m) => m.key !== 'unknown' && m.value).length;
  pill.setCount(fillable);
}
```

Update the `mountDetector` function's `onDetected` callback to resolve the variant:

```ts
    onDetected: (meta) => {
      // Resolve variant in background using parsed job metadata, then re-run fill mapping
      void sendMessage('variant/resolve', {
        url: location.href,
        jobTitle: meta.title,
        jdText: meta.jdText,
      }).then((v) => {
        currentVariant = v;
        void refresh();
      });

      openApplyBanner(
        meta,
        () => {
          void sendMessage('tracker/auto-apply', {
            url: location.href,
            title: document.title,
            meta,
          });
        },
        () => {
          void sendMessage('settings/add-ignore-pattern', {
            pattern: location.hostname,
          });
        },
      );
    },
```

Also update the `content/open-preview` message listener to pass `currentVariant`:

```ts
chrome.runtime.onMessage.addListener((msg: { type: string }, _sender, sendResponse) => {
  if (msg.type === 'content/open-preview') {
    if (currentProfile) {
      openPreview(currentMappings, (keys) => {
        const result = applyFill(document.body, currentMappings, keys);
        sendResponse({ ok: true, value: result });
      }, currentProfile);
      return true;
    }
    sendResponse({ ok: false, error: 'no profile' });
    return false;
  }
  return false;
});
```

(No change needed to the listener itself — `currentMappings` is already built with the variant.)

- [ ] **Step 2: Typecheck**

```
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/content/index.ts
git commit -m "feat(variants): resolve active variant in content script after job detection"
```

---

## Task 5 — Workday adapter

**Files:**
- Create: `src/features/autofill/adapters/workday.ts`
- Create: `src/features/autofill/adapters/workday.test.ts`
- Modify: `src/features/autofill/adapters/index.ts`

### Context

Workday ATS uses `data-automation-id` attributes on form inputs. The adapter reads this attribute and overrides the candidate's `label` field with human-readable text that matches the autofill dictionary's synonym lists. `overrideFieldMap` mutates the candidate label so `identify()` can match it — this is the same pattern as `lever.ts`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/autofill/adapters/workday.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { workdayAdapter } from './workday';
import type { FieldCandidate } from '../types';

function makeCandidate(automationId: string): FieldCandidate {
  const el = document.createElement('input');
  el.setAttribute('data-automation-id', automationId);
  return {
    element: el,
    kind: 'text',
    label: '',
    ariaLabel: '',
    name: '',
    id: '',
    placeholder: '',
    nearbyText: '',
    fieldsetLegend: '',
  };
}

describe('workdayAdapter', () => {
  describe('matches', () => {
    it('matches myworkdayjobs.com URLs', () => {
      expect(workdayAdapter.matches('https://amazon.wd3.myworkday.com/amazon/job/12345')).toBe(true);
      expect(workdayAdapter.matches('https://microsoft.myworkdayjobs.com/en-US/microsoft_careers')).toBe(true);
    });

    it('does not match other URLs', () => {
      expect(workdayAdapter.matches('https://linkedin.com/jobs')).toBe(false);
      expect(workdayAdapter.matches('https://greenhouse.io/jobs/123')).toBe(false);
    });
  });

  describe('overrideFieldMap', () => {
    it('overrides label for legalNameSection_firstName', () => {
      const candidates = [makeCandidate('legalNameSection_firstName')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('first name');
    });

    it('overrides label for legalNameSection_lastName', () => {
      const candidates = [makeCandidate('legalNameSection_lastName')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('last name');
    });

    it('overrides label for email', () => {
      const candidates = [makeCandidate('email')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('email');
    });

    it('overrides label for phone-number', () => {
      const candidates = [makeCandidate('phone-number')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('phone');
    });

    it('overrides label for addressSection_city', () => {
      const candidates = [makeCandidate('addressSection_city')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('city');
    });

    it('leaves unknown automation-id candidates unchanged', () => {
      const candidates = [makeCandidate('howDidYouHearAboutUs')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('');
    });

    it('handles candidates with no automation-id attribute', () => {
      const el = document.createElement('input');
      const candidate: FieldCandidate = {
        element: el, kind: 'text', label: 'First name',
        ariaLabel: '', name: '', id: '', placeholder: '', nearbyText: '', fieldsetLegend: '',
      };
      const result = workdayAdapter.overrideFieldMap([candidate]);
      expect(result[0].label).toBe('First name');
    });
  });

  describe('parseJob', () => {
    it('extracts title from og:title and company from og:site_name', () => {
      const doc = document.implementation.createHTMLDocument('');
      const ogTitle = doc.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', 'Software Engineer');
      const ogSite = doc.createElement('meta');
      ogSite.setAttribute('property', 'og:site_name');
      ogSite.setAttribute('content', 'Amazon');
      doc.head.append(ogTitle, ogSite);

      const result = workdayAdapter.parseJob!(doc);
      expect(result.title).toBe('Software Engineer');
      expect(result.company).toBe('Amazon');
    });

    it('returns empty partial when no metadata present', () => {
      const doc = document.implementation.createHTMLDocument('');
      const result = workdayAdapter.parseJob!(doc);
      expect(result.title).toBeUndefined();
      expect(result.company).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/autofill/adapters/workday.test.ts
```

Expected: FAIL — `Cannot find module './workday'`

- [ ] **Step 3: Create `src/features/autofill/adapters/workday.ts`**

```ts
import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const AUTOMATION_LABEL_MAP: Record<string, string> = {
  legalNameSection_firstName: 'first name',
  legalNameSection_lastName: 'last name',
  email: 'email',
  'phone-number': 'phone',
  addressSection_city: 'city',
  addressSection_countryRegion: 'state',
  addressSection_country: 'country',
  addressSection_postalCode: 'zip',
  linkedIn: 'linkedin url',
  website: 'website',
};

export const workdayAdapter: SiteAdapter = {
  name: 'workday',

  matches(url: string): boolean {
    return /myworkdayjobs\.com|wd[35]?\.myworkday\.com/i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const automationId = f.element.getAttribute('data-automation-id') ?? '';
      const labelOverride = AUTOMATION_LABEL_MAP[automationId];
      return labelOverride ? { ...f, label: labelOverride } : f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    const result: Partial<JobMeta> = {};
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (title) result.title = title;
    const company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
    if (company) result.company = company;
    return result;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/features/autofill/adapters/workday.test.ts
```

Expected: 11 tests passing, 0 failing

- [ ] **Step 5: Register in `src/features/autofill/adapters/index.ts`**

Add the import:

```ts
import { workdayAdapter } from './workday';
```

Add to `ADAPTERS` array:

```ts
export const ADAPTERS: SiteAdapter[] = [
  linkedinAdapter,
  naukriAdapter,
  wellfoundAdapter,
  greenhouseAdapter,
  leverAdapter,
  workdayAdapter,
];
```

- [ ] **Step 6: Typecheck**

```
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/features/autofill/adapters/workday.ts src/features/autofill/adapters/workday.test.ts src/features/autofill/adapters/index.ts
git commit -m "feat(adapters): add Workday ATS adapter"
```

---

## Task 6 — Ashby adapter

**Files:**
- Create: `src/features/autofill/adapters/ashby.ts`
- Create: `src/features/autofill/adapters/ashby.test.ts`
- Modify: `src/features/autofill/adapters/index.ts`

### Context

Ashby uses `name` attributes on form inputs (e.g. `firstName`, `email`, `linkedInUrl`). The adapter maps these names to human-readable labels. `parseJob` tries JSON-LD `JobPosting` first, then falls back to `og:title`/`og:site_name`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/autofill/adapters/ashby.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ashbyAdapter } from './ashby';
import type { FieldCandidate } from '../types';

function makeCandidate(name: string): FieldCandidate {
  const el = document.createElement('input');
  el.setAttribute('name', name);
  return {
    element: el,
    kind: 'text',
    label: '',
    ariaLabel: '',
    name,
    id: '',
    placeholder: '',
    nearbyText: '',
    fieldsetLegend: '',
  };
}

describe('ashbyAdapter', () => {
  describe('matches', () => {
    it('matches jobs.ashbyhq.com URLs', () => {
      expect(ashbyAdapter.matches('https://jobs.ashbyhq.com/acme/abc123')).toBe(true);
    });
    it('does not match other URLs', () => {
      expect(ashbyAdapter.matches('https://linkedin.com/jobs')).toBe(false);
    });
  });

  describe('overrideFieldMap', () => {
    it('maps firstName name attribute to "first name" label', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('firstName')]);
      expect(result[0].label).toBe('first name');
    });
    it('maps email name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('email')]);
      expect(result[0].label).toBe('email');
    });
    it('maps linkedInUrl name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('linkedInUrl')]);
      expect(result[0].label).toBe('linkedin url');
    });
    it('maps githubUrl name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('githubUrl')]);
      expect(result[0].label).toBe('github url');
    });
    it('leaves unknown name attributes unchanged', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('coverLetter')]);
      expect(result[0].label).toBe('');
    });
  });

  describe('parseJob', () => {
    it('extracts from JSON-LD JobPosting', () => {
      const doc = document.implementation.createHTMLDocument('');
      const script = doc.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@type': 'JobPosting',
        title: 'Frontend Engineer',
        hiringOrganization: { name: 'Acme Corp' },
      });
      doc.head.append(script);

      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBe('Frontend Engineer');
      expect(result.company).toBe('Acme Corp');
    });

    it('falls back to og:title / og:site_name when no JSON-LD', () => {
      const doc = document.implementation.createHTMLDocument('');
      const ogTitle = doc.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', 'Backend Engineer');
      const ogSite = doc.createElement('meta');
      ogSite.setAttribute('property', 'og:site_name');
      ogSite.setAttribute('content', 'Startup Inc');
      doc.head.append(ogTitle, ogSite);

      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBe('Backend Engineer');
      expect(result.company).toBe('Startup Inc');
    });

    it('returns empty partial when no metadata', () => {
      const doc = document.implementation.createHTMLDocument('');
      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBeUndefined();
      expect(result.company).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/autofill/adapters/ashby.test.ts
```

Expected: FAIL — `Cannot find module './ashby'`

- [ ] **Step 3: Create `src/features/autofill/adapters/ashby.ts`**

```ts
import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const NAME_LABEL_MAP: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  phone: 'phone',
  linkedInUrl: 'linkedin url',
  githubUrl: 'github url',
  websiteUrl: 'website',
};

export const ashbyAdapter: SiteAdapter = {
  name: 'ashby',

  matches(url: string): boolean {
    return /jobs\.ashbyhq\.com/i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const labelOverride = NAME_LABEL_MAP[f.name];
      return labelOverride ? { ...f, label: labelOverride } : f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    // Try JSON-LD JobPosting first
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent ?? '') as Record<string, unknown>;
        if (data['@type'] === 'JobPosting') {
          return {
            title: data['title'] as string | undefined,
            company: (data['hiringOrganization'] as Record<string, string> | undefined)?.name,
          };
        }
      } catch { /* continue to next script */ }
    }

    // Fallback: og:title / og:site_name
    const result: Partial<JobMeta> = {};
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (title) result.title = title;
    const company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
    if (company) result.company = company;
    return result;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/features/autofill/adapters/ashby.test.ts
```

Expected: 10 tests passing, 0 failing

- [ ] **Step 5: Register in `src/features/autofill/adapters/index.ts`**

Add the import:

```ts
import { ashbyAdapter } from './ashby';
```

Add to `ADAPTERS` array:

```ts
export const ADAPTERS: SiteAdapter[] = [
  linkedinAdapter,
  naukriAdapter,
  wellfoundAdapter,
  greenhouseAdapter,
  leverAdapter,
  workdayAdapter,
  ashbyAdapter,
];
```

- [ ] **Step 6: Commit**

```bash
git add src/features/autofill/adapters/ashby.ts src/features/autofill/adapters/ashby.test.ts src/features/autofill/adapters/index.ts
git commit -m "feat(adapters): add Ashby ATS adapter"
```

---

## Task 7 — Options: Variants management UI

**Files:**
- Modify: `src/options/router.ts`
- Modify: `src/options/App.tsx`
- Create: `src/options/views/VariantsView.tsx`

### Context

The options router uses a hash-based routing system (`#/profile`, `#/applications`, `#/settings`). `Route` is a union type; `ROUTES` is a readonly array; `parseHash` uses a regex. All three must be updated. The nav uses `rb-*` token classes with `Icon` components — available icon names include `sliders` (best fit for variants).

The `VariantsView` follows the same page pattern as `ApplicationsView`: a page header, then content. Variants are created/edited with an inline form (same card+form pattern as `WorkExperienceSection`). Each variant card shows: name, priority, match rules summary, overrides summary, Edit and Delete buttons.

The **Edit form** fields:
- Name (text, required)
- Priority (number, 1–99)
- Sites (text, comma-separated hostnames, e.g. `wellfound.com, angel.co`)
- Job title keywords (text, comma-separated)
- JD keywords (text, comma-separated)
- Summary override (textarea, optional)
- Headline override (text, optional)
- Skills override (text, comma-separated, optional — empty = don't override)

For simplicity, Phase 4 only exposes the most commonly-overridden fields (summary, headline, skills) in the form. Full profile field overrides can be added in a future phase.

- [ ] **Step 1: Update `src/options/router.ts`**

Replace the entire file:

```ts
import { useEffect, useState } from 'react';

export type Route = 'profile' | 'applications' | 'settings' | 'variants';
const ROUTES: readonly Route[] = ['profile', 'applications', 'settings', 'variants'] as const;

function parseHash(): Route {
  const m = location.hash.match(/^#\/(profile|applications|settings|variants)/);
  return (m?.[1] as Route | undefined) ?? 'profile';
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parseHash());
  useEffect(() => {
    if (location.hash === '' || location.hash === '#') {
      location.hash = '#/profile';
    }
  }, []);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (r: Route) => {
    if (!ROUTES.includes(r)) return;
    location.hash = `#/${r}`;
  };
  return [route, go];
}
```

- [ ] **Step 2: Update `src/options/App.tsx`**

Add the VariantsView import (with existing view imports):

```ts
import { VariantsView } from './views/VariantsView';
```

Update the `NAV` array — add variants after applications:

```ts
type NavItem = { key: Route; label: string; icon: 'user' | 'briefcase' | 'gear' | 'sliders' };

const NAV: NavItem[] = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'applications', label: 'Applications', icon: 'briefcase' },
  { key: 'variants', label: 'Variants', icon: 'sliders' },
  { key: 'settings', label: 'Settings', icon: 'gear' },
];
```

Add the render in the `<main>` section (after `route === 'applications'`):

```tsx
{route === 'variants' && <VariantsView />}
```

- [ ] **Step 3: Create `src/options/views/VariantsView.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import { Icon } from '@/shared/ui/Icon';
import type { Variant } from '@/shared/schema/variant';

const EMPTY_FORM = {
  name: '',
  priority: 1,
  sites: '',
  jobTitleKeywords: '',
  jdKeywords: '',
  summary: '',
  headline: '',
  skills: '',
};

type FormState = typeof EMPTY_FORM;

function variantToForm(v: Variant): FormState {
  return {
    name: v.name,
    priority: v.priority,
    sites: (v.matchRules.sites ?? []).join(', '),
    jobTitleKeywords: (v.matchRules.jobTitleKeywords ?? []).join(', '),
    jdKeywords: (v.matchRules.jdKeywords ?? []).join(', '),
    summary: v.overrides.summary ?? '',
    headline: v.overrides.headline ?? '',
    skills: (v.overrides.skills ?? []).join(', '),
  };
}

function formToVariant(form: FormState, existing?: Variant): Variant {
  const now = Date.now();
  const splitTrim = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    id: existing?.id ?? crypto.randomUUID(),
    baseProfileId: existing?.baseProfileId ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    name: form.name.trim(),
    priority: Number(form.priority) || 1,
    matchRules: {
      sites: splitTrim(form.sites),
      jobTitleKeywords: splitTrim(form.jobTitleKeywords),
      jdKeywords: splitTrim(form.jdKeywords),
    },
    overrides: {
      ...(form.summary ? { summary: form.summary } : {}),
      ...(form.headline ? { headline: form.headline } : {}),
      ...(form.skills ? { skills: splitTrim(form.skills) } : {}),
    },
  };
}

const inputCls =
  'w-full rounded-lg border border-rb-border bg-rb-surface px-3 py-2 text-sm text-rb-text placeholder:text-rb-muted focus:outline-none focus:border-rb-accent';
const labelCls = 'text-xs text-rb-muted font-medium mb-1 block';

export function VariantsView() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editing, setEditing] = useState<Variant | null | 'new'>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const list = await sendMessage('variant/list', undefined as never);
    setVariants(list);
  };

  useEffect(() => { void load(); }, []);

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
  };

  const startEdit = (v: Variant) => {
    setForm(variantToForm(v));
    setEditing(v);
  };

  const cancel = () => { setEditing(null); setError(null); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    try {
      const variant = formToVariant(form, editing === 'new' ? undefined : (editing ?? undefined));
      await sendMessage('variant/save', { variant });
      await load();
      setEditing(null);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  const remove = async (id: string) => {
    await sendMessage('variant/delete', { id });
    await load();
  };

  const field = (key: keyof FormState) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">Variants</div>
          <h1 className="font-display text-5xl font-normal tracking-tight leading-tight text-rb-text m-0">
            Tailored <em className="italic" style={{ color: 'hsl(var(--rb-accent))' }}>profiles</em>
          </h1>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[9px] text-xs font-medium border border-rb-border2 bg-rb-surface text-rb-text cursor-pointer"
        >
          <Icon name="plus" size={13} />
          New variant
        </button>
      </div>

      <p className="text-sm text-rb-muted max-w-prose leading-relaxed m-0">
        Variants override specific profile fields for certain job sites or role types.
        The highest-priority matching variant activates automatically when you visit a matched page.
      </p>

      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

      {/* Inline form for new or editing */}
      {editing !== null && (
        <div
          className="rounded-2xl border border-rb-border p-5 space-y-4"
          style={{ background: 'hsl(var(--rb-surface2))' }}
        >
          <div className="text-sm font-semibold text-rb-text">
            {editing === 'new' ? 'New variant' : `Edit: ${(editing as Variant).name}`}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} placeholder="e.g. Startup roles" {...field('name')} />
            </div>
            <div>
              <label className={labelCls}>Priority (lower wins)</label>
              <input type="number" min={1} max={99} className={inputCls} {...field('priority')} />
            </div>
          </div>

          <div className="text-xs font-mono text-rb-muted uppercase tracking-widest pt-1">Match rules</div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Sites (comma-separated hostnames)</label>
              <input className={inputCls} placeholder="wellfound.com, angel.co" {...field('sites')} />
            </div>
            <div>
              <label className={labelCls}>Job title keywords</label>
              <input className={inputCls} placeholder="senior, staff, principal" {...field('jobTitleKeywords')} />
            </div>
            <div>
              <label className={labelCls}>JD keywords</label>
              <input className={inputCls} placeholder="series a, early stage" {...field('jdKeywords')} />
            </div>
          </div>

          <div className="text-xs font-mono text-rb-muted uppercase tracking-widest pt-1">Field overrides (leave blank to use base profile)</div>
          <div>
            <label className={labelCls}>Headline</label>
            <input className={inputCls} placeholder="e.g. Full-Stack Engineer · Startups" {...field('headline')} />
          </div>
          <div>
            <label className={labelCls}>Summary</label>
            <textarea rows={4} className={inputCls} placeholder="Tailored professional summary…" {...field('summary')} />
          </div>
          <div>
            <label className={labelCls}>Skills (comma-separated, replaces all base skills)</label>
            <input className={inputCls} placeholder="React, TypeScript, Node.js" {...field('skills')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              style={{ background: 'hsl(var(--rb-accent))' }}
            >
              Save variant
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-rb-border bg-rb-surface text-rb-muted cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variants list */}
      {variants.length === 0 && editing === null ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'hsl(var(--rb-surface2))', border: '1px solid hsl(var(--rb-border))' }}
          >
            <Icon name="sliders" size={22} color="hsl(var(--rb-muted))" />
          </div>
          <p className="text-sm text-rb-muted max-w-xs leading-relaxed">
            No variants yet. Create one to tailor your profile for specific job sites or role types.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v) => {
            const overrideKeys = Object.keys(v.overrides).filter(
              (k) => {
                const val = v.overrides[k as keyof typeof v.overrides];
                return Array.isArray(val) ? (val as unknown[]).length > 0 : Boolean(val);
              }
            );
            const siteList = (v.matchRules.sites ?? []).join(', ');
            const kwList = [...(v.matchRules.jobTitleKeywords ?? []), ...(v.matchRules.jdKeywords ?? [])].join(', ');
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-rb-border px-5 py-4 flex items-start justify-between gap-4"
                style={{ background: 'hsl(var(--rb-surface))' }}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-rb-text">{v.name}</span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'hsl(var(--rb-surface2))', color: 'hsl(var(--rb-muted))' }}
                    >
                      priority {v.priority}
                    </span>
                  </div>
                  {siteList && (
                    <div className="text-xs text-rb-muted truncate">Sites: {siteList}</div>
                  )}
                  {kwList && (
                    <div className="text-xs text-rb-muted truncate">Keywords: {kwList}</div>
                  )}
                  {overrideKeys.length > 0 && (
                    <div className="text-xs text-rb-muted">
                      Overrides: {overrideKeys.join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 rounded-lg border border-rb-border bg-rb-surface2 text-rb-muted hover:text-rb-text cursor-pointer"
                    title="Edit"
                  >
                    <Icon name="sliders" size={13} />
                  </button>
                  <button
                    onClick={() => void remove(v.id)}
                    className="p-2 rounded-lg border border-rb-border bg-rb-surface2 text-rb-muted hover:text-red-500 cursor-pointer"
                    title="Delete"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```
npm run typecheck
```

Expected: 0 errors

- [ ] **Step 5: Run full test suite**

```
npm test
```

Expected: all tests passing (no regressions)

- [ ] **Step 6: Commit**

```bash
git add src/options/router.ts src/options/App.tsx src/options/views/VariantsView.tsx
git commit -m "feat(variants): add Variants nav and management UI in options"
```

---

## Task 8 — Update docs

**Files:**
- Modify: `docs/features.md`

- [ ] **Step 1: Update Phase 3 status to ✅ SHIPPED in `docs/features.md`**

Replace the Phase 3 section header:

```md
## Phase 3 — Apply Detection ✅ SHIPPED
```

- [ ] **Step 2: Update Phase 4 section**

Replace the Phase 4 backlog entry:

```md
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
```

- [ ] **Step 3: Commit**

```bash
git add docs/features.md
git commit -m "docs: mark Phase 3 shipped, add Phase 4 feature summary"
```

---

## Definition of Done

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm test` passes — all existing + new tests green
- [ ] `npm run build` produces a loadable extension
- [ ] Creating a variant with `sites: ['wellfound.com']` activates it on `wellfound.com` (verify via popup)
- [ ] Autofill on a matched site uses variant `skills` override, not base profile skills
- [ ] VariantsView lists, creates (with site + keyword rules), edits, and deletes variants
- [ ] Workday adapter: `matches` returns true for `myworkdayjobs.com` URLs, false for LinkedIn
- [ ] Ashby adapter: `matches` returns true for `jobs.ashbyhq.com` URLs, `parseJob` reads JSON-LD

---

## Order of execution

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Tasks 5 and 6 (adapters) can run in parallel after Task 2 is done.
Task 7 (Options UI) depends on Task 2 (messaging) but not on Tasks 5/6.

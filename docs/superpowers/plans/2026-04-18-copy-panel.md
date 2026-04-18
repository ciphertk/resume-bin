# Copy Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible "Copy details" panel to the extension popup so users can one-click-copy any profile field when autofill fails to detect it.

**Architecture:** A new `CopyPanel.tsx` component derives a flat list of copyable fields from the active `Profile` via a pure `buildCopyFields()` function, renders a collapsible section with per-row Copy buttons, and manages its own open/copiedKey state. `App.tsx` fetches the profile alongside the existing tab-info fetch and passes it down. No new message types or background handlers are needed.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS, `navigator.clipboard`, `chrome.runtime.sendMessage` (existing typed bus).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/popup/CopyPanel.tsx` | **Create** | Collapsible copy panel component + `buildCopyFields` helper |
| `src/popup/CopyPanel.test.ts` | **Create** | Unit tests for `buildCopyFields` |
| `src/popup/App.tsx` | **Modify** | Fetch profile, render `<CopyPanel>` |

---

### Task 1: `buildCopyFields` — TDD

**Files:**
- Create: `src/popup/CopyPanel.test.ts`
- Create: `src/popup/CopyPanel.tsx` (minimal — just the function export)

The `buildCopyFields` function is pure (no side effects, no React). Test it first.

- [ ] **Step 1: Write the failing test**

Create `src/popup/CopyPanel.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildCopyFields } from './CopyPanel';
import type { Profile } from '@/shared/schema/profile';

function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Default',
    isDefault: true,
    firstName: 'Tanay',
    lastName: 'Khobragade',
    email: 'tanay@example.com',
    phone: '+91 99999 00000',
    location: { city: 'Pune', state: 'MH', country: 'India' },
    headline: 'Full stack engineer',
    summary: 'I build things.',
    linkedinUrl: 'https://linkedin.com/in/tanay',
    githubUrl: 'https://github.com/tanay',
    portfolioUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    workAuthorization: '',
    skills: ['React', 'TypeScript', 'Node.js'],
    workExperience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('buildCopyFields', () => {
  it('includes core contact fields', () => {
    const fields = buildCopyFields(makeProfile());
    const keys = fields.map((f) => f.key);
    expect(keys).toContain('firstName');
    expect(keys).toContain('email');
    expect(keys).toContain('phone');
  });

  it('includes a fullName entry', () => {
    const fields = buildCopyFields(makeProfile());
    const full = fields.find((f) => f.key === 'fullName');
    expect(full?.value).toBe('Tanay Khobragade');
  });

  it('excludes fields with empty string values', () => {
    const fields = buildCopyFields(makeProfile());
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('portfolioUrl');
    expect(keys).not.toContain('websiteUrl');
    expect(keys).not.toContain('twitterUrl');
    expect(keys).not.toContain('workAuthorization');
  });

  it('joins skills as comma-separated string', () => {
    const fields = buildCopyFields(makeProfile());
    const skills = fields.find((f) => f.key === 'skills');
    expect(skills?.value).toBe('React, TypeScript, Node.js');
  });

  it('excludes skills when array is empty', () => {
    const fields = buildCopyFields(makeProfile({ skills: [] }));
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('skills');
  });

  it('formats noticePeriodDays as "<n> days"', () => {
    const fields = buildCopyFields(makeProfile({ noticePeriodDays: 30 }));
    const notice = fields.find((f) => f.key === 'noticePeriodDays');
    expect(notice?.value).toBe('30 days');
  });

  it('excludes numeric fields when undefined', () => {
    const fields = buildCopyFields(makeProfile({ noticePeriodDays: undefined, currentCtcAnnual: undefined }));
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('noticePeriodDays');
    expect(keys).not.toContain('currentCtcAnnual');
  });

  it('stringifies CTC fields', () => {
    const fields = buildCopyFields(makeProfile({ currentCtcAnnual: 1200000 }));
    const ctc = fields.find((f) => f.key === 'currentCtcAnnual');
    expect(ctc?.value).toBe('1200000');
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npm test -- CopyPanel
```
Expected: FAIL — `buildCopyFields` not found.

- [ ] **Step 3: Create `src/popup/CopyPanel.tsx` with just the function**

```tsx
import type { Profile } from '@/shared/schema/profile';

export interface CopyField {
  key: string;
  label: string;
  value: string;
}

export function buildCopyFields(profile: Profile): CopyField[] {
  const candidates: Array<{ key: string; label: string; value: string | undefined }> = [
    { key: 'firstName',        label: 'First name',       value: profile.firstName },
    { key: 'lastName',         label: 'Last name',        value: profile.lastName },
    { key: 'fullName',         label: 'Full name',        value: `${profile.firstName} ${profile.lastName}`.trim() },
    { key: 'email',            label: 'Email',            value: profile.email },
    { key: 'phone',            label: 'Phone',            value: profile.phone },
    { key: 'city',             label: 'City',             value: profile.location.city },
    { key: 'state',            label: 'State',            value: profile.location.state },
    { key: 'country',          label: 'Country',          value: profile.location.country },
    { key: 'headline',         label: 'Headline',         value: profile.headline },
    { key: 'summary',          label: 'Summary',          value: profile.summary },
    { key: 'linkedinUrl',      label: 'LinkedIn',         value: profile.linkedinUrl },
    { key: 'githubUrl',        label: 'GitHub',           value: profile.githubUrl },
    { key: 'portfolioUrl',     label: 'Portfolio',        value: profile.portfolioUrl },
    { key: 'websiteUrl',       label: 'Website',          value: profile.websiteUrl },
    { key: 'twitterUrl',       label: 'Twitter',          value: profile.twitterUrl },
    { key: 'workAuthorization',label: 'Work authorization',value: profile.workAuthorization },
    {
      key: 'noticePeriodDays',
      label: 'Notice period',
      value: profile.noticePeriodDays !== undefined ? `${profile.noticePeriodDays} days` : undefined,
    },
    {
      key: 'currentCtcAnnual',
      label: 'Current CTC',
      value: profile.currentCtcAnnual !== undefined ? String(profile.currentCtcAnnual) : undefined,
    },
    {
      key: 'expectedCtcAnnual',
      label: 'Expected CTC',
      value: profile.expectedCtcAnnual !== undefined ? String(profile.expectedCtcAnnual) : undefined,
    },
    {
      key: 'skills',
      label: 'Skills',
      value: profile.skills.length > 0 ? profile.skills.join(', ') : undefined,
    },
  ];

  return candidates
    .filter((c): c is { key: string; label: string; value: string } =>
      typeof c.value === 'string' && c.value.trim().length > 0,
    )
    .map(({ key, label, value }) => ({ key, label, value }));
}
```

Note: the React component body will be added in Task 2. For now the file exports only `buildCopyFields` and `CopyField`.

- [ ] **Step 4: Run — verify PASS**

```bash
npm test -- CopyPanel
```
Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/popup/CopyPanel.tsx src/popup/CopyPanel.test.ts
git commit -m "feat(popup): buildCopyFields pure helper + unit tests"
```

---

### Task 2: `CopyPanel` React component

**Files:**
- Modify: `src/popup/CopyPanel.tsx` (add the component below the existing exports)

No new tests — pure UI state with no business logic.

- [ ] **Step 1: Append the React component to `src/popup/CopyPanel.tsx`**

Add these imports at the top of the file (before the existing `import type { Profile }`):

```tsx
import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';
```

Then append the component at the bottom of the file:

```tsx
interface CopyPanelProps {
  profile: Profile;
}

export function CopyPanel({ profile }: CopyPanelProps) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fields = buildCopyFields(profile);
  if (fields.length === 0) return null;

  const copy = async (field: CopyField): Promise<void> => {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopiedKey(field.key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard denied — no visible feedback
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
      <button
        className="w-full flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
        onClick={() => setOpen((o) => !o)}
      >
        <span>📋 Copy details</span>
        <span className="text-xs">{open ? '∨' : '›'}</span>
      </button>

      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto flex flex-col gap-px">
          {fields.map((field) => {
            const copied = copiedKey === field.key;
            return (
              <div
                key={field.key}
                className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors ${
                  copied
                    ? 'bg-green-950 dark:bg-green-950'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-[72px] shrink-0 text-slate-400 dark:text-slate-500 truncate">
                  {field.label}
                </span>
                <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                  {field.value}
                </span>
                <button
                  onClick={() => void copy(field)}
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    copied
                      ? 'bg-green-800 text-green-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

The full file now has: imports → `CopyField` interface → `buildCopyFields` → `CopyPanel` component.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/popup/CopyPanel.tsx
git commit -m "feat(popup): CopyPanel component — collapsible, row-green feedback"
```

---

### Task 3: Wire `CopyPanel` into `App.tsx`

**Files:**
- Modify: `src/popup/App.tsx`

- [ ] **Step 1: Replace `src/popup/App.tsx` with the updated version**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage, type TabInfo } from '@/shared/messaging';
import type { Profile } from '@/shared/schema/profile';
import { CopyPanel } from './CopyPanel';

export function App() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appliedOk, setAppliedOk] = useState<boolean>(false);

  useEffect(() => {
    sendMessage('system/active-tab-info', undefined as never)
      .then(setTab)
      .catch(() => setTab(null));
    sendMessage('profile/get-active', undefined as never)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const fill = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!active?.id) throw new Error('no active tab');
      await chrome.tabs.sendMessage(active.id, { type: 'content/open-preview' });
      window.close();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  };

  const markApplied = async (): Promise<void> => {
    if (!tab) return;
    setBusy(true);
    setMessage(null);
    try {
      await sendMessage('tracker/mark-applied', { url: tab.url, tabInfo: tab });
      setAppliedOk(true);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold text-base">resume-bin</h1>
        <button
          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙ settings
        </button>
      </header>
      <section className="text-sm">
        <div className="text-slate-500 dark:text-slate-400">Active tab</div>
        <div className="truncate">{tab?.host ?? '—'}</div>
      </section>
      <div className="space-y-2">
        <button
          className="w-full rounded bg-brand text-white px-3 py-2 text-sm disabled:opacity-50"
          disabled={busy}
          onClick={fill}
        >
          Fill this page
        </button>
        <button
          className="w-full rounded border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50"
          disabled={busy || !tab}
          onClick={markApplied}
        >
          {appliedOk ? '✓ Saved to tracker' : 'Mark this page as applied'}
        </button>
      </div>
      {message && <p className="text-xs text-red-600">{message}</p>}
      {profile && <CopyPanel profile={profile} />}
    </div>
  );
}
```

- [ ] **Step 2: Run full suite**

```bash
npm run typecheck && npm test && npm run build
```
Expected: typecheck clean, 44+ tests pass, build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/popup/App.tsx
git commit -m "feat(popup): wire CopyPanel into App — fetch profile, render below action buttons"
```

---

## Self-Review

**Spec coverage:**
- ✅ Collapsible section, closed by default — `useState(false)` for `open`
- ✅ All non-empty profile fields — `buildCopyFields` filters empty strings/undefined
- ✅ Truncated display, full value copied — `truncate` class on value span, full `field.value` to clipboard
- ✅ Skills as comma list — `profile.skills.join(', ')`
- ✅ Green row highlight for 1.5 s — `bg-green-950` + `setTimeout(() => setCopiedKey(null), 1500)`
- ✅ Unit tests for `buildCopyFields` — Task 1
- ✅ No new message types — reuses `profile/get-active`
- ✅ Silent clipboard error — `catch {}` block

**Placeholder scan:** None found.

**Type consistency:** `CopyField` defined in Task 1, imported implicitly (same file) in Task 2. `Profile` imported from `@/shared/schema/profile` in both `CopyPanel.tsx` and `App.tsx`. No mismatches.

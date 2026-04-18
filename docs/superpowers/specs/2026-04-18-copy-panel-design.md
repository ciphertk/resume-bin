# Copy Panel — Manual Fallback Feature

**Date:** 2026-04-18
**Status:** Approved

## Overview

When the autofill engine can't detect a form field, the user needs a manual fallback: open the popup, expand the "Copy details" section, click the field they need, then paste it into the form. This spec covers the design of that copy panel.

---

## User Flow

1. User is on a job application page where one or more fields weren't auto-detected.
2. User opens the extension popup (clicks toolbar icon).
3. The popup shows the existing "Fill this page" and "Mark this page as applied" buttons as normal.
4. Below those, a collapsed row labelled **"📋 Copy details"** with a chevron (›).
5. User clicks it — the section expands inline (no navigation).
6. A scrollable list appears: every non-empty profile field, one per row.
7. User clicks **Copy** on a row → clipboard receives the full value → the row flashes **green for 1.5 s** → button resets.
8. User clicks into the undetected form field → Ctrl+V / Cmd+V to paste.

---

## UI Design

### Popup layout (collapsed — default)

```
┌─────────────────────────────┐
│ resume-bin          ⚙ settings │
│ Active tab: linkedin.com    │
│ [      Fill this page      ]│
│ [ Mark this page as applied]│
│ 📋 Copy details           › │
└─────────────────────────────┘
```

### Popup layout (expanded)

```
┌─────────────────────────────┐
│ resume-bin          ⚙ settings │
│ [      Fill this page      ]│
│ [ Mark this page as applied]│
│ 📋 Copy details           ∨ │
│ ─────────────────────────── │
│ First name  Tanay    [Copy] │
│ Last name   Khobragade[Copy]│
│ Email       tanay@…  [Copy] │  ← just copied: row is green, button shows ✓
│ Phone       +91 999… [Copy] │
│ LinkedIn    linkedin… [Copy]│
│ GitHub      github.c… [Copy]│
│ Summary     Full stac…[Copy]│
│ Skills      React, Ty…[Copy]│
│  ↕ scrollable               │
└─────────────────────────────┘
```

### Row behaviour

- **Label** (left, fixed 72 px): field name in muted colour.
- **Value** (centre, flex): truncated with ellipsis in display; **full untruncated value is written to clipboard**.
- **Copy button** (right): default — blue text on dark background. After click: green background + "✓" for **1.5 s**, then reverts. Only one row highlighted at a time.
- Section has `max-height` with `overflow-y: auto` so long profiles don't overflow the popup.

---

## Fields Shown

All fields are derived from the active profile. A field is only rendered if its value is **non-empty** (non-empty string, non-zero number). Order matches the list below.

| Label | Source | Format |
|---|---|---|
| First name | `profile.firstName` | as-is |
| Last name | `profile.lastName` | as-is |
| Full name | `profile.firstName + ' ' + profile.lastName` | concatenated |
| Email | `profile.email` | as-is |
| Phone | `profile.phone` | as-is |
| City | `profile.location.city` | as-is |
| State | `profile.location.state` | as-is |
| Country | `profile.location.country` | as-is |
| Headline | `profile.headline` | as-is |
| Summary | `profile.summary` | as-is (full text copied) |
| LinkedIn URL | `profile.linkedinUrl` | as-is |
| GitHub URL | `profile.githubUrl` | as-is |
| Portfolio URL | `profile.portfolioUrl` | as-is |
| Website URL | `profile.websiteUrl` | as-is |
| Twitter URL | `profile.twitterUrl` | as-is |
| Work authorization | `profile.workAuthorization` | as-is |
| Notice period | `profile.noticePeriodDays` | `"${n} days"` |
| Current CTC | `profile.currentCtcAnnual` | `String(n)` |
| Expected CTC | `profile.expectedCtcAnnual` | `String(n)` |
| Skills | `profile.skills` | joined `", "` |

---

## Architecture

### New file: `src/popup/CopyPanel.tsx`

Self-contained component. Receives the resolved `Profile` as a prop; derives the field list internally via `buildCopyFields(profile)`. Manages its own `open` (boolean) and `copiedKey` (string | null) state.

```ts
interface CopyPanelProps {
  profile: Profile;
}
```

**`buildCopyFields(profile: Profile): { key: string; label: string; value: string }[]`**
Pure function (no side effects). Returns only entries where `value.trim()` is non-empty. Lives at the top of `CopyPanel.tsx`.

**Copy action:**
```ts
await navigator.clipboard.writeText(field.value);
setCopiedKey(field.key);
setTimeout(() => setCopiedKey(null), 1500);
```

### Modified file: `src/popup/App.tsx`

- Add a `profile` state (`Profile | null`).
- Fetch via `sendMessage('profile/get-active', undefined as never)` in the same `useEffect` that fetches tab info.
- Pass to `<CopyPanel profile={profile} />` rendered below the two action buttons (only when profile is non-null).

### No new message types

`profile/get-active` already exists in the typed bus and is handled by the background. No schema changes required.

---

## Error Handling

- If `profile/get-active` returns `null` (no profile yet), `CopyPanel` is not rendered — the collapsed row is simply absent.
- If `navigator.clipboard.writeText` throws (e.g. clipboard permission denied), the error is caught silently; the row does not turn green. No visible error state (clipboard denial is rare in extension context and unactionable).

---

## Testing

- **Unit:** `buildCopyFields` — verify fields with empty values are excluded; verify skills join; verify full name concatenation; verify numeric fields are stringified.
- **No DOM/E2E tests** in Phase 1 — the component is UI-only with no novel business logic.

---

## Out of Scope

- Searching/filtering the copy list (Phase 2+).
- Pinning frequently-copied fields to the top.
- Auto-paste directly into the focused field (requires `scripting` + focused-element API — complex, deferred).
- Right-click context menu fallback (considered and deferred).

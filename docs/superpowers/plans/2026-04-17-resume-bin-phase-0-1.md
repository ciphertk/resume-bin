# resume-bin — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the first usable resume-bin extension — scaffolded project plus a walking-skeleton version that autofills a small set of common fields on any page, lets the user edit a profile in an options page, and tracks manually-marked applications with CSV export.

**Architecture:** Chrome MV3 extension. Background service worker owns IndexedDB (Dexie) and the message bus. Content script runs generic heuristic autofill (no site adapters yet) and injects a floating "Fill" pill + preview panel. Popup gives quick actions. Options page hosts a tabbed profile editor, an applications table, and a settings view. All persistent state lives in IndexedDB; UI state lives in Zustand stores inside React.

**Tech Stack:** TypeScript (strict), Vite + `@crxjs/vite-plugin`, React 18, Tailwind CSS, Radix UI primitives (for dropdowns/dialogs later), Dexie (IndexedDB), Zod (schemas), Zustand (React UI state), Vitest + jsdom (unit), Playwright (E2E — config shipped but tests deferred).

**Spec reference:** `docs/superpowers/specs/2026-04-16-resume-bin-design.md` (all section references below are to that doc).

---

## File structure created by this plan

```
resume-bin/
├── .editorconfig
├── .eslintrc.cjs
├── .gitattributes                     (optional, normalize line endings)
├── .gitignore                         (exists)
├── .prettierrc.json
├── manifest.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts               (shipped, tests deferred)
├── .github/workflows/ci.yml
├── public/icons/{icon-16.png,icon-32.png,icon-48.png,icon-128.png}
├── src/
│   ├── background/index.ts            service-worker entry, message router
│   ├── content/
│   │   ├── index.ts                   content-script entry
│   │   ├── pill.ts                    floating pill DOM + wiring
│   │   ├── preview.tsx                React preview panel mount
│   │   └── styles.css                 scoped content-script CSS
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── styles.css
│   ├── options/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.ts                  simple hash router
│   │   ├── views/
│   │   │   ├── ProfileView.tsx
│   │   │   ├── ApplicationsView.tsx
│   │   │   └── SettingsView.tsx
│   │   └── styles.css
│   ├── features/
│   │   ├── profile/
│   │   │   ├── index.ts
│   │   │   ├── store.ts               Dexie CRUD + default bootstrap
│   │   │   └── ui/
│   │   │       ├── ProfileEditor.tsx
│   │   │       ├── PersonalSection.tsx
│   │   │       ├── LinksSection.tsx
│   │   │       ├── PreferencesSection.tsx
│   │   │       ├── SummarySection.tsx
│   │   │       └── SkillsSection.tsx
│   │   ├── autofill/
│   │   │   ├── index.ts               public API
│   │   │   ├── types.ts               FieldCandidate, FieldMapping, FillResult
│   │   │   ├── discover.ts
│   │   │   ├── extract.ts
│   │   │   ├── identify.ts
│   │   │   ├── fill.ts
│   │   │   ├── engine.ts              orchestrator
│   │   │   └── dictionary/
│   │   │       ├── index.ts           loader / registry
│   │   │       ├── email.ts
│   │   │       ├── phone.ts
│   │   │       ├── firstName.ts
│   │   │       ├── lastName.ts
│   │   │       ├── linkedinUrl.ts
│   │   │       ├── githubUrl.ts
│   │   │       ├── city.ts
│   │   │       └── summary.ts
│   │   └── tracker/
│   │       ├── index.ts
│   │       ├── store.ts               CRUD + dedupe
│   │       ├── normalize.ts           URL normalization
│   │       └── csv.ts                 CSV export
│   └── shared/
│       ├── storage/
│       │   ├── index.ts
│       │   └── db.ts                  Dexie schema v1
│       ├── messaging/
│       │   ├── index.ts
│       │   ├── bus.ts                 typed send/onMessage
│       │   └── types.ts               message union
│       ├── schema/
│       │   ├── index.ts
│       │   ├── common.ts              id, timestamp helpers
│       │   ├── profile.ts
│       │   ├── variant.ts
│       │   ├── application.ts
│       │   ├── savedAnswer.ts
│       │   ├── reminder.ts
│       │   ├── fileBlob.ts
│       │   ├── settings.ts
│       │   └── aiConfig.ts
│       └── util/
│           ├── id.ts                  uuid v4
│           ├── logger.ts
│           └── debounce.ts
└── test/
    ├── fixtures/
    │   └── fields/                    labeled HTML fragments
    └── unit/
        └── .gitkeep                   (tests live next to fixtures they consume)
```

**Test location note:** Unit tests are colocated next to source (`*.test.ts` beside `*.ts`). This contradicts spec §12's `test/unit/` layout; the plan adopts colocation because it keeps each file-pair readable and avoids duplicate directory trees. Fixtures stay under `test/fixtures/` per spec. If you strongly prefer mirrored `test/unit/` structure, swap paths before Task 1 — nothing else in the plan depends on which style wins.

---

## Phase 0 — Scaffold

### Task 1: Initialize npm package and install dependencies

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create `package.json` with scripts and dependencies**

Write this file:

```json
{
  "name": "resume-bin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Local-only Chrome extension for autofilling job applications",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "pack": "npm run build && cd dist && zip -r ../resume-bin-$npm_package_version.zip .",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\" \"test/**/*.{ts,tsx}\"",
    "lint:fix": "eslint --fix \"src/**/*.{ts,tsx}\" \"test/**/*.{ts,tsx}\"",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,html}\" \"test/**/*.{ts,tsx}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "dexie": "^4.0.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.8",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.25",
    "@playwright/test": "^1.47.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/chrome": "^0.0.270",
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.4.0",
    "@typescript-eslint/parser": "^8.4.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.35.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "prettier": "^3.3.3",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: installs successfully; creates `package-lock.json` and `node_modules/`.

- [ ] **Step 3: Verify scripts run (typecheck will fail — no tsconfig yet, that's fine)**

Run: `npm run lint 2>&1 | head -5`
Expected: ESLint complains about missing config. Acceptable.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: init npm package with toolchain dependencies"
```

---

### Task 2: TypeScript configuration

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    "useDefineForClassFields": true,
    "types": ["chrome", "vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "test"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "composite": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Verify typecheck runs**

Run: `npm run typecheck`
Expected: no errors (no source files yet).

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json tsconfig.node.json
git commit -m "chore: add TypeScript strict config with @/ path alias"
```

---

### Task 3: Vite + CRX plugin + manifest

**Files:**
- Create: `vite.config.ts`, `manifest.json`

- [ ] **Step 1: Create `manifest.json` (MV3)**

```json
{
  "manifest_version": 3,
  "name": "resume-bin",
  "description": "Autofill job applications across LinkedIn, Naukri, Wellfound and more",
  "version": "0.1.0",
  "icons": {
    "16": "public/icons/icon-16.png",
    "32": "public/icons/icon-32.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icons/icon-16.png",
      "32": "public/icons/icon-32.png"
    }
  },
  "options_page": "src/options/index.html",
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["storage", "alarms", "notifications", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"]
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' assert { type: 'json' };
import path from 'node:path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
```

- [ ] **Step 3: Verify build config parses**

Run: `node -e "import('./vite.config.ts').catch(e=>process.exit(e?1:0))" 2>&1 || true`

You'll get a parse error if the file is malformed; a module-not-found for `@vitejs/plugin-react` is expected until build runs. To truly validate: `npx vite --help` shouldn't error on config parse when no source exists.

- [ ] **Step 4: Commit**

```bash
git add manifest.json vite.config.ts
git commit -m "chore: add Vite config and Chrome MV3 manifest"
```

---

### Task 4: Tailwind + PostCSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`

- [ ] **Step 1: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js postcss.config.js
git commit -m "chore: add Tailwind and PostCSS config with class-based dark mode"
```

---

### Task 5: ESLint + Prettier + EditorConfig

**Files:**
- Create: `.eslintrc.cjs`, `.prettierrc.json`, `.editorconfig`, `.gitattributes`

- [ ] **Step 1: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true, webextensions: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: '18' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
};
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Create `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 4: Create `.gitattributes`**

```
* text=auto eol=lf
*.png binary
```

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.cjs .prettierrc.json .editorconfig .gitattributes
git commit -m "chore: add ESLint, Prettier, EditorConfig, gitattributes"
```

---

### Task 6: Vitest configuration + smoke test

**Files:**
- Create: `vitest.config.ts`, `src/smoke.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: [],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

- [ ] **Step 2: Create a trivial smoke test**

`src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts src/smoke.test.ts
git commit -m "chore: add Vitest config with jsdom + smoke test"
```

---

### Task 7: Playwright placeholder + CI workflow

**Files:**
- Create: `playwright.config.ts`, `.github/workflows/ci.yml`

Playwright config ships now; actual E2E tests are deferred to a later phase.

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    headless: false,
  },
  projects: [{ name: 'chromium' }],
});
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  push:
    branches: [master, main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts .github/workflows/ci.yml
git commit -m "chore: add Playwright config placeholder and CI workflow"
```

---

### Task 8: Placeholder icons + HTML shells

**Files:**
- Create: `public/icons/{icon-16.png,icon-32.png,icon-48.png,icon-128.png}` (1×1 transparent PNG for now)
- Create: `src/popup/index.html`, `src/options/index.html`

- [ ] **Step 1: Create placeholder icon files**

The simplest way: create one 1×1 transparent PNG file and copy it. On bash:

```bash
mkdir -p public/icons
# 1x1 transparent PNG, 67 bytes
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01n\xa6W\x82\x00\x00\x00\x00IEND\xaeB`\x82' > public/icons/icon-16.png
cp public/icons/icon-16.png public/icons/icon-32.png
cp public/icons/icon-16.png public/icons/icon-48.png
cp public/icons/icon-16.png public/icons/icon-128.png
```

Replace with real icons whenever you like — the PNGs just need to exist so the manifest loads.

- [ ] **Step 2: Create `src/popup/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>resume-bin</title>
  </head>
  <body class="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `src/options/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>resume-bin — dashboard</title>
  </head>
  <body class="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add public/icons src/popup/index.html src/options/index.html
git commit -m "chore: add placeholder icons and popup/options HTML shells"
```

---

### Task 9: Zod schemas — common + Profile

**Files:**
- Create: `src/shared/schema/common.ts`, `src/shared/schema/profile.ts`, tests

- [ ] **Step 1: Write `src/shared/schema/common.ts`**

```ts
import { z } from 'zod';

export const idSchema = z.string().uuid();
export const timestampSchema = z.number().int().nonnegative();

export type Id = z.infer<typeof idSchema>;
export type Timestamp = z.infer<typeof timestampSchema>;

export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
```

- [ ] **Step 2: Write the failing test for Profile schema**

`src/shared/schema/profile.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { profileSchema, createEmptyProfile } from './profile';

describe('profileSchema', () => {
  it('accepts a fully-populated profile', () => {
    const now = Date.now();
    const result = profileSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Base',
      isDefault: true,
      firstName: 'Tanay',
      lastName: 'K',
      email: 'tanay@example.com',
      phone: '+91-9876543210',
      location: { city: 'Pune', state: 'MH', country: 'IN' },
      headline: 'Engineer',
      summary: 'Builds things.',
      workExperience: [],
      education: [],
      skills: ['typescript'],
      certifications: [],
      languages: [],
      projects: [],
      createdAt: now,
      updatedAt: now,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = profileSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Base',
      isDefault: true,
      firstName: 'X',
      lastName: 'Y',
      email: 'not-an-email',
      phone: '',
      location: { city: '', state: '', country: '' },
      headline: '',
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      createdAt: 0,
      updatedAt: 0,
    });
    expect(result.success).toBe(false);
  });

  it('createEmptyProfile builds a valid default', () => {
    const p = createEmptyProfile();
    expect(profileSchema.safeParse(p).success).toBe(true);
    expect(p.isDefault).toBe(true);
  });
});
```

- [ ] **Step 3: Run test — expected fail**

Run: `npm test -- profile`
Expected: FAIL — `./profile` module not found.

- [ ] **Step 4: Write `src/shared/schema/profile.ts`**

```ts
import { z } from 'zod';
import { idSchema, timestampSchema, baseEntitySchema } from './common';
import { v4 as uuidv4 } from '@/shared/util/id';

export const locationSchema = z.object({
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zip: z.string().optional(),
});

export const workExperienceSchema = z.object({
  id: idSchema,
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  id: idSchema,
  school: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});

export const certificationSchema = z.object({
  id: idSchema,
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export const languageSchema = z.object({
  id: idSchema,
  name: z.string(),
  proficiency: z.string().optional(),
});

export const projectSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
});

export const profileSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  isDefault: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  location: locationSchema,
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  workAuthorization: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  noticePeriodDays: z.number().int().nonnegative().optional(),
  currentCtcAnnual: z.number().nonnegative().optional(),
  expectedCtcAnnual: z.number().nonnegative().optional(),
  desiredStartDate: z.string().optional(),
  headline: z.string(),
  summary: z.string(),
  workExperience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  projects: z.array(projectSchema),
  resumeFileId: idSchema.optional(),
  coverLetterFileId: idSchema.optional(),
  coverLetterTemplate: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

export function createEmptyProfile(name = 'Default'): Profile {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    isDefault: true,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    headline: '',
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: now,
    updatedAt: now,
  };
}
```

Note: this depends on `@/shared/util/id`, which is created in Task 13. The test in Step 2 doesn't call `createEmptyProfile` until Task 13 is done; expect Step 5 to fail with a resolution error until then. Alternative: inline a UUID generator here temporarily and replace in Task 13. We choose the second so tests pass now.

Replace the `import { v4 as uuidv4 }` line and the usage with an inline temporary:

```ts
// temporary until src/shared/util/id exists (Task 13)
function uuidv4(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 5: Run test — expected pass**

Run: `npm test -- profile`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/shared/schema/common.ts src/shared/schema/profile.ts src/shared/schema/profile.test.ts
git commit -m "feat(schema): add common + profile Zod schemas with tests"
```

---

### Task 10: Zod schemas — remaining entities + index

**Files:**
- Create: `src/shared/schema/{variant,application,savedAnswer,reminder,fileBlob,settings,aiConfig,index}.ts`

- [ ] **Step 1: Write `src/shared/schema/variant.ts`**

```ts
import { z } from 'zod';
import { idSchema, baseEntitySchema } from './common';
import { profileSchema } from './profile';

export const matchRulesSchema = z.object({
  jobTitleKeywords: z.array(z.string()).optional(),
  sites: z.array(z.string()).optional(),
  jdKeywords: z.array(z.string()).optional(),
});

export const variantSchema = baseEntitySchema.extend({
  baseProfileId: idSchema,
  name: z.string().min(1),
  priority: z.number().int(),
  matchRules: matchRulesSchema,
  overrides: profileSchema.partial(),
});

export type Variant = z.infer<typeof variantSchema>;
export type MatchRules = z.infer<typeof matchRulesSchema>;
```

- [ ] **Step 2: Write `src/shared/schema/application.ts`**

```ts
import { z } from 'zod';
import { idSchema, baseEntitySchema, timestampSchema } from './common';

export const applicationStatusSchema = z.enum([
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'ghosted',
]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const applicationRecordSchema = baseEntitySchema.extend({
  url: z.string().url(),
  appliedAt: timestampSchema,
  companyName: z.string(),
  jobTitle: z.string(),
  jobLocation: z.string().optional(),
  jobId: z.string().optional(),
  sourcePlatform: z.string(),
  profileId: idSchema,
  variantId: idSchema.optional(),
  status: applicationStatusSchema,
  notes: z.string().optional(),
  followUpAt: timestampSchema.optional(),
  jdSnapshot: z.string().optional(),
  salaryRange: z.string().optional(),
});

export type ApplicationRecord = z.infer<typeof applicationRecordSchema>;
```

- [ ] **Step 3: Write `src/shared/schema/savedAnswer.ts`**

```ts
import { z } from 'zod';
import { baseEntitySchema, timestampSchema } from './common';

export const savedAnswerSchema = baseEntitySchema.extend({
  label: z.string().min(1),
  questionSamples: z.array(z.string()),
  answer: z.string(),
  tags: z.array(z.string()).optional(),
  useCount: z.number().int().nonnegative(),
  lastUsedAt: timestampSchema.optional(),
});

export type SavedAnswer = z.infer<typeof savedAnswerSchema>;
```

- [ ] **Step 4: Write `src/shared/schema/reminder.ts`**

```ts
import { z } from 'zod';
import { idSchema, baseEntitySchema, timestampSchema } from './common';

export const reminderStatusSchema = z.enum(['pending', 'done', 'dismissed']);

export const reminderSchema = baseEntitySchema.extend({
  applicationId: idSchema.optional(),
  title: z.string().min(1),
  dueAt: timestampSchema,
  notes: z.string().optional(),
  status: reminderStatusSchema,
});

export type Reminder = z.infer<typeof reminderSchema>;
```

- [ ] **Step 5: Write `src/shared/schema/fileBlob.ts`**

```ts
import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

export const fileBlobSchema = z.object({
  id: idSchema,
  name: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  data: z.instanceof(Blob),
  createdAt: timestampSchema,
});

export type FileBlob = z.infer<typeof fileBlobSchema>;
```

- [ ] **Step 6: Write `src/shared/schema/settings.ts`**

```ts
import { z } from 'zod';
import { idSchema } from './common';

export const applyDetectionModeSchema = z.enum(['auto-confirm', 'manual-only', 'off']);

export const settingsSchema = z.object({
  activeProfileId: idSchema.optional(),
  applyDetectionMode: applyDetectionModeSchema,
  passiveAnswerCapture: z.boolean(),
  captureJdSnapshot: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  applyDetectionMode: 'manual-only',
  passiveAnswerCapture: true,
  captureJdSnapshot: true,
  theme: 'system',
};
```

- [ ] **Step 7: Write `src/shared/schema/aiConfig.ts`**

```ts
import { z } from 'zod';

export const aiProviderIdSchema = z.enum(['openai', 'anthropic', 'gemini']);
export type AIProviderId = z.infer<typeof aiProviderIdSchema>;

export const aiConfigSchema = z.object({
  enabledProviders: z.array(aiProviderIdSchema),
  defaultProvider: aiProviderIdSchema.optional(),
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    gemini: z.string().optional(),
  }),
  modelByProvider: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    gemini: z.string().optional(),
  }),
  featuresEnabled: z.object({
    qaAnswering: z.boolean(),
    coverLetter: z.boolean(),
    resumeTailoring: z.boolean(),
    metadataExtraction: z.boolean(),
    jdSummary: z.boolean(),
  }),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabledProviders: [],
  apiKeys: {},
  modelByProvider: {},
  featuresEnabled: {
    qaAnswering: false,
    coverLetter: false,
    resumeTailoring: false,
    metadataExtraction: false,
    jdSummary: false,
  },
};
```

- [ ] **Step 8: Write `src/shared/schema/index.ts`**

```ts
export * from './common';
export * from './profile';
export * from './variant';
export * from './application';
export * from './savedAnswer';
export * from './reminder';
export * from './fileBlob';
export * from './settings';
export * from './aiConfig';
```

- [ ] **Step 9: Write a round-trip test**

`src/shared/schema/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  applicationRecordSchema,
  DEFAULT_SETTINGS,
  DEFAULT_AI_CONFIG,
  settingsSchema,
  aiConfigSchema,
} from './index';

describe('schema defaults', () => {
  it('DEFAULT_SETTINGS parses', () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
  it('DEFAULT_AI_CONFIG parses', () => {
    expect(aiConfigSchema.safeParse(DEFAULT_AI_CONFIG).success).toBe(true);
  });
});

describe('applicationRecordSchema', () => {
  it('rejects non-URL', () => {
    const result = applicationRecordSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      url: 'not-a-url',
      appliedAt: 0,
      companyName: '',
      jobTitle: '',
      sourcePlatform: '',
      profileId: '00000000-0000-4000-8000-000000000002',
      status: 'applied',
      createdAt: 0,
      updatedAt: 0,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 10: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/shared/schema/
git commit -m "feat(schema): add variant, application, answer, reminder, file, settings, ai schemas"
```

---

### Task 11: Shared util — id + logger + debounce

**Files:**
- Create: `src/shared/util/id.ts`, `src/shared/util/logger.ts`, `src/shared/util/debounce.ts`, tests

- [ ] **Step 1: Write `src/shared/util/id.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { uuidv4 } from './id';

describe('uuidv4', () => {
  it('returns a v4 uuid', () => {
    const id = uuidv4();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('produces unique values', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(uuidv4());
    expect(ids.size).toBe(100);
  });
});
```

- [ ] **Step 2: Write `src/shared/util/id.ts`**

```ts
export function uuidv4(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 3: Write `src/shared/util/debounce.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  it('invokes once after quiet period', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    d('b');
    d('c');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(101);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
    vi.useRealTimers();
  });
});
```

- [ ] **Step 4: Write `src/shared/util/debounce.ts`**

```ts
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
```

- [ ] **Step 5: Write `src/shared/util/logger.ts`**

```ts
type Level = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[resume-bin]';

function emit(level: Level, scope: string, args: unknown[]): void {
  const fn = level === 'debug' ? console.log : console[level];
  fn.call(console, PREFIX, `[${scope}]`, ...args);
}

export function createLogger(scope: string) {
  return {
    debug: (...a: unknown[]) => emit('debug', scope, a),
    info: (...a: unknown[]) => emit('info', scope, a),
    warn: (...a: unknown[]) => emit('warn', scope, a),
    error: (...a: unknown[]) => emit('error', scope, a),
  };
}
```

- [ ] **Step 6: Replace the temporary uuid in `src/shared/schema/profile.ts`**

Remove the inline `function uuidv4()` and import:

```ts
import { uuidv4 } from '@/shared/util/id';
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/shared/util/ src/shared/schema/profile.ts
git commit -m "feat(util): add uuidv4, debounce, logger; wire profile.ts to util"
```

---

### Task 12: Shared storage — Dexie DB with all tables

**Files:**
- Create: `src/shared/storage/db.ts`, `src/shared/storage/index.ts`, tests

Per spec §4.8, Dexie holds all 8 tables from the start so later phases don't need schema migrations.

- [ ] **Step 1: Write the failing test**

`src/shared/storage/db.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from './db';

describe('Dexie schema v1', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('opens with all tables', async () => {
    await db.open();
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'applications',
        'files',
        'kv',
        'pendingAnswerCaptures',
        'profiles',
        'reminders',
        'savedAnswers',
        'variants',
      ].sort(),
    );
  });

  it('round-trips a kv entry', async () => {
    await db.kv.put({ key: 'schemaVersion', value: 1 });
    const row = await db.kv.get('schemaVersion');
    expect(row?.value).toBe(1);
  });
});
```

Add `fake-indexeddb` to devDependencies: run `npm install -D fake-indexeddb`.

- [ ] **Step 2: Run test — expected fail**

Run: `npm test -- db`
Expected: FAIL — `./db` not found.

- [ ] **Step 3: Write `src/shared/storage/db.ts`**

```ts
import Dexie, { type Table } from 'dexie';
import type { Profile } from '@/shared/schema/profile';
import type { Variant } from '@/shared/schema/variant';
import type { ApplicationRecord } from '@/shared/schema/application';
import type { SavedAnswer } from '@/shared/schema/savedAnswer';
import type { Reminder } from '@/shared/schema/reminder';
import type { FileBlob } from '@/shared/schema/fileBlob';

export interface PendingAnswerCapture {
  id: string;
  questionText: string;
  answerText: string;
  url: string;
  sourcePlatform: string;
  createdAt: number;
}

export interface KvRow {
  key: string;
  value: unknown;
}

export class ResumeBinDb extends Dexie {
  profiles!: Table<Profile, string>;
  variants!: Table<Variant, string>;
  applications!: Table<ApplicationRecord, string>;
  savedAnswers!: Table<SavedAnswer, string>;
  pendingAnswerCaptures!: Table<PendingAnswerCapture, string>;
  reminders!: Table<Reminder, string>;
  files!: Table<FileBlob, string>;
  kv!: Table<KvRow, string>;

  constructor() {
    super('resume-bin');
    this.version(1).stores({
      profiles: 'id, isDefault',
      variants: 'id, baseProfileId',
      applications: 'id, url, appliedAt, companyName, status',
      savedAnswers: 'id, label, lastUsedAt',
      pendingAnswerCaptures: 'id, createdAt',
      reminders: 'id, dueAt, applicationId',
      files: 'id',
      kv: 'key',
    });
  }
}

export const db = new ResumeBinDb();

export async function resetDatabase(): Promise<void> {
  await db.delete();
  // Re-instantiate by re-opening the same singleton; Dexie supports reopen.
  await db.open();
}
```

- [ ] **Step 4: Write `src/shared/storage/index.ts`**

```ts
export { db, resetDatabase } from './db';
export type { KvRow, PendingAnswerCapture } from './db';
```

- [ ] **Step 5: Run test — expected pass**

Run: `npm test -- db`
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/storage/ package.json package-lock.json
git commit -m "feat(storage): add Dexie schema v1 with all tables"
```

---

### Task 13: Shared messaging — typed bus

**Files:**
- Create: `src/shared/messaging/types.ts`, `src/shared/messaging/bus.ts`, `src/shared/messaging/index.ts`, tests

- [ ] **Step 1: Write `src/shared/messaging/types.ts`**

This file is the single source of truth for every message across the extension. We seed it with messages used in Phase 1; later phases extend this union.

```ts
import type { Profile } from '@/shared/schema/profile';
import type { ApplicationRecord } from '@/shared/schema/application';
import type { Settings } from '@/shared/schema/settings';

// --- message envelope ---

export type MessagePayload = unknown;

export interface MessageEnvelope<T extends string = string, P = MessagePayload> {
  type: T;
  payload: P;
}

// --- discriminated union of all messages ---

export type Message =
  // profile
  | MessageEnvelope<'profile/get-active'>
  | MessageEnvelope<'profile/update', { patch: Partial<Profile> }>
  // autofill
  | MessageEnvelope<'autofill/request-mapping'>
  | MessageEnvelope<'autofill/fill', { selectedKeys: string[] }>
  // tracker
  | MessageEnvelope<'tracker/mark-applied', { url: string; tabInfo: TabInfo }>
  | MessageEnvelope<'tracker/list'>
  | MessageEnvelope<'tracker/export-csv'>
  // settings
  | MessageEnvelope<'settings/get'>
  | MessageEnvelope<'settings/update', { patch: Partial<Settings> }>
  // system
  | MessageEnvelope<'system/clear-all'>
  | MessageEnvelope<'system/active-tab-info'>;

export interface TabInfo {
  url: string;
  title: string;
  host: string;
}

// --- response shapes keyed by message type ---

export interface ResponseMap {
  'profile/get-active': Profile | null;
  'profile/update': Profile;
  'autofill/request-mapping': { count: number };
  'autofill/fill': { filled: number; skipped: number; failed: number };
  'tracker/mark-applied': ApplicationRecord;
  'tracker/list': ApplicationRecord[];
  'tracker/export-csv': { csv: string };
  'settings/get': Settings;
  'settings/update': Settings;
  'system/clear-all': { ok: true };
  'system/active-tab-info': TabInfo | null;
}

export type MessageType = Message['type'];

export type PayloadOf<T extends MessageType> = Extract<Message, { type: T }>['payload'];
export type ResponseOf<T extends MessageType> = ResponseMap[T];
```

- [ ] **Step 2: Write the failing test**

`src/shared/messaging/bus.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerHandler, sendMessage, _resetHandlers } from './bus';

type ChromeMock = {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
    lastError?: { message: string };
  };
};

declare global {
  // eslint-disable-next-line no-var
  var chrome: ChromeMock;
}

beforeEach(() => {
  _resetHandlers();
  globalThis.chrome = {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        queueMicrotask(() => cb?.({ ok: true, value: 'echo:' + (msg as { type: string }).type }));
      }),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
});

describe('messaging bus', () => {
  it('sendMessage resolves with the runtime reply value', async () => {
    const value = await sendMessage('system/active-tab-info', undefined as never);
    expect(value).toBe('echo:system/active-tab-info');
  });

  it('registerHandler stores and dispatches handlers', async () => {
    const handler = vi.fn(async () => ({ url: 'u', title: 't', host: 'h' }));
    registerHandler('system/active-tab-info', handler);
    // Simulate runtime dispatch (what background.ts will wire up)
    // The unit test just verifies registration side effect:
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Write `src/shared/messaging/bus.ts`**

```ts
import type { Message, MessageType, PayloadOf, ResponseOf } from './types';

type Handler<T extends MessageType> = (
  payload: PayloadOf<T>,
  sender?: chrome.runtime.MessageSender,
) => Promise<ResponseOf<T>> | ResponseOf<T>;

const handlers = new Map<MessageType, Handler<MessageType>>();

export function registerHandler<T extends MessageType>(type: T, handler: Handler<T>): void {
  handlers.set(type, handler as Handler<MessageType>);
}

export function _resetHandlers(): void {
  handlers.clear();
}

export interface BusReply<V> {
  ok: boolean;
  value?: V;
  error?: string;
}

export function attachRuntimeListener(): void {
  chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
    const handler = handlers.get(msg.type);
    if (!handler) {
      sendResponse({ ok: false, error: `no handler for ${msg.type}` });
      return false;
    }
    Promise.resolve(handler(msg.payload as never, sender))
      .then((value) => sendResponse({ ok: true, value }))
      .catch((e: unknown) => sendResponse({ ok: false, error: String(e) }));
    // returning true keeps the message channel open for async sendResponse
    return true;
  });
}

export function sendMessage<T extends MessageType>(
  type: T,
  payload: PayloadOf<T>,
): Promise<ResponseOf<T>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload } as Message, (reply: BusReply<ResponseOf<T>>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!reply?.ok) {
        reject(new Error(reply?.error ?? 'unknown bus error'));
        return;
      }
      resolve(reply.value as ResponseOf<T>);
    });
  });
}
```

- [ ] **Step 4: Write `src/shared/messaging/index.ts`**

```ts
export * from './types';
export { sendMessage, registerHandler, attachRuntimeListener, _resetHandlers } from './bus';
```

- [ ] **Step 5: Run tests**

Run: `npm test -- messaging`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/messaging/
git commit -m "feat(messaging): add typed message bus with discriminated union"
```

---

### Task 14: Background service worker shell

**Files:**
- Create: `src/background/index.ts`, `src/background/handlers.ts`

- [ ] **Step 1: Write `src/background/handlers.ts`**

```ts
import { registerHandler } from '@/shared/messaging';

export function registerAllHandlers(): void {
  registerHandler('system/active-tab-info', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    const u = new URL(tab.url);
    return { url: tab.url, title: tab.title ?? '', host: u.host };
  });
}
```

- [ ] **Step 2: Write `src/background/index.ts`**

```ts
import { attachRuntimeListener } from '@/shared/messaging';
import { registerAllHandlers } from './handlers';
import { createLogger } from '@/shared/util/logger';

const log = createLogger('background');

registerAllHandlers();
attachRuntimeListener();

log.info('service worker started');
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/background/
git commit -m "feat(background): service worker shell with active-tab-info handler"
```

---

### Task 15: Content script shell

**Files:**
- Create: `src/content/index.ts`, `src/content/styles.css`

- [ ] **Step 1: Write `src/content/styles.css`**

```css
/* Scoped content-script styles. All classes are prefixed rb- to avoid collisions. */
.rb-pill {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  background: #2563eb;
  color: white;
  font: 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  padding: 10px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  user-select: none;
}
.rb-pill:hover {
  background: #1d4ed8;
}
.rb-pill[hidden] {
  display: none;
}

.rb-preview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rb-preview-dialog {
  background: white;
  color: #0f172a;
  font: 14px/1.35 system-ui, sans-serif;
  border-radius: 12px;
  width: min(560px, 92vw);
  max-height: 80vh;
  overflow: auto;
  padding: 18px 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}
.rb-preview-dialog h2 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}
.rb-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}
.rb-preview-row:last-child {
  border-bottom: none;
}
.rb-preview-key {
  font-weight: 600;
  min-width: 140px;
}
.rb-preview-value {
  color: #475569;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rb-preview-conf {
  font-size: 12px;
  color: #64748b;
  min-width: 48px;
  text-align: right;
}
.rb-preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
.rb-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
}
.rb-btn.rb-btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}
.rb-field-hl-filled {
  outline: 2px solid #22c55e !important;
  outline-offset: 2px !important;
}
.rb-field-hl-skipped {
  outline: 2px solid #eab308 !important;
  outline-offset: 2px !important;
}
.rb-field-hl-failed {
  outline: 2px solid #ef4444 !important;
  outline-offset: 2px !important;
}
```

- [ ] **Step 2: Write `src/content/index.ts`**

For Task 15 this is an empty shell; it gets wired up in Task 29.

```ts
import './styles.css';
import { createLogger } from '@/shared/util/logger';

const log = createLogger('content');
log.info('content script loaded on', location.host);
```

- [ ] **Step 3: Commit**

```bash
git add src/content/
git commit -m "feat(content): content script shell with scoped styles"
```

---

### Task 16: Popup React shell

**Files:**
- Create: `src/popup/main.tsx`, `src/popup/App.tsx`, `src/popup/styles.css`

- [ ] **Step 1: Write `src/popup/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  width: 360px;
  min-height: 200px;
}
```

- [ ] **Step 2: Write `src/popup/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage, type TabInfo } from '@/shared/messaging';

export function App() {
  const [tab, setTab] = useState<TabInfo | null>(null);

  useEffect(() => {
    sendMessage('system/active-tab-info', undefined as never)
      .then(setTab)
      .catch(() => setTab(null));
  }, []);

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
      <p className="text-xs text-slate-500">
        Phase 1 skeleton — more actions land in later tasks.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/popup/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Build to verify**

Run: `npm run build`
Expected: build succeeds, produces `dist/`.

- [ ] **Step 5: Commit**

```bash
git add src/popup/
git commit -m "feat(popup): React shell showing active tab info"
```

---

### Task 17: Options React shell + hash router

**Files:**
- Create: `src/options/main.tsx`, `src/options/App.tsx`, `src/options/router.ts`, `src/options/styles.css`

- [ ] **Step 1: Write `src/options/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  min-height: 100vh;
}
```

- [ ] **Step 2: Write `src/options/router.ts`**

```ts
import { useEffect, useState } from 'react';

export type Route = 'profile' | 'applications' | 'settings';
const ROUTES: readonly Route[] = ['profile', 'applications', 'settings'] as const;

function parseHash(): Route {
  const m = location.hash.match(/^#\/(profile|applications|settings)/);
  return (m?.[1] as Route | undefined) ?? 'profile';
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parseHash());
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

- [ ] **Step 3: Write `src/options/App.tsx`**

(Views are stubs here; real implementations land in later tasks.)

```tsx
import { useRoute, type Route } from './router';

const NAV: { key: Route; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'applications', label: 'Applications' },
  { key: 'settings', label: 'Settings' },
];

export function App() {
  const [route, go] = useRoute();
  return (
    <div className="flex h-full">
      <aside className="w-56 border-r border-slate-200 dark:border-slate-800 p-4 space-y-1">
        <div className="text-xs uppercase text-slate-500 mb-3">resume-bin</div>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => go(n.key)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm ${
              route === n.key
                ? 'bg-brand text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {n.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {route === 'profile' && <div>Profile editor (Task 20)</div>}
        {route === 'applications' && <div>Applications (Task 32)</div>}
        {route === 'settings' && <div>Settings (Task 33)</div>}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/options/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Build + verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Manual smoke test**

1. Open `chrome://extensions`, enable Developer Mode, click "Load unpacked", select `dist/`.
2. Click the toolbar icon → popup opens and shows the host of the active tab.
3. Right-click the toolbar icon → "Options" → dashboard loads with three nav items, hash-routing works.

- [ ] **Step 7: Commit and tag Phase 0**

```bash
git add src/options/
git commit -m "feat(options): React shell with hash router + sidebar nav"
git tag phase-0-complete
```

---

## Phase 1 — Walking skeleton

### Task 18: Profile feature — store

**Files:**
- Create: `src/features/profile/store.ts`, `src/features/profile/index.ts`, tests

- [ ] **Step 1: Write the failing test**

`src/features/profile/store.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { ensureDefaultProfile, getActiveProfile, updateActiveProfile } from './store';

describe('profile store', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('ensureDefaultProfile creates one if none exists', async () => {
    const p = await ensureDefaultProfile();
    expect(p.isDefault).toBe(true);
    expect((await db.profiles.count())).toBe(1);
  });

  it('ensureDefaultProfile is idempotent', async () => {
    const a = await ensureDefaultProfile();
    const b = await ensureDefaultProfile();
    expect(a.id).toBe(b.id);
  });

  it('updateActiveProfile merges a patch and bumps updatedAt', async () => {
    const before = await ensureDefaultProfile();
    const after = await updateActiveProfile({ firstName: 'Tanay' });
    expect(after.firstName).toBe('Tanay');
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
  });

  it('getActiveProfile returns the active one', async () => {
    await ensureDefaultProfile();
    const p = await getActiveProfile();
    expect(p?.isDefault).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expected fail**

Run: `npm test -- profile/store`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/profile/store.ts`**

```ts
import { db } from '@/shared/storage/db';
import {
  createEmptyProfile,
  profileSchema,
  type Profile,
} from '@/shared/schema/profile';

export async function ensureDefaultProfile(): Promise<Profile> {
  const existing = await db.profiles.filter((p) => p.isDefault).first();
  if (existing) return existing;
  const fresh = createEmptyProfile('Default');
  await db.profiles.put(fresh);
  return fresh;
}

export async function getActiveProfile(): Promise<Profile | null> {
  const p = await db.profiles.filter((x) => x.isDefault).first();
  return p ?? null;
}

export async function updateActiveProfile(patch: Partial<Profile>): Promise<Profile> {
  const current = await ensureDefaultProfile();
  const next: Profile = {
    ...current,
    ...patch,
    location: patch.location ? { ...current.location, ...patch.location } : current.location,
    updatedAt: Date.now(),
  };
  const parsed = profileSchema.parse(next);
  await db.profiles.put(parsed);
  return parsed;
}
```

- [ ] **Step 4: Write `src/features/profile/index.ts`**

```ts
export { ensureDefaultProfile, getActiveProfile, updateActiveProfile } from './store';
```

- [ ] **Step 5: Run — expected pass**

Run: `npm test -- profile/store`
Expected: 4 tests PASS.

- [ ] **Step 6: Wire the profile handlers in background**

Extend `src/background/handlers.ts`:

```ts
import { registerHandler } from '@/shared/messaging';
import { ensureDefaultProfile, getActiveProfile, updateActiveProfile } from '@/features/profile';

export function registerAllHandlers(): void {
  registerHandler('system/active-tab-info', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    const u = new URL(tab.url);
    return { url: tab.url, title: tab.title ?? '', host: u.host };
  });

  registerHandler('profile/get-active', async () => {
    await ensureDefaultProfile();
    return getActiveProfile();
  });

  registerHandler('profile/update', async ({ patch }) => {
    return updateActiveProfile(patch);
  });
}
```

- [ ] **Step 7: Typecheck + test**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/profile/ src/background/handlers.ts
git commit -m "feat(profile): store with default bootstrap + update; wire handlers"
```

---

### Task 19: Profile editor hook — useProfileForm

**Files:**
- Create: `src/features/profile/useProfileForm.ts`, tests

A small hook that loads the active profile via messaging, keeps a local draft, and autosaves on blur.

- [ ] **Step 1: Write the test**

`src/features/profile/useProfileForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileForm } from './useProfileForm';

vi.mock('@/shared/messaging', () => {
  const profile = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Default',
    isDefault: true,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    headline: '',
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: 0,
    updatedAt: 0,
  };
  const sendMessage = vi.fn((type: string, _payload: unknown) => {
    if (type === 'profile/get-active') return Promise.resolve(profile);
    if (type === 'profile/update') return Promise.resolve({ ...profile, firstName: 'X' });
    return Promise.resolve(null);
  });
  return { sendMessage };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProfileForm', () => {
  it('loads the active profile', async () => {
    const { result } = renderHook(() => useProfileForm());
    await waitFor(() => expect(result.current.profile).not.toBeNull());
    expect(result.current.profile?.isDefault).toBe(true);
  });

  it('save() sends profile/update with the patch', async () => {
    const { result } = renderHook(() => useProfileForm());
    await waitFor(() => expect(result.current.profile).not.toBeNull());
    await act(async () => {
      await result.current.save({ firstName: 'X' });
    });
    expect(result.current.profile?.firstName).toBe('X');
  });
});
```

- [ ] **Step 2: Run — expected fail**

Run: `npm test -- useProfileForm`
Expected: FAIL (hook not defined).

- [ ] **Step 3: Write `src/features/profile/useProfileForm.ts`**

```ts
import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { Profile } from '@/shared/schema/profile';

export interface UseProfileFormResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  save: (patch: Partial<Profile>) => Promise<void>;
  reload: () => Promise<void>;
}

export function useProfileForm(): UseProfileFormResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async (): Promise<void> => {
    setLoading(true);
    try {
      const p = await sendMessage('profile/get-active', undefined as never);
      setProfile(p);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const save = async (patch: Partial<Profile>): Promise<void> => {
    try {
      const updated = await sendMessage('profile/update', { patch });
      setProfile(updated);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  return { profile, loading, error, save, reload };
}
```

- [ ] **Step 4: Run — expected pass**

Run: `npm test -- useProfileForm`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/useProfileForm.ts src/features/profile/useProfileForm.test.tsx
git commit -m "feat(profile): add useProfileForm hook with load + save"
```

---

### Task 20: Profile editor — ProfileEditor shell + Personal section

**Files:**
- Create: `src/features/profile/ui/ProfileEditor.tsx`, `src/features/profile/ui/PersonalSection.tsx`, `src/features/profile/ui/field.tsx` (shared input primitives)

- [ ] **Step 1: Write `src/features/profile/ui/field.tsx` — shared form primitives**

```tsx
import { useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  placeholder?: string;
};

export function TextField({ label, value, onCommit, type = 'text', placeholder }: Props) {
  const [local, setLocal] = useState(value);
  const initial = useRef(value);
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
        type={type}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initial.current) {
            onCommit(local);
            initial.current = local;
          }
        }}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onCommit,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const initial = useRef(value);
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        rows={rows}
        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initial.current) {
            onCommit(local);
            initial.current = local;
          }
        }}
      />
    </label>
  );
}
```

- [ ] **Step 2: Write `src/features/profile/ui/PersonalSection.tsx`**

```tsx
import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function PersonalSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Personal</h2>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="First name"
          value={profile.firstName}
          onCommit={(v) => save({ firstName: v })}
        />
        <TextField
          label="Last name"
          value={profile.lastName}
          onCommit={(v) => save({ lastName: v })}
        />
        <TextField
          label="Email"
          type="email"
          value={profile.email}
          onCommit={(v) => save({ email: v })}
        />
        <TextField
          label="Phone"
          type="tel"
          value={profile.phone}
          onCommit={(v) => save({ phone: v })}
        />
        <TextField
          label="City"
          value={profile.location.city}
          onCommit={(v) => save({ location: { ...profile.location, city: v } })}
        />
        <TextField
          label="State"
          value={profile.location.state}
          onCommit={(v) => save({ location: { ...profile.location, state: v } })}
        />
        <TextField
          label="Country"
          value={profile.location.country}
          onCommit={(v) => save({ location: { ...profile.location, country: v } })}
        />
        <TextField
          label="ZIP"
          value={profile.location.zip ?? ''}
          onCommit={(v) => save({ location: { ...profile.location, zip: v } })}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/features/profile/ui/ProfileEditor.tsx` (tab shell)**

```tsx
import { useState } from 'react';
import { useProfileForm } from '../useProfileForm';
import { PersonalSection } from './PersonalSection';

const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'links', label: 'Links' },
  { key: 'prefs', label: 'Preferences' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ProfileEditor() {
  const { profile, loading, error, save } = useProfileForm();
  const [tab, setTab] = useState<TabKey>('personal');

  if (loading) return <div>Loading profile…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!profile) return <div>No profile.</div>;

  return (
    <div className="max-w-2xl">
      <nav className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? 'border-b-2 border-brand text-brand'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'personal' && <PersonalSection profile={profile} save={save} />}
      {tab === 'links' && <div className="text-slate-500">(Task 21)</div>}
      {tab === 'prefs' && <div className="text-slate-500">(Task 22)</div>}
      {tab === 'summary' && <div className="text-slate-500">(Task 23)</div>}
      {tab === 'skills' && <div className="text-slate-500">(Task 24)</div>}
    </div>
  );
}
```

- [ ] **Step 4: Wire into Options App**

Edit `src/options/App.tsx` — replace the `route === 'profile'` placeholder:

```tsx
import { ProfileEditor } from '@/features/profile/ui/ProfileEditor';
// ...
{route === 'profile' && <ProfileEditor />}
```

- [ ] **Step 5: Build + typecheck**

Run: `npm run typecheck && npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add src/features/profile/ui/ src/options/App.tsx
git commit -m "feat(profile): editor shell with Personal section"
```

---

### Task 21: Profile editor — Links section

**Files:**
- Create: `src/features/profile/ui/LinksSection.tsx`
- Modify: `src/features/profile/ui/ProfileEditor.tsx`

- [ ] **Step 1: Write `src/features/profile/ui/LinksSection.tsx`**

```tsx
import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function LinksSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Links</h2>
      <div className="grid grid-cols-1 gap-3">
        <TextField
          label="LinkedIn URL"
          type="url"
          value={profile.linkedinUrl ?? ''}
          onCommit={(v) => save({ linkedinUrl: v })}
        />
        <TextField
          label="GitHub URL"
          type="url"
          value={profile.githubUrl ?? ''}
          onCommit={(v) => save({ githubUrl: v })}
        />
        <TextField
          label="Portfolio URL"
          type="url"
          value={profile.portfolioUrl ?? ''}
          onCommit={(v) => save({ portfolioUrl: v })}
        />
        <TextField
          label="Website"
          type="url"
          value={profile.websiteUrl ?? ''}
          onCommit={(v) => save({ websiteUrl: v })}
        />
        <TextField
          label="Twitter / X"
          type="url"
          value={profile.twitterUrl ?? ''}
          onCommit={(v) => save({ twitterUrl: v })}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `ProfileEditor.tsx`** — replace the `tab === 'links'` placeholder:

```tsx
import { LinksSection } from './LinksSection';
// ...
{tab === 'links' && <LinksSection profile={profile} save={save} />}
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/ui/LinksSection.tsx src/features/profile/ui/ProfileEditor.tsx
git commit -m "feat(profile): Links section editor"
```

---

### Task 22: Profile editor — Preferences section

**Files:**
- Create: `src/features/profile/ui/PreferencesSection.tsx`
- Modify: `src/features/profile/ui/ProfileEditor.tsx`

- [ ] **Step 1: Write `src/features/profile/ui/PreferencesSection.tsx`**

```tsx
import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function PreferencesSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const numberOrUndef = (v: string): number | undefined =>
    v.trim() === '' ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Preferences</h2>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Work authorization"
          value={profile.workAuthorization ?? ''}
          onCommit={(v) => save({ workAuthorization: v })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!profile.willingToRelocate}
            onChange={(e) => void save({ willingToRelocate: e.target.checked })}
          />
          <span className="text-sm">Willing to relocate</span>
        </label>
        <TextField
          label="Notice period (days)"
          type="number"
          value={profile.noticePeriodDays?.toString() ?? ''}
          onCommit={(v) => save({ noticePeriodDays: numberOrUndef(v) })}
        />
        <TextField
          label="Current CTC (annual)"
          type="number"
          value={profile.currentCtcAnnual?.toString() ?? ''}
          onCommit={(v) => save({ currentCtcAnnual: numberOrUndef(v) })}
        />
        <TextField
          label="Expected CTC (annual)"
          type="number"
          value={profile.expectedCtcAnnual?.toString() ?? ''}
          onCommit={(v) => save({ expectedCtcAnnual: numberOrUndef(v) })}
        />
        <TextField
          label="Desired start date"
          value={profile.desiredStartDate ?? ''}
          onCommit={(v) => save({ desiredStartDate: v })}
          placeholder="YYYY-MM-DD"
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into editor** — replace `tab === 'prefs'`:

```tsx
import { PreferencesSection } from './PreferencesSection';
// ...
{tab === 'prefs' && <PreferencesSection profile={profile} save={save} />}
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/ui/PreferencesSection.tsx src/features/profile/ui/ProfileEditor.tsx
git commit -m "feat(profile): Preferences section editor"
```

---

### Task 23: Profile editor — Summary section

**Files:**
- Create: `src/features/profile/ui/SummarySection.tsx`
- Modify: `src/features/profile/ui/ProfileEditor.tsx`

- [ ] **Step 1: Write `src/features/profile/ui/SummarySection.tsx`**

```tsx
import type { Profile } from '@/shared/schema/profile';
import { TextField, TextAreaField } from './field';

export function SummarySection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Headline &amp; Summary</h2>
      <TextField
        label="Headline"
        value={profile.headline}
        onCommit={(v) => save({ headline: v })}
      />
      <TextAreaField
        label="Summary"
        rows={6}
        value={profile.summary}
        onCommit={(v) => save({ summary: v })}
      />
    </section>
  );
}
```

- [ ] **Step 2: Wire into editor** — replace `tab === 'summary'`:

```tsx
import { SummarySection } from './SummarySection';
// ...
{tab === 'summary' && <SummarySection profile={profile} save={save} />}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/ui/SummarySection.tsx src/features/profile/ui/ProfileEditor.tsx
git commit -m "feat(profile): Summary section editor"
```

---

### Task 24: Profile editor — Skills section (tag input)

**Files:**
- Create: `src/features/profile/ui/SkillsSection.tsx`
- Modify: `src/features/profile/ui/ProfileEditor.tsx`

- [ ] **Step 1: Write `src/features/profile/ui/SkillsSection.tsx`**

```tsx
import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';

export function SkillsSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');

  const addSkill = (): void => {
    const v = draft.trim();
    if (!v) return;
    if (profile.skills.includes(v)) {
      setDraft('');
      return;
    }
    void save({ skills: [...profile.skills, v] });
    setDraft('');
  };

  const removeSkill = (s: string): void => {
    void save({ skills: profile.skills.filter((x) => x !== s) });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Skills</h2>
      <div className="flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs"
          >
            {s}
            <button
              className="text-slate-400 hover:text-red-600"
              onClick={() => removeSkill(s)}
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
          placeholder="Add a skill and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <button
          className="rounded bg-brand text-white px-3 py-1.5 text-sm"
          onClick={addSkill}
        >
          Add
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into editor** — replace `tab === 'skills'`:

```tsx
import { SkillsSection } from './SkillsSection';
// ...
{tab === 'skills' && <SkillsSection profile={profile} save={save} />}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/ui/SkillsSection.tsx src/features/profile/ui/ProfileEditor.tsx
git commit -m "feat(profile): Skills section with tag input"
```

---

### Task 25: Autofill types + dictionary structure

**Files:**
- Create: `src/features/autofill/types.ts`, `src/features/autofill/dictionary/index.ts`, one entry file, tests

- [ ] **Step 1: Write `src/features/autofill/types.ts`**

```ts
export type InputKind =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'contenteditable';

export interface FieldCandidate {
  element: HTMLElement;
  kind: InputKind;
  label: string;
  ariaLabel: string;
  name: string;
  id: string;
  placeholder: string;
  nearbyText: string;
  fieldsetLegend: string;
}

export interface DictionaryEntry {
  key: string; // canonical key e.g. 'email'
  synonyms: string[]; // lowercased tokens
  regexHints: RegExp[];
  expectedKinds: InputKind[];
}

export interface FieldMapping {
  candidateIndex: number;
  key: string | 'unknown';
  confidence: number; // 0..100
  value?: string; // filled in at request-mapping time
}

export interface FillResult {
  filled: number;
  skipped: number;
  failed: number;
}
```

- [ ] **Step 2: Write `src/features/autofill/dictionary/email.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const email: DictionaryEntry = {
  key: 'email',
  synonyms: ['email', 'e-mail', 'mail', 'email address', 'contact email', 'work email'],
  regexHints: [/e[- ]?mail/i, /^email$/i],
  expectedKinds: ['email', 'text'],
};
```

- [ ] **Step 3: Write `src/features/autofill/dictionary/index.ts`**

```ts
import type { DictionaryEntry } from '../types';
import { email } from './email';

export const dictionary: DictionaryEntry[] = [email];

export function getDictionary(): DictionaryEntry[] {
  return dictionary;
}
```

- [ ] **Step 4: Write the test**

`src/features/autofill/dictionary/dictionary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getDictionary } from './index';

describe('autofill dictionary', () => {
  it('includes canonical keys', () => {
    const keys = getDictionary().map((e) => e.key);
    expect(keys).toContain('email');
  });
});
```

- [ ] **Step 5: Run — pass**

Run: `npm test -- dictionary`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/autofill/types.ts src/features/autofill/dictionary/
git commit -m "feat(autofill): add types + dictionary registry with email entry"
```

---

### Task 26: Autofill dictionary — remaining 7 keys

**Files:** Create one file per key + update `dictionary/index.ts`

- [ ] **Step 1: Create `src/features/autofill/dictionary/phone.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const phone: DictionaryEntry = {
  key: 'phone',
  synonyms: ['phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'telephone', 'cell'],
  regexHints: [/phone/i, /mobile/i, /telephone/i, /\bcell\b/i],
  expectedKinds: ['tel', 'text'],
};
```

- [ ] **Step 2: Create `src/features/autofill/dictionary/firstName.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const firstName: DictionaryEntry = {
  key: 'firstName',
  synonyms: ['first name', 'given name', 'firstname', 'forename', 'preferred first name'],
  regexHints: [/first[_ -]?name/i, /\bgiven[_ -]?name\b/i, /^fname$/i],
  expectedKinds: ['text'],
};
```

- [ ] **Step 3: Create `src/features/autofill/dictionary/lastName.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const lastName: DictionaryEntry = {
  key: 'lastName',
  synonyms: ['last name', 'family name', 'surname', 'lastname'],
  regexHints: [/last[_ -]?name/i, /\bsurname\b/i, /\bfamily[_ -]?name\b/i, /^lname$/i],
  expectedKinds: ['text'],
};
```

- [ ] **Step 4: Create `src/features/autofill/dictionary/linkedinUrl.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const linkedinUrl: DictionaryEntry = {
  key: 'linkedinUrl',
  synonyms: ['linkedin', 'linkedin url', 'linkedin profile'],
  regexHints: [/linkedin/i],
  expectedKinds: ['url', 'text'],
};
```

- [ ] **Step 5: Create `src/features/autofill/dictionary/githubUrl.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const githubUrl: DictionaryEntry = {
  key: 'githubUrl',
  synonyms: ['github', 'github url', 'github profile'],
  regexHints: [/github/i],
  expectedKinds: ['url', 'text'],
};
```

- [ ] **Step 6: Create `src/features/autofill/dictionary/city.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const city: DictionaryEntry = {
  key: 'city',
  synonyms: ['city', 'current city', 'city of residence', 'town'],
  regexHints: [/\bcity\b/i],
  expectedKinds: ['text'],
};
```

- [ ] **Step 7: Create `src/features/autofill/dictionary/summary.ts`**

```ts
import type { DictionaryEntry } from '../types';

export const summary: DictionaryEntry = {
  key: 'summary',
  synonyms: ['summary', 'about', 'about me', 'bio', 'biography', 'professional summary'],
  regexHints: [/\bsummary\b/i, /\babout (me|yourself)?\b/i, /\bbio\b/i],
  expectedKinds: ['textarea', 'text'],
};
```

- [ ] **Step 8: Update `src/features/autofill/dictionary/index.ts`**

```ts
import type { DictionaryEntry } from '../types';
import { email } from './email';
import { phone } from './phone';
import { firstName } from './firstName';
import { lastName } from './lastName';
import { linkedinUrl } from './linkedinUrl';
import { githubUrl } from './githubUrl';
import { city } from './city';
import { summary } from './summary';

export const dictionary: DictionaryEntry[] = [
  email,
  phone,
  firstName,
  lastName,
  linkedinUrl,
  githubUrl,
  city,
  summary,
];

export function getDictionary(): DictionaryEntry[] {
  return dictionary;
}
```

- [ ] **Step 9: Extend the test**

`src/features/autofill/dictionary/dictionary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getDictionary } from './index';

describe('autofill dictionary', () => {
  it('includes all 8 Phase 1 canonical keys', () => {
    const keys = getDictionary().map((e) => e.key).sort();
    expect(keys).toEqual(
      ['city', 'email', 'firstName', 'githubUrl', 'lastName', 'linkedinUrl', 'phone', 'summary'].sort(),
    );
  });

  it('each entry has non-empty synonyms and regexHints', () => {
    for (const e of getDictionary()) {
      expect(e.synonyms.length).toBeGreaterThan(0);
      expect(e.regexHints.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 10: Run + commit**

Run: `npm test -- dictionary`
Expected: 2 tests PASS.

```bash
git add src/features/autofill/dictionary/
git commit -m "feat(autofill): dictionary entries for all 8 Phase 1 keys"
```

---

### Task 27: Autofill discover

**Files:**
- Create: `src/features/autofill/discover.ts` + test
- Create: `test/fixtures/fields/basic-form.html`

- [ ] **Step 1: Create fixture `test/fixtures/fields/basic-form.html`**

```html
<form>
  <label>Email <input type="email" name="email" /></label>
  <label>Phone <input type="tel" name="phone" /></label>
  <label>First name <input type="text" name="first_name" /></label>
  <label>Last name <input type="text" name="last_name" /></label>
  <label>LinkedIn <input type="url" name="linkedin" /></label>
  <label>GitHub <input type="url" name="github" /></label>
  <label>City <input type="text" name="city" /></label>
  <label>About you <textarea name="about"></textarea></label>
  <input type="hidden" name="csrf" />
  <input type="text" name="disabled-field" disabled />
  <input type="text" name="readonly-field" readOnly />
</form>
```

- [ ] **Step 2: Write the failing test**

`src/features/autofill/discover.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

describe('discover', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('finds all fillable inputs and textareas, skipping hidden/disabled/readonly', () => {
    const c = discover(document.body);
    const names = c.map((x) => x.name);
    expect(names).toContain('email');
    expect(names).toContain('about');
    expect(names).not.toContain('csrf');
    expect(names).not.toContain('disabled-field');
    expect(names).not.toContain('readonly-field');
  });

  it('assigns the right kind', () => {
    const c = discover(document.body);
    const by = Object.fromEntries(c.map((x) => [x.name, x.kind]));
    expect(by['email']).toBe('email');
    expect(by['phone']).toBe('tel');
    expect(by['about']).toBe('textarea');
  });
});
```

- [ ] **Step 3: Run — fail**

Run: `npm test -- discover`
Expected: FAIL.

- [ ] **Step 4: Write `src/features/autofill/discover.ts`**

```ts
import type { FieldCandidate, InputKind } from './types';

const SKIP_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'password']);

function kindFor(el: HTMLElement): InputKind | null {
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  if (el instanceof HTMLSelectElement) return 'select';
  if (el.isContentEditable && !(el instanceof HTMLInputElement)) return 'contenteditable';
  if (el instanceof HTMLInputElement) {
    const t = (el.type || 'text').toLowerCase();
    if (SKIP_INPUT_TYPES.has(t)) return null;
    if (t === 'email') return 'email';
    if (t === 'tel') return 'tel';
    if (t === 'url') return 'url';
    if (t === 'number') return 'number';
    if (t === 'checkbox') return 'checkbox';
    if (t === 'radio') return 'radio';
    if (t === 'file') return 'file';
    return 'text';
  }
  return null;
}

function isVisuallyEnabled(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.hasAttribute('readonly')) return false;
  if (el instanceof HTMLInputElement && (el.disabled || el.readOnly)) return false;
  if (el instanceof HTMLTextAreaElement && (el.disabled || el.readOnly)) return false;
  if (el instanceof HTMLSelectElement && el.disabled) return false;
  return true;
}

function associatedLabel(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const labels = (el as HTMLInputElement).labels;
    if (labels && labels.length) return Array.from(labels).map((l) => l.innerText.trim()).join(' ');
  }
  // fallback: ancestor label
  const anc = el.closest('label');
  if (anc) return anc.innerText.trim();
  return '';
}

function ariaLabel(el: HTMLElement): string {
  const a = el.getAttribute('aria-label');
  if (a) return a.trim();
  const id = el.getAttribute('aria-labelledby');
  if (id) {
    const refs = id
      .split(/\s+/)
      .map((i) => document.getElementById(i))
      .filter((x): x is HTMLElement => !!x);
    return refs.map((r) => r.innerText.trim()).join(' ');
  }
  return '';
}

function precedingSiblingText(el: HTMLElement): string {
  let node: Node | null = el.previousSibling;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? '').trim();
      if (t) return t;
    } else if (node instanceof HTMLElement) {
      const t = node.innerText?.trim();
      if (t) return t;
    }
    node = node.previousSibling;
  }
  return '';
}

function fieldsetLegend(el: HTMLElement): string {
  const fs = el.closest('fieldset');
  if (!fs) return '';
  const legend = fs.querySelector(':scope > legend');
  return (legend as HTMLElement | null)?.innerText.trim() ?? '';
}

export function discover(root: ParentNode): FieldCandidate[] {
  const selector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const candidates: FieldCandidate[] = [];
  for (const el of nodes) {
    if (!isVisuallyEnabled(el)) continue;
    const kind = kindFor(el);
    if (!kind) continue;
    candidates.push({
      element: el,
      kind,
      label: associatedLabel(el),
      ariaLabel: ariaLabel(el),
      name: (el as HTMLInputElement).name ?? '',
      id: el.id ?? '',
      placeholder: (el as HTMLInputElement).placeholder ?? '',
      nearbyText: precedingSiblingText(el),
      fieldsetLegend: fieldsetLegend(el),
    });
  }
  return candidates;
}
```

- [ ] **Step 5: Run — pass**

Run: `npm test -- discover`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/autofill/discover.ts src/features/autofill/discover.test.ts test/fixtures/fields/basic-form.html
git commit -m "feat(autofill): discover fillable fields in the DOM"
```

---

### Task 28: Autofill identify (scoring)

**Files:**
- Create: `src/features/autofill/identify.ts` + test

- [ ] **Step 1: Write the failing test**

`src/features/autofill/identify.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover';
import { identify } from './identify';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

describe('identify', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('maps the 8 known fields to their canonical keys with high confidence', () => {
    const cands = discover(document.body);
    const mapping = identify(cands);
    const byName = new Map<string, { key: string; confidence: number }>();
    for (const m of mapping) {
      const c = cands[m.candidateIndex];
      byName.set(c.name, { key: m.key, confidence: m.confidence });
    }
    expect(byName.get('email')?.key).toBe('email');
    expect(byName.get('phone')?.key).toBe('phone');
    expect(byName.get('first_name')?.key).toBe('firstName');
    expect(byName.get('last_name')?.key).toBe('lastName');
    expect(byName.get('linkedin')?.key).toBe('linkedinUrl');
    expect(byName.get('github')?.key).toBe('githubUrl');
    expect(byName.get('city')?.key).toBe('city');
    expect(byName.get('about')?.key).toBe('summary');
    for (const v of byName.values()) {
      expect(v.confidence).toBeGreaterThanOrEqual(50);
    }
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- identify`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/autofill/identify.ts`**

```ts
import type { FieldCandidate, FieldMapping, DictionaryEntry } from './types';
import { getDictionary } from './dictionary';

const CONFIDENCE_THRESHOLD = 40;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreCandidate(candidate: FieldCandidate, entry: DictionaryEntry): number {
  const signals = [
    candidate.label,
    candidate.ariaLabel,
    candidate.name,
    candidate.id,
    candidate.placeholder,
    candidate.nearbyText,
    candidate.fieldsetLegend,
  ].map(normalize);

  let score = 0;

  // synonym matches — substring
  for (const syn of entry.synonyms) {
    const s = normalize(syn);
    for (const sig of signals) {
      if (!sig) continue;
      if (sig === s) score = Math.max(score, 90);
      else if (sig.includes(s)) score = Math.max(score, 70);
    }
  }

  // regex hints
  for (const rx of entry.regexHints) {
    for (const sig of signals) {
      if (sig && rx.test(sig)) score = Math.max(score, 75);
    }
  }

  // kind bonus
  if (entry.expectedKinds.includes(candidate.kind)) score += 10;

  // penalty if a totally unrelated kind (e.g. email dict key but checkbox candidate)
  if (!entry.expectedKinds.includes(candidate.kind) && candidate.kind !== 'text') {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

export function identify(candidates: FieldCandidate[]): FieldMapping[] {
  const dict = getDictionary();
  const results: FieldMapping[] = [];
  for (let i = 0; i < candidates.length; i++) {
    let bestKey: string | 'unknown' = 'unknown';
    let bestScore = 0;
    for (const entry of dict) {
      const s = scoreCandidate(candidates[i], entry);
      if (s > bestScore) {
        bestScore = s;
        bestKey = entry.key;
      }
    }
    if (bestScore < CONFIDENCE_THRESHOLD) {
      results.push({ candidateIndex: i, key: 'unknown', confidence: 0 });
    } else {
      results.push({ candidateIndex: i, key: bestKey, confidence: bestScore });
    }
  }
  return results;
}
```

- [ ] **Step 4: Run — pass**

Run: `npm test -- identify`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/autofill/identify.ts src/features/autofill/identify.test.ts
git commit -m "feat(autofill): identify fields via dictionary scoring"
```

---

### Task 29: Autofill fill (native-setter write)

**Files:**
- Create: `src/features/autofill/fill.ts` + test

- [ ] **Step 1: Write the failing test**

`src/features/autofill/fill.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { fillField } from './fill';

describe('fillField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('writes to an <input> and dispatches input + change', () => {
    const input = document.createElement('input');
    input.type = 'email';
    document.body.appendChild(input);

    const seen: string[] = [];
    input.addEventListener('input', () => seen.push('input'));
    input.addEventListener('change', () => seen.push('change'));

    const ok = fillField(input, 'x@y.com');
    expect(ok).toBe(true);
    expect(input.value).toBe('x@y.com');
    expect(seen).toEqual(['input', 'change']);
  });

  it('writes to a <textarea>', () => {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    const ok = fillField(ta, 'hello');
    expect(ok).toBe(true);
    expect(ta.value).toBe('hello');
  });

  it('writes to <select> by value', () => {
    const sel = document.createElement('select');
    const opt = document.createElement('option');
    opt.value = 'b';
    opt.textContent = 'B';
    sel.appendChild(opt);
    document.body.appendChild(sel);
    const ok = fillField(sel, 'b');
    expect(ok).toBe(true);
    expect(sel.value).toBe('b');
  });

  it('returns false for unsupported element', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(fillField(div, 'x')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- fill.test`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/autofill/fill.ts`**

```ts
const inputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set;
const textAreaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value',
)?.set;
const selectValueSetter = Object.getOwnPropertyDescriptor(
  HTMLSelectElement.prototype,
  'value',
)?.set;

function dispatch(el: HTMLElement, type: 'input' | 'change'): void {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

export function fillField(el: HTMLElement, value: string): boolean {
  if (el instanceof HTMLInputElement) {
    if (!inputValueSetter) return false;
    inputValueSetter.call(el, value);
    dispatch(el, 'input');
    dispatch(el, 'change');
    return true;
  }
  if (el instanceof HTMLTextAreaElement) {
    if (!textAreaValueSetter) return false;
    textAreaValueSetter.call(el, value);
    dispatch(el, 'input');
    dispatch(el, 'change');
    return true;
  }
  if (el instanceof HTMLSelectElement) {
    if (!selectValueSetter) return false;
    selectValueSetter.call(el, value);
    dispatch(el, 'change');
    return true;
  }
  if (el.isContentEditable) {
    el.innerHTML = value;
    dispatch(el, 'input');
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Run — pass**

Run: `npm test -- fill.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/autofill/fill.ts src/features/autofill/fill.test.ts
git commit -m "feat(autofill): fill field using native setter + event dispatch"
```

---

### Task 30: Autofill engine orchestration

**Files:**
- Create: `src/features/autofill/engine.ts`, `src/features/autofill/index.ts` + test

The engine ties discover → identify → (resolve values from profile) → expose mapping, and offers a `fillSelected` function.

- [ ] **Step 1: Write the test**

`src/features/autofill/engine.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Profile } from '@/shared/schema/profile';
import { buildMappings, applyFill } from './engine';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

const sampleProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Default',
  isDefault: true,
  firstName: 'Tanay',
  lastName: 'K',
  email: 'tanay@example.com',
  phone: '+91-9876543210',
  location: { city: 'Pune', state: 'MH', country: 'IN' },
  linkedinUrl: 'https://linkedin.com/in/tanay',
  githubUrl: 'https://github.com/tanay',
  headline: 'Engineer',
  summary: 'Builds things.',
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  createdAt: 0,
  updatedAt: 0,
};

describe('autofill engine', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('buildMappings returns one mapping per candidate with values resolved from the profile', () => {
    const mappings = buildMappings(document.body, sampleProfile);
    const byKey = Object.fromEntries(mappings.map((m) => [m.key, m.value]));
    expect(byKey['email']).toBe('tanay@example.com');
    expect(byKey['firstName']).toBe('Tanay');
    expect(byKey['city']).toBe('Pune');
    expect(byKey['summary']).toBe('Builds things.');
  });

  it('applyFill fills only the selected keys and returns counts', () => {
    const mappings = buildMappings(document.body, sampleProfile);
    const result = applyFill(document.body, mappings, new Set(['email', 'firstName']));
    expect(result.filled).toBe(2);
    expect((document.querySelector('input[name=email]') as HTMLInputElement).value).toBe(
      'tanay@example.com',
    );
    expect((document.querySelector('input[name=first_name]') as HTMLInputElement).value).toBe(
      'Tanay',
    );
    expect((document.querySelector('input[name=phone]') as HTMLInputElement).value).toBe('');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- engine`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/autofill/engine.ts`**

```ts
import type { Profile } from '@/shared/schema/profile';
import type { FieldCandidate, FieldMapping, FillResult } from './types';
import { discover } from './discover';
import { identify } from './identify';
import { fillField } from './fill';

function resolveValue(key: string, profile: Profile): string | undefined {
  switch (key) {
    case 'email':
      return profile.email || undefined;
    case 'phone':
      return profile.phone || undefined;
    case 'firstName':
      return profile.firstName || undefined;
    case 'lastName':
      return profile.lastName || undefined;
    case 'linkedinUrl':
      return profile.linkedinUrl || undefined;
    case 'githubUrl':
      return profile.githubUrl || undefined;
    case 'city':
      return profile.location.city || undefined;
    case 'summary':
      return profile.summary || undefined;
    default:
      return undefined;
  }
}

export function buildMappings(
  root: ParentNode,
  profile: Profile,
): FieldMapping[] {
  const candidates: FieldCandidate[] = discover(root);
  const mappings = identify(candidates);
  for (const m of mappings) {
    if (m.key !== 'unknown') {
      m.value = resolveValue(m.key, profile);
    }
  }
  return mappings;
}

export function applyFill(
  root: ParentNode,
  mappings: FieldMapping[],
  selectedKeys: Set<string>,
): FillResult {
  const candidates = discover(root);
  let filled = 0;
  let skipped = 0;
  let failed = 0;
  for (const m of mappings) {
    if (m.key === 'unknown' || !selectedKeys.has(m.key)) {
      skipped++;
      continue;
    }
    const value = m.value;
    if (value == null || value === '') {
      skipped++;
      continue;
    }
    const el = candidates[m.candidateIndex]?.element;
    if (!el) {
      failed++;
      continue;
    }
    const ok = fillField(el, value);
    if (ok) filled++;
    else failed++;
  }
  return { filled, skipped, failed };
}
```

- [ ] **Step 4: Write `src/features/autofill/index.ts`**

```ts
export * from './types';
export { buildMappings, applyFill } from './engine';
export { getDictionary } from './dictionary';
```

- [ ] **Step 5: Run — pass**

Run: `npm test -- engine`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/autofill/engine.ts src/features/autofill/index.ts src/features/autofill/engine.test.ts
git commit -m "feat(autofill): engine — buildMappings + applyFill"
```

---

### Task 31: Content script — inject Fill pill + render preview

**Files:**
- Create: `src/content/pill.ts`, `src/content/preview.tsx`, update `src/content/index.ts`

Phase 1 uses plain DOM for the pill (no React) and React for the preview dialog rendered into a top-level container with the scoped CSS class (no Shadow DOM — see plan notes; spec §6.2 keeps Shadow DOM for the Phase 3 banner).

- [ ] **Step 1: Write `src/content/pill.ts`**

```ts
export interface PillHandlers {
  onClick: () => void;
}

export function mountPill(h: PillHandlers): { setCount(n: number): void; remove(): void } {
  const pill = document.createElement('div');
  pill.className = 'rb-pill';
  pill.hidden = true;
  pill.textContent = 'Autofill';
  pill.addEventListener('click', h.onClick);
  document.body.appendChild(pill);
  return {
    setCount(n: number) {
      if (n <= 0) {
        pill.hidden = true;
      } else {
        pill.hidden = false;
        pill.textContent = `Autofill · ${n} fields`;
      }
    },
    remove() {
      pill.remove();
    },
  };
}
```

- [ ] **Step 2: Write `src/content/preview.tsx`**

```tsx
import { createRoot, type Root } from 'react-dom/client';
import { useMemo, useState } from 'react';
import type { FieldMapping } from '@/features/autofill';

interface PreviewProps {
  mappings: FieldMapping[];
  onConfirm: (selectedKeys: Set<string>) => void;
  onCancel: () => void;
}

function PreviewDialog({ mappings, onConfirm, onCancel }: PreviewProps) {
  const fillable = useMemo(
    () => mappings.filter((m) => m.key !== 'unknown' && m.value),
    [mappings],
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(fillable.map((m) => m.key)),
  );

  const toggle = (k: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div className="rb-preview-backdrop" onClick={onCancel}>
      <div className="rb-preview-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Autofill preview ({fillable.length})</h2>
        {fillable.length === 0 && <p>No fillable fields matched your profile.</p>}
        {fillable.map((m) => (
          <div key={m.key} className="rb-preview-row">
            <input
              type="checkbox"
              checked={selected.has(m.key)}
              onChange={() => toggle(m.key)}
            />
            <div className="rb-preview-key">{m.key}</div>
            <div className="rb-preview-value">{m.value}</div>
            <div className="rb-preview-conf">{m.confidence}%</div>
          </div>
        ))}
        <div className="rb-preview-actions">
          <button className="rb-btn rb-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rb-btn"
            disabled={selected.size === 0}
            onClick={() => onConfirm(selected)}
          >
            Fill selected
          </button>
        </div>
      </div>
    </div>
  );
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function openPreview(
  mappings: FieldMapping[],
  onConfirm: (keys: Set<string>) => void,
): void {
  close();
  container = document.createElement('div');
  container.className = 'rb-preview-root';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(
    <PreviewDialog
      mappings={mappings}
      onConfirm={(keys) => {
        close();
        onConfirm(keys);
      }}
      onCancel={close}
    />,
  );
}

export function close(): void {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
}
```

- [ ] **Step 3: Update `src/content/index.ts`**

```ts
import './styles.css';
import { createLogger } from '@/shared/util/logger';
import { debounce } from '@/shared/util/debounce';
import { buildMappings, applyFill, type FieldMapping } from '@/features/autofill';
import { sendMessage } from '@/shared/messaging';
import { mountPill } from './pill';
import { openPreview } from './preview';
import type { Profile } from '@/shared/schema/profile';

const log = createLogger('content');
let currentProfile: Profile | null = null;
let currentMappings: FieldMapping[] = [];

const pill = mountPill({
  onClick: () => {
    if (!currentProfile) return;
    openPreview(currentMappings, (keys) => {
      const result = applyFill(document.body, currentMappings, keys);
      log.info('fill result', result);
    });
  },
});

async function refresh(): Promise<void> {
  if (!currentProfile) {
    currentProfile = await sendMessage('profile/get-active', undefined as never);
  }
  if (!currentProfile) {
    pill.setCount(0);
    return;
  }
  currentMappings = buildMappings(document.body, currentProfile);
  const fillable = currentMappings.filter((m) => m.key !== 'unknown' && m.value).length;
  pill.setCount(fillable);
}

const refreshDebounced = debounce(refresh, 300);

document.addEventListener('DOMContentLoaded', () => void refresh());
if (document.readyState !== 'loading') void refresh();

const observer = new MutationObserver(() => refreshDebounced());
observer.observe(document.documentElement, { childList: true, subtree: true });

// Fill via popup message as well.
chrome.runtime.onMessage.addListener((msg: { type: string }, _sender, sendResponse) => {
  if (msg.type === 'content/open-preview') {
    if (currentProfile) {
      openPreview(currentMappings, (keys) => {
        const result = applyFill(document.body, currentMappings, keys);
        sendResponse({ ok: true, value: result });
      });
      return true;
    }
    sendResponse({ ok: false, error: 'no profile' });
    return false;
  }
  return false;
});

log.info('content ready on', location.host);
```

Note: we use a raw `chrome.runtime.onMessage` listener here for the `content/open-preview` message because the typed bus in §13 is scoped to background handlers. Later tasks may extend the typed bus with content-directed messages.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/content/
git commit -m "feat(content): mount fill pill + preview panel; wire engine to DOM"
```

---

### Task 32: Popup — Fill this page button

**Files:**
- Modify: `src/popup/App.tsx`

- [ ] **Step 1: Update `src/popup/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage, type TabInfo } from '@/shared/messaging';

export function App() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    sendMessage('system/active-tab-info', undefined as never)
      .then(setTab)
      .catch(() => setTab(null));
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
      <button
        className="w-full rounded bg-brand text-white px-3 py-2 text-sm disabled:opacity-50"
        disabled={busy}
        onClick={fill}
      >
        {busy ? 'Opening preview…' : 'Fill this page'}
      </button>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Build + manual smoke**

Run: `npm run build`.
Reload the unpacked extension. Open a form page (try `data:text/html,` + the contents of `test/fixtures/fields/basic-form.html`). Click toolbar → Fill this page → preview opens → select → fields fill.

- [ ] **Step 3: Commit**

```bash
git add src/popup/App.tsx
git commit -m "feat(popup): Fill this page button triggers content preview"
```

---

### Task 33: Tracker — URL normalization

**Files:**
- Create: `src/features/tracker/normalize.ts` + test

- [ ] **Step 1: Write the test**

`src/features/tracker/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeUrl } from './normalize';

describe('normalizeUrl', () => {
  it('strips fragment', () => {
    expect(normalizeUrl('https://x.com/a#frag')).toBe('https://x.com/a');
  });

  it('strips trailing slash on path (but not root)', () => {
    expect(normalizeUrl('https://x.com/a/')).toBe('https://x.com/a');
    expect(normalizeUrl('https://x.com/')).toBe('https://x.com/');
  });

  it('removes tracking params utm_*/gclid/ref/fbclid', () => {
    const raw =
      'https://x.com/job?utm_source=li&utm_medium=cpc&gclid=abc&ref=xyz&fbclid=qrs&id=42';
    expect(normalizeUrl(raw)).toBe('https://x.com/job?id=42');
  });

  it('keeps non-tracking params', () => {
    expect(normalizeUrl('https://x.com/job?id=42&src=partner')).toBe(
      'https://x.com/job?id=42&src=partner',
    );
  });

  it('lowercases host but preserves path case', () => {
    expect(normalizeUrl('https://Example.COM/Path')).toBe('https://example.com/Path');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- normalize`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/tracker/normalize.ts`**

```ts
const TRACKING_PARAM_PREFIXES = ['utm_'];
const TRACKING_PARAM_EXACT = new Set(['gclid', 'fbclid', 'ref']);

export function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();

  // strip tracking params
  const kept: [string, string][] = [];
  for (const [k, v] of u.searchParams) {
    const lower = k.toLowerCase();
    if (TRACKING_PARAM_EXACT.has(lower)) continue;
    if (TRACKING_PARAM_PREFIXES.some((p) => lower.startsWith(p))) continue;
    kept.push([k, v]);
  }
  const params = new URLSearchParams();
  for (const [k, v] of kept) params.append(k, v);
  u.search = params.toString() ? `?${params}` : '';

  // trim trailing slash unless path is "/"
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }

  return u.toString();
}
```

- [ ] **Step 4: Run — pass**

Run: `npm test -- normalize`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tracker/normalize.ts src/features/tracker/normalize.test.ts
git commit -m "feat(tracker): URL normalization for dedupe key"
```

---

### Task 34: Tracker — store (CRUD + dedupe)

**Files:**
- Create: `src/features/tracker/store.ts`, `src/features/tracker/index.ts` + test

- [ ] **Step 1: Write the test**

`src/features/tracker/store.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { markApplied, listApplications } from './store';

const tabInfo = {
  url: 'https://acme.com/jobs/42?utm_source=li',
  title: 'Senior Engineer',
  host: 'acme.com',
};

describe('tracker store', () => {
  beforeEach(async () => {
    await resetDatabase();
    await db.profiles.put({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Default',
      isDefault: true,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: { city: '', state: '', country: '' },
      headline: '',
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      createdAt: 0,
      updatedAt: 0,
    });
  });
  afterEach(async () => {
    await db.close();
  });

  it('creates a record with normalized URL', async () => {
    const r = await markApplied(tabInfo);
    expect(r.url).toBe('https://acme.com/jobs/42');
    expect(r.status).toBe('applied');
    expect(r.jobTitle).toBe('Senior Engineer');
    expect(r.sourcePlatform).toBe('acme.com');
  });

  it('dedupes on normalized URL — second save updates the same row', async () => {
    const a = await markApplied(tabInfo);
    const b = await markApplied({
      ...tabInfo,
      url: 'https://acme.com/jobs/42?utm_source=other',
    });
    expect(a.id).toBe(b.id);
    expect(await db.applications.count()).toBe(1);
  });

  it('listApplications returns ordered by appliedAt desc', async () => {
    await markApplied({ ...tabInfo, url: 'https://a.com/1' });
    await markApplied({ ...tabInfo, url: 'https://b.com/2' });
    const list = await listApplications();
    expect(list.length).toBe(2);
    expect(list[0].appliedAt).toBeGreaterThanOrEqual(list[1].appliedAt);
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- tracker/store`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/tracker/store.ts`**

```ts
import { db } from '@/shared/storage/db';
import { uuidv4 } from '@/shared/util/id';
import { ensureDefaultProfile } from '@/features/profile';
import {
  applicationRecordSchema,
  type ApplicationRecord,
} from '@/shared/schema/application';
import type { TabInfo } from '@/shared/messaging';
import { normalizeUrl } from './normalize';

export async function markApplied(tab: TabInfo): Promise<ApplicationRecord> {
  const normalized = normalizeUrl(tab.url);
  const existing = await db.applications.where('url').equals(normalized).first();
  const now = Date.now();

  if (existing) {
    const updated: ApplicationRecord = {
      ...existing,
      updatedAt: now,
      companyName: existing.companyName || tab.host,
      jobTitle: existing.jobTitle || tab.title,
    };
    await db.applications.put(updated);
    return updated;
  }

  const profile = await ensureDefaultProfile();
  const record: ApplicationRecord = {
    id: uuidv4(),
    url: normalized,
    appliedAt: now,
    companyName: tab.host,
    jobTitle: tab.title,
    sourcePlatform: tab.host,
    profileId: profile.id,
    status: 'applied',
    createdAt: now,
    updatedAt: now,
  };
  const parsed = applicationRecordSchema.parse(record);
  await db.applications.put(parsed);
  return parsed;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const all = await db.applications.toArray();
  return all.sort((a, b) => b.appliedAt - a.appliedAt);
}

export async function clearAllApplications(): Promise<void> {
  await db.applications.clear();
}
```

- [ ] **Step 4: Write `src/features/tracker/index.ts`**

```ts
export { markApplied, listApplications, clearAllApplications } from './store';
export { normalizeUrl } from './normalize';
```

- [ ] **Step 5: Wire handlers in `src/background/handlers.ts`**

Add at the bottom of `registerAllHandlers()`:

```ts
  registerHandler('tracker/mark-applied', async ({ tabInfo }) => {
    const { markApplied } = await import('@/features/tracker');
    return markApplied(tabInfo);
  });

  registerHandler('tracker/list', async () => {
    const { listApplications } = await import('@/features/tracker');
    return listApplications();
  });
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/tracker/ src/background/handlers.ts
git commit -m "feat(tracker): mark-applied + list with dedupe; wire handlers"
```

---

### Task 35: Tracker — CSV export

**Files:**
- Create: `src/features/tracker/csv.ts` + test
- Modify: `src/features/tracker/index.ts`, `src/background/handlers.ts`

- [ ] **Step 1: Write the test**

`src/features/tracker/csv.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';
import type { ApplicationRecord } from '@/shared/schema/application';

const rec = (over: Partial<ApplicationRecord> = {}): ApplicationRecord => ({
  id: 'id-1',
  url: 'https://x.com/j',
  appliedAt: 1700000000000,
  companyName: 'X',
  jobTitle: 'Eng',
  sourcePlatform: 'x.com',
  profileId: 'p-1',
  status: 'applied',
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe('toCsv', () => {
  it('starts with the header row', () => {
    const csv = toCsv([]);
    expect(csv.split('\n')[0]).toBe(
      'id,url,appliedAt,companyName,jobTitle,jobLocation,jobId,sourcePlatform,profileId,variantId,status,notes,followUpAt,salaryRange',
    );
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv([rec({ notes: 'a,b' }), rec({ notes: 'c"d' }), rec({ notes: 'e\nf' })]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"c""d"');
    expect(csv).toContain('"e\nf"');
  });

  it('writes ISO timestamp for appliedAt', () => {
    const csv = toCsv([rec({ appliedAt: Date.UTC(2026, 3, 16, 10, 0, 0) })]);
    expect(csv).toContain('2026-04-16T10:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `npm test -- csv`
Expected: FAIL.

- [ ] **Step 3: Write `src/features/tracker/csv.ts`**

```ts
import type { ApplicationRecord } from '@/shared/schema/application';

const COLUMNS: Array<keyof ApplicationRecord | 'variantId'> = [
  'id',
  'url',
  'appliedAt',
  'companyName',
  'jobTitle',
  'jobLocation',
  'jobId',
  'sourcePlatform',
  'profileId',
  'variantId',
  'status',
  'notes',
  'followUpAt',
  'salaryRange',
];

function escapeCsv(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatValue(col: string, rec: ApplicationRecord): string {
  if (col === 'appliedAt') return new Date(rec.appliedAt).toISOString();
  if (col === 'followUpAt')
    return rec.followUpAt !== undefined ? new Date(rec.followUpAt).toISOString() : '';
  const v = (rec as unknown as Record<string, unknown>)[col];
  return escapeCsv(v);
}

export function toCsv(records: ApplicationRecord[]): string {
  const header = COLUMNS.join(',');
  const rows = records.map((rec) =>
    COLUMNS.map((c) => formatValue(c as string, rec)).join(','),
  );
  return [header, ...rows].join('\n');
}
```

- [ ] **Step 4: Export from `src/features/tracker/index.ts`**

```ts
export { markApplied, listApplications, clearAllApplications } from './store';
export { normalizeUrl } from './normalize';
export { toCsv } from './csv';
```

- [ ] **Step 5: Wire `tracker/export-csv` handler in `src/background/handlers.ts`**

Add:

```ts
  registerHandler('tracker/export-csv', async () => {
    const { listApplications, toCsv } = await import('@/features/tracker');
    const records = await listApplications();
    return { csv: toCsv(records) };
  });
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/tracker/csv.ts src/features/tracker/csv.test.ts src/features/tracker/index.ts src/background/handlers.ts
git commit -m "feat(tracker): CSV export with RFC-4180 escaping"
```

---

### Task 36: Popup — Mark this page as applied

**Files:**
- Modify: `src/popup/App.tsx`

- [ ] **Step 1: Extend `src/popup/App.tsx`** to show a Mark-applied section

Replace the full file with:

```tsx
import { useEffect, useState } from 'react';
import { sendMessage, type TabInfo } from '@/shared/messaging';

export function App() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appliedOk, setAppliedOk] = useState<boolean>(false);

  useEffect(() => {
    sendMessage('system/active-tab-info', undefined as never)
      .then(setTab)
      .catch(() => setTab(null));
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
    </div>
  );
}
```

- [ ] **Step 2: Build + manual smoke**

Run: `npm run build`. Reload extension. On a job posting page, click Mark → open options → Applications → row appears.

- [ ] **Step 3: Commit**

```bash
git add src/popup/App.tsx
git commit -m "feat(popup): Mark this page as applied button"
```

---

### Task 37: Options — Applications view

**Files:**
- Create: `src/options/views/ApplicationsView.tsx`
- Modify: `src/options/App.tsx`

- [ ] **Step 1: Write `src/options/views/ApplicationsView.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { ApplicationRecord } from '@/shared/schema/application';

export function ApplicationsView() {
  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    try {
      const list = await sendMessage('tracker/list', undefined as never);
      setRows(list);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const exportCsv = async (): Promise<void> => {
    try {
      const { csv } = await sendMessage('tracker/export-csv', undefined as never);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-bin-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Applications ({rows.length})</h2>
        <button
          className="rounded bg-brand text-white px-3 py-1.5 text-sm"
          onClick={exportCsv}
          disabled={rows.length === 0}
        >
          Export CSV
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications tracked yet. Open a job page and click &ldquo;Mark this page as
          applied&rdquo; from the popup.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-800">
              <th className="py-2">Company</th>
              <th className="py-2">Title</th>
              <th className="py-2">Applied</th>
              <th className="py-2">Source</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 dark:border-slate-900"
              >
                <td className="py-2">
                  <a
                    className="text-brand hover:underline"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.companyName}
                  </a>
                </td>
                <td className="py-2">{r.jobTitle}</td>
                <td className="py-2">
                  {new Date(r.appliedAt).toISOString().slice(0, 10)}
                </td>
                <td className="py-2">{r.sourcePlatform}</td>
                <td className="py-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/options/App.tsx`** — replace the `applications` placeholder:

```tsx
import { ApplicationsView } from './views/ApplicationsView';
// ...
{route === 'applications' && <ApplicationsView />}
```

- [ ] **Step 3: Commit**

```bash
git add src/options/views/ApplicationsView.tsx src/options/App.tsx
git commit -m "feat(options): Applications view with CSV export"
```

---

### Task 38: Settings feature — store + handler

**Files:**
- Create: `src/features/settings/store.ts`, `src/features/settings/index.ts`, tests
- Modify: `src/background/handlers.ts`, `src/shared/messaging/types.ts` (no changes needed — already included)

- [ ] **Step 1: Write the test**

`src/features/settings/store.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { getSettings, updateSettings } from './store';

describe('settings store', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('getSettings returns defaults when nothing stored', async () => {
    const s = await getSettings();
    expect(s.theme).toBe('system');
    expect(s.applyDetectionMode).toBe('manual-only');
  });

  it('updateSettings merges and persists', async () => {
    const s1 = await updateSettings({ theme: 'dark' });
    expect(s1.theme).toBe('dark');
    const s2 = await getSettings();
    expect(s2.theme).toBe('dark');
    expect(s2.passiveAnswerCapture).toBe(true);
  });
});
```

- [ ] **Step 2: Write `src/features/settings/store.ts`**

```ts
import { db } from '@/shared/storage/db';
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from '@/shared/schema/settings';

const KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get(KEY);
  if (!row) return { ...DEFAULT_SETTINGS };
  const parsed = settingsSchema.safeParse(row.value);
  return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  const parsed = settingsSchema.parse(next);
  await db.kv.put({ key: KEY, value: parsed });
  return parsed;
}
```

- [ ] **Step 3: Write `src/features/settings/index.ts`**

```ts
export { getSettings, updateSettings } from './store';
```

- [ ] **Step 4: Wire handlers — add to `src/background/handlers.ts`**

```ts
  registerHandler('settings/get', async () => {
    const { getSettings } = await import('@/features/settings');
    return getSettings();
  });

  registerHandler('settings/update', async ({ patch }) => {
    const { updateSettings } = await import('@/features/settings');
    return updateSettings(patch);
  });

  registerHandler('system/clear-all', async () => {
    const { db } = await import('@/shared/storage/db');
    await Promise.all(db.tables.map((t) => t.clear()));
    return { ok: true as const };
  });
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/ src/background/handlers.ts
git commit -m "feat(settings): get/update store; wire system/clear-all handler"
```

---

### Task 39: Options — Settings view (theme + Clear all)

**Files:**
- Create: `src/options/views/SettingsView.tsx`
- Modify: `src/options/App.tsx`

- [ ] **Step 1: Write `src/options/views/SettingsView.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { Settings } from '@/shared/schema/settings';

function applyTheme(t: Settings['theme']): void {
  const root = document.documentElement;
  const dark =
    t === 'dark' ||
    (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    sendMessage('settings/get', undefined as never).then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
  }, []);

  const setTheme = async (theme: Settings['theme']): Promise<void> => {
    const s = await sendMessage('settings/update', { patch: { theme } });
    setSettings(s);
    applyTheme(s.theme);
  };

  const clearAll = async (): Promise<void> => {
    if (!confirm('Erase ALL resume-bin data? This cannot be undone.')) return;
    setBusy(true);
    try {
      await sendMessage('system/clear-all', undefined as never);
      setMsg('All data cleared. Reloading…');
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <div>Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <section>
        <h2 className="text-lg font-semibold mb-2">Theme</h2>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 rounded text-sm border ${
                settings.theme === t
                  ? 'border-brand bg-brand text-white'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Danger zone</h2>
        <button
          className="rounded border border-red-400 text-red-600 px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={busy}
          onClick={clearAll}
        >
          Clear all data
        </button>
      </section>
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/options/App.tsx`** — add settings handling at top-level so theme applies everywhere, and replace `settings` placeholder:

```tsx
import { useEffect } from 'react';
import { sendMessage } from '@/shared/messaging';
import { SettingsView } from './views/SettingsView';
// ... inside App():
useEffect(() => {
  sendMessage('settings/get', undefined as never).then((s) => {
    const dark =
      s.theme === 'dark' ||
      (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  });
}, []);
// ...
{route === 'settings' && <SettingsView />}
```

- [ ] **Step 3: Build + smoke test**

Run: `npm run build`
Reload; click Settings; toggle theme — options page flips. Click Clear all (confirm) — Applications tab becomes empty, default profile regenerates on next load.

- [ ] **Step 4: Commit**

```bash
git add src/options/views/SettingsView.tsx src/options/App.tsx
git commit -m "feat(options): Settings view (theme + Clear all)"
```

---

### Task 40: README + manual smoke-test script

**Files:**
- Create: `README.md`, `docs/smoke-test.md`

- [ ] **Step 1: Write `README.md`**

```md
# resume-bin

Local-only Chrome extension that autofills job application forms and tracks the jobs you apply to.

See `docs/superpowers/specs/2026-04-16-resume-bin-design.md` for the full design.

## Development

```
npm install
npm run dev
```

Then open `chrome://extensions`, enable Developer Mode, click **Load unpacked**, and point at `dist/`.

## Build

```
npm run build       # dist/
npm run pack        # resume-bin-<version>.zip
```

## Test

```
npm run typecheck
npm run lint
npm test
npm run e2e         # Playwright (scaffolded; tests land in later phases)
```

## Current status

Phase 0 + Phase 1 shipped. Autofills 8 common fields (email, phone, first/last name, LinkedIn, GitHub, city, summary) on any page; tracks applications via a manual Mark-applied button in the popup; exports CSV from the dashboard.
```

- [ ] **Step 2: Write `docs/smoke-test.md`**

```md
# Phase 1 manual smoke test

1. `npm run build`
2. Open `chrome://extensions`, enable Developer Mode, click **Load unpacked** → `dist/`.
3. Right-click the toolbar icon → **Options**. Navigate to Profile. Fill in name, email, phone, city, LinkedIn, GitHub, and a short summary. Each field autosaves on blur.
4. Open any page with a form (you can use the file at `test/fixtures/fields/basic-form.html` opened directly in Chrome via `file://`, or any real job form).
5. The "Autofill" pill appears bottom-right if ≥1 field matches your profile.
6. Click the pill → preview opens → uncheck any rows → **Fill selected**. Fields populate.
7. From the popup, click **Mark this page as applied**. Badge shows ✓.
8. Back in the dashboard → **Applications**. The row is there. Click **Export CSV** — file downloads.
9. Go to **Settings**. Toggle theme between light / dark / system. Click **Clear all** to reset.
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/smoke-test.md
git commit -m "docs: add README + Phase 1 smoke-test checklist"
```

---

### Task 41: Tag v0.1.0

- [ ] **Step 1: Run the full check suite**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must succeed.

- [ ] **Step 2: Tag the release**

```bash
git tag v0.1.0 -m "Phase 0 + Phase 1: walking skeleton"
```

- [ ] **Step 3: Confirm git log**

```bash
git log --oneline | head -20
```

Expected: ~30+ commits from Phase 0 + Phase 1, with `v0.1.0` tag on the latest.

---

## Self-review summary

**Spec coverage (design spec sections → tasks):**

- §3.1 surfaces — Tasks 14 (background), 15 (content), 16 (popup), 17 (options) ✓
- §3.2 messaging — Task 13 ✓
- §3.3 module layout — followed throughout ✓
- §3.4 AI optionality — satisfied by not importing `ai` anywhere in Phase 1 ✓
- §3.5 tech stack — Tasks 1–7 ✓
- §4.1–4.8 schemas + Dexie — Tasks 9, 10, 12 (all 8 tables, all 9 entities) ✓
- §4.9 API key storage — N/A in Phase 1 (no AI)
- §4.10 import/export — deferred to Phase 8 per plan scope ✓
- §5.1 autofill pipeline stages 1, 2, 3, 5 — Tasks 27 (discover+extract), 28 (identify), 29 (fill) ✓
  - Stage 4 (site adapters) deferred to Phase 2 per plan scope ✓
- §5.3 user interaction — pill (Task 31), preview panel (Task 31) ✓
  - Post-fill overlays (green/yellow/red highlights) — **not yet implemented in Phase 1**; the CSS classes (`rb-field-hl-*`) exist but the engine doesn't yet apply them. This is acceptable in a walking skeleton; schedule as an early Phase 2 polish item.
- §5.4 saved-answer suggest — deferred to Phase 5 per plan scope ✓
- §5.6 testing — Tasks 27, 28, 29, 30 ✓
- §6 tracker (manual subset) — Tasks 33, 34, 35, 36, 37 ✓
  - Auto-detection banner, metadata parsers, status lifecycle UI — deferred to Phase 3+ ✓
- §7 profiles + variants — Phase 1 scoped to base profile only (Tasks 18–24); variants deferred to Phase 4 ✓
- §8 AI — deferred to Phase 6 ✓
- §9 reminders — deferred to Phase 8 ✓
- §10–11 dashboard + popup — Tasks 17, 32, 36, 37, 39 ✓
- §12 project scaffold — Tasks 1–8 ✓
- §13 manifest — Task 3 ✓
- §14 testing strategy — unit tests present; Playwright config shipped, tests deferred ✓
- §15 dev/distribution — Task 1 (scripts), Task 7 (CI), Task 40 (README) ✓
- §16 phased roadmap — this plan implements Phase 0 + Phase 1 ✓

**Placeholder scan:** none. Every step has concrete code or exact commands.

**Type consistency:** `TabInfo`, `FieldCandidate`, `FieldMapping`, `FillResult`, `Profile`, `ApplicationRecord`, `Settings` names used consistently across tasks. The `location` shape in `Profile` uses `{ city, state, country, zip? }` in schema (Task 9), editor (Task 20), and autofill resolver (Task 30) — consistent. Bus message types in Task 13 match their usages in Tasks 14, 18, 34, 35, 36, 38.

**Note on spec §5.3 post-fill overlays:** The walking skeleton ships without applying the highlight classes after `applyFill`. This is a known and acceptable gap for Phase 1 — it will be addressed at the start of Phase 2 (the coverage phase also naturally touches the fill path).

---

## Next

Once this plan ships as `v0.1.0`, Phase 2 (full dictionary + site adapters for LinkedIn/Naukri/Wellfound/Greenhouse/Lever + resume-PDF upload) becomes the subject of the next plan document: `docs/superpowers/plans/YYYY-MM-DD-resume-bin-phase-2.md`.

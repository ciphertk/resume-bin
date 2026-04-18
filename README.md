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

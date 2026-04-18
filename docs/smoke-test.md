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

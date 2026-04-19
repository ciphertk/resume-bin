import { registerHandler } from '@/shared/messaging';
import { ensureDefaultProfile, getActiveProfile, updateActiveProfile } from '@/features/profile';
import { markApplied, autoMarkApplied, listApplications, toCsv } from '@/features/tracker';
import { getSettings, updateSettings, addIgnorePattern } from '@/features/settings';
import { db } from '@/shared/storage/db';

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

  registerHandler('tracker/mark-applied', async ({ tabInfo }) => {
    return markApplied(tabInfo);
  });

  registerHandler('tracker/list', async () => {
    return listApplications();
  });

  registerHandler('tracker/export-csv', async () => {
    const records = await listApplications();
    return { csv: toCsv(records) };
  });

  registerHandler('settings/get', async () => {
    return getSettings();
  });

  registerHandler('settings/update', async ({ patch }) => {
    return updateSettings(patch);
  });

  registerHandler('settings/add-ignore-pattern', async ({ pattern }) => {
    return addIgnorePattern(pattern);
  });

  registerHandler('tracker/auto-apply', async ({ url, title, meta }) => {
    return autoMarkApplied(url, title, meta);
  });

  registerHandler('system/clear-all', async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    return { ok: true as const };
  });
}

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

  registerHandler('tracker/mark-applied', async ({ tabInfo }) => {
    const { markApplied } = await import('@/features/tracker');
    return markApplied(tabInfo);
  });

  registerHandler('tracker/list', async () => {
    const { listApplications } = await import('@/features/tracker');
    return listApplications();
  });

  registerHandler('tracker/export-csv', async () => {
    const { listApplications, toCsv } = await import('@/features/tracker');
    const records = await listApplications();
    return { csv: toCsv(records) };
  });
}

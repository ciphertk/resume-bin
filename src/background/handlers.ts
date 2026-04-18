import { registerHandler } from '@/shared/messaging';

export function registerAllHandlers(): void {
  registerHandler('system/active-tab-info', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    const u = new URL(tab.url);
    return { url: tab.url, title: tab.title ?? '', host: u.host };
  });
}

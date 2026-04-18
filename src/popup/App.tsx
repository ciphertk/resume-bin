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

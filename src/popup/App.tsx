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

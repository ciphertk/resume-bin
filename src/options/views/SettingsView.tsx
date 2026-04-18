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
    if (!window.confirm('Erase ALL resume-bin data? This cannot be undone.')) return;
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

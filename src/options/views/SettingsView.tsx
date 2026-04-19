import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { Settings } from '@/shared/schema/settings';
import { Icon } from '@/shared/ui/Icon';

function applyTheme(t: Settings['theme']): void {
  const dark =
    t === 'dark' ||
    (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

type ThemeOption = {
  k: Settings['theme'];
  label: string;
  icon: 'sun' | 'moon' | 'globe';
  previewBg: string;
  previewAccent: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { k: 'light',  label: 'Light',  icon: 'sun',  previewBg: 'hsl(0 0% 100%)', previewAccent: 'hsl(21.75 65.64% 55.49%)' },
  { k: 'dark',   label: 'Dark',   icon: 'moon', previewBg: 'hsl(270 5.56% 7.06%)', previewAccent: 'hsl(22.3 75.51% 61.57%)' },
  { k: 'system', label: 'System', icon: 'globe', previewBg: 'linear-gradient(90deg, hsl(0 0% 100%) 50%, hsl(270 5.56% 7.06%) 50%)', previewAccent: 'hsl(21.75 65.64% 55.49%)' },
];

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    sendMessage('settings/get', undefined as never).then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    }).catch(() => {});
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

  if (!settings) {
    return <div className="text-rb-muted text-sm font-mono">Loading…</div>;
  }

  return (
    <div className="max-w-[720px] space-y-8">
      {/* Page header */}
      <div>
        <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">Settings</div>
        <h1 className="font-display text-5xl font-normal tracking-tight leading-tight text-rb-text m-0">
          Make it <em className="italic" style={{ color: 'hsl(var(--rb-accent-ink))' }}>yours</em>
        </h1>
        <p className="text-sm text-rb-dim mt-2">
          Everything lives on this device. No accounts, no sync, no telemetry.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-rb-border bg-rb-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
            style={{ color: 'hsl(var(--rb-accent-ink))', background: 'hsl(var(--rb-accent-soft))', borderColor: 'hsl(22.3 80% 88%)' }}
          >
            theme
          </span>
          <span className="font-semibold text-sm text-rb-text">Appearance</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const on = settings.theme === opt.k;
            return (
              <button
                key={opt.k}
                onClick={() => void setTheme(opt.k)}
                className="p-0 rounded-2xl overflow-hidden cursor-pointer text-left transition-all"
                style={{
                  border: `2px solid ${on ? 'hsl(var(--rb-accent))' : 'hsl(var(--rb-border2))'}`,
                  background: 'hsl(var(--rb-surface))',
                  boxShadow: on ? '0 0 0 4px hsl(var(--rb-accent-soft))' : 'none',
                }}
              >
                <div style={{ height: 80, background: opt.previewBg, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', bottom: 12, left: 12,
                    width: 28, height: 28, borderRadius: 8, background: opt.previewAccent,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }} />
                </div>
                <div className="px-3.5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={opt.icon} size={14} color="hsl(var(--rb-dim))" />
                    <span className="text-[13px] font-medium text-rb-text">{opt.label}</span>
                  </div>
                  {on && <Icon name="check" size={14} color="hsl(var(--rb-accent-ink))" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Ignored sites */}
      <section className="rounded-2xl border border-rb-border bg-rb-surface p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
            style={{ color: 'hsl(var(--rb-accent-ink))', background: 'hsl(var(--rb-accent-soft))', borderColor: 'hsl(22.3 80% 88%)' }}
          >
            detection
          </span>
          <span className="font-semibold text-sm text-rb-text">Ignored sites</span>
        </div>
        <p className="text-xs text-rb-muted m-0">
          Sites where the "Applied?" banner will never appear. Patterns are matched against the page URL.
        </p>
        {(settings.ignoredApplyPatterns ?? []).length === 0 ? (
          <p className="text-xs text-rb-dim italic">No ignored sites yet. Use the "Not a job app" button on any page to add one.</p>
        ) : (
          <ul className="space-y-2 m-0 p-0 list-none">
            {(settings.ignoredApplyPatterns ?? []).map((pattern) => (
              <li key={pattern} className="flex items-center justify-between gap-2 rounded-lg border border-rb-border px-3 py-2" style={{ background: 'hsl(var(--rb-surface2))' }}>
                <span className="text-xs font-mono text-rb-text truncate">{pattern}</span>
                <button
                  onClick={async () => {
                    const s = await sendMessage('settings/update', {
                      patch: { ignoredApplyPatterns: (settings.ignoredApplyPatterns ?? []).filter((p) => p !== pattern) },
                    });
                    setSettings(s);
                  }}
                  className="shrink-0 text-rb-muted hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-1"
                  aria-label={`Remove ${pattern}`}
                >
                  <Icon name="x" size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone */}
      <section
        className="rounded-2xl p-5"
        style={{ background: 'hsl(0 84% 94%)', border: '1px solid hsl(0 72% 80%)' }}
      >
        <div className="flex items-baseline gap-3 mb-3">
          <h3 className="m-0 text-base font-semibold" style={{ color: 'hsl(0 72% 45%)' }}>
            Danger zone
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-70" style={{ color: 'hsl(0 72% 45%)' }}>
            irreversible
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] m-0 opacity-90" style={{ color: 'hsl(0 72% 45%)' }}>
            Erase all profiles, applications, and settings from this device.
          </p>
          <button
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-xs font-medium cursor-pointer transition-opacity disabled:opacity-50"
            style={{
              border: '1px solid hsl(0 72% 45%)',
              background: 'transparent',
              color: 'hsl(0 72% 45%)',
              fontFamily: 'inherit',
            }}
            disabled={busy}
            onClick={clearAll}
          >
            <Icon name="trash" size={12} color="hsl(0 72% 45%)" />
            Clear all data
          </button>
        </div>
        {msg && <p className="mt-3 text-xs font-mono" style={{ color: 'hsl(0 72% 45%)' }}>{msg}</p>}
      </section>
    </div>
  );
}

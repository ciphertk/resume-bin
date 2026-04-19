import { useEffect, useState } from 'react';
import { sendMessage, type TabInfo } from '@/shared/messaging';
import type { Profile } from '@/shared/schema/profile';
import { Icon } from '@/shared/ui/Icon';
import { Logo } from '@/shared/ui/Logo';
import { CopyPanel } from './CopyPanel';

export function App() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedOk, setAppliedOk] = useState(false);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    sendMessage('system/active-tab-info', undefined as never).then(setTab).catch(() => setTab(null));
    sendMessage('profile/get-active', undefined as never).then(setProfile).catch(() => setProfile(null));
    sendMessage('settings/get', undefined as never).then((s) => {
      const mode = s?.theme ?? 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
    }).catch(() => {});
    sendMessage('tracker/list', undefined as never).then((list) => {
      setAppCount(Array.isArray(list) ? list.length : 0);
    }).catch(() => {});
  }, []);

  const fill = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!active?.id) throw new Error('no active tab');
      await chrome.tabs.sendMessage(active.id, { type: 'content/open-preview' });
      window.close();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const markApplied = async (): Promise<void> => {
    if (!tab) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage('tracker/mark-applied', { url: tab.url, tabInfo: tab });
      setAppliedOk(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const hostInitial = tab?.host?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="w-[360px] bg-rb-bg text-rb-text flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-rb-border">
        <div className="flex items-center gap-2.5">
          <Logo size={22} color="hsl(var(--rb-text))" accent="hsl(var(--rb-accent))" />
          <div>
            <div className="text-sm font-semibold tracking-tight leading-none">resume-bin</div>
            <div className="text-[10px] text-rb-muted font-mono uppercase tracking-widest mt-0.5">
              Local · v0.1.0
            </div>
          </div>
        </div>
        <button
          className="w-7 h-7 rounded-lg flex items-center justify-center text-rb-muted hover:text-rb-text hover:bg-rb-surface2 transition-colors"
          onClick={() => chrome.runtime.openOptionsPage()}
          title="Settings"
        >
          <Icon name="gear" size={15} />
        </button>
      </div>

      {/* Active tab */}
      <div className="px-[18px] pt-3.5 pb-1.5">
        <div className="text-[10px] text-rb-muted font-mono uppercase tracking-widest mb-2">
          Active tab
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] bg-rb-surface border border-rb-border">
          <div
            className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[11px] font-semibold font-mono shrink-0"
            style={{ background: 'hsl(var(--rb-accent-soft))', color: 'hsl(var(--rb-accent-ink))' }}
          >
            {hostInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate leading-tight">
              {tab?.title?.replace(/ *[|\-–—].+$/, '') || 'No active tab'}
            </div>
            <div className="text-[11px] text-rb-muted font-mono truncate leading-tight mt-0.5">
              {tab?.host ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-[18px] pt-3.5 pb-2.5 flex flex-col gap-2">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
          style={{
            background: 'hsl(var(--rb-accent))',
            color: 'white',
            boxShadow: '0 1px 0 hsl(var(--rb-accent-ink)) inset, 0 4px 12px hsl(var(--rb-accent) / 0.3)',
          }}
          disabled={busy}
          onClick={fill}
        >
          <Icon name="zap" size={15} color="white" />
          Fill this page
          <span
            className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            ⌘ ⇧ F
          </span>
        </button>

        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium border transition-all disabled:opacity-50"
          style={
            appliedOk
              ? { background: 'hsl(180 20% 92%)', borderColor: 'hsl(180 17.59% 35%)', color: 'hsl(180 17.59% 35%)' }
              : { background: 'hsl(var(--rb-surface))', borderColor: 'hsl(var(--rb-border2))', color: 'hsl(var(--rb-text))' }
          }
          disabled={busy || !tab}
          onClick={markApplied}
        >
          <Icon name={appliedOk ? 'check' : 'briefcase'} size={14} />
          {appliedOk ? 'Tracked in applications' : 'Mark this page as applied'}
        </button>
      </div>

      {error && (
        <p className="mx-[18px] text-[11px] text-red-500 font-mono">{error}</p>
      )}

      {/* Copy panel */}
      <div className="px-[18px] pb-[18px]">
        {profile && <CopyPanel profile={profile} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-[18px] py-2.5 border-t border-rb-border bg-rb-surface2">
        <span className="text-[10px] text-rb-muted font-mono tracking-wide">
          {appCount} tracked · all local
        </span>
        <button
          className="text-[10px] font-mono"
          style={{ color: 'hsl(var(--rb-accent-ink))' }}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          open applications →
        </button>
      </div>
    </div>
  );
}

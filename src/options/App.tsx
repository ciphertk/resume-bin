import { useEffect, useState } from 'react';
import { useRoute, type Route } from './router';
import { sendMessage } from '@/shared/messaging';
import { Icon } from '@/shared/ui/Icon';
import { Logo } from '@/shared/ui/Logo';
import { ProfileEditor } from '@/features/profile/ui/ProfileEditor';
import { ApplicationsView } from './views/ApplicationsView';
import { SettingsView } from './views/SettingsView';
import { VariantsView } from './views/VariantsView';

type NavItem = { key: Route; label: string; icon: 'user' | 'briefcase' | 'gear' | 'sliders' };

const NAV: NavItem[] = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'applications', label: 'Applications', icon: 'briefcase' },
  { key: 'variants', label: 'Variants', icon: 'sliders' },
  { key: 'settings', label: 'Settings', icon: 'gear' },
];

export function App() {
  const [route, go] = useRoute();
  const [appCount, setAppCount] = useState<number | null>(null);

  useEffect(() => {
    sendMessage('settings/get', undefined as never).then((s) => {
      const dark =
        s.theme === 'dark' ||
        (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
    }).catch(() => {});

    sendMessage('tracker/list', undefined as never).then((list) => {
      setAppCount(Array.isArray(list) ? list.length : 0);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex h-full bg-rb-bg text-rb-text font-sans">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-rb-border flex flex-col bg-rb-surface2">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] pt-7 pb-5 border-b border-rb-border">
          <Logo size={26} color="hsl(var(--rb-text))" accent="hsl(var(--rb-accent))" />
          <div>
            <div className="text-sm font-semibold tracking-tight leading-none">resume-bin</div>
            <div className="text-[10px] text-rb-muted font-mono uppercase tracking-widest mt-0.5">
              Local-only · v0.1
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="px-[18px] pt-4 flex-1">
          <div className="text-[10px] text-rb-muted font-mono uppercase tracking-widest mb-2.5 px-2.5">
            Workspace
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((n) => {
              const on = route === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-left cursor-pointer border transition-all"
                  style={
                    on
                      ? {
                          background: 'hsl(var(--rb-surface))',
                          color: 'hsl(var(--rb-text))',
                          borderColor: 'hsl(var(--rb-border))',
                          boxShadow: '0 1px 4px hsl(0 0% 0% / 0.05)',
                        }
                      : {
                          background: 'transparent',
                          color: 'hsl(var(--rb-dim))',
                          borderColor: 'transparent',
                        }
                  }
                >
                  <Icon
                    name={n.icon}
                    size={15}
                    color={on ? 'hsl(var(--rb-accent-ink))' : 'hsl(var(--rb-muted))'}
                  />
                  <span className="flex-1">{n.label}</span>
                  {n.key === 'applications' && appCount !== null && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={
                        on
                          ? { background: 'hsl(var(--rb-accent-soft))', color: 'hsl(var(--rb-accent-ink))' }
                          : { background: 'hsl(var(--rb-surface3))', color: 'hsl(var(--rb-muted))' }
                      }
                    >
                      {appCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Shortcut hint */}
        <div className="mx-[18px] mb-6 p-3.5 rounded-xl bg-rb-surface border border-rb-border">
          <div className="text-[10px] text-rb-muted font-mono uppercase tracking-widest mb-2">
            Shortcut
          </div>
          <p className="text-xs text-rb-text leading-relaxed">
            Press{' '}
            <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rb-surface2 border border-rb-border">
              ⌘⇧F
            </code>{' '}
            on any application form to fill.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-9 overflow-auto">
        {route === 'profile' && <ProfileEditor />}
        {route === 'applications' && <ApplicationsView />}
        {route === 'variants' && <VariantsView />}
        {route === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

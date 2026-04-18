import { useEffect } from 'react';
import { useRoute, type Route } from './router';
import { sendMessage } from '@/shared/messaging';
import { ProfileEditor } from '@/features/profile/ui/ProfileEditor';
import { ApplicationsView } from './views/ApplicationsView';
import { SettingsView } from './views/SettingsView';

const NAV: { key: Route; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'applications', label: 'Applications' },
  { key: 'settings', label: 'Settings' },
];

export function App() {
  const [route, go] = useRoute();

  useEffect(() => {
    sendMessage('settings/get', undefined as never).then((s) => {
      const dark =
        s.theme === 'dark' ||
        (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
    });
  }, []);

  return (
    <div className="flex h-full">
      <aside className="w-56 border-r border-slate-200 dark:border-slate-800 p-4 space-y-1">
        <div className="text-xs uppercase text-slate-500 mb-3">resume-bin</div>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => go(n.key)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm ${
              route === n.key
                ? 'bg-brand text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {n.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {route === 'profile' && <ProfileEditor />}
        {route === 'applications' && <ApplicationsView />}
        {route === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

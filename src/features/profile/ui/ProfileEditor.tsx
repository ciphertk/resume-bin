import { useState } from 'react';
import { useProfileForm } from '../useProfileForm';
import { PersonalSection } from './PersonalSection';

const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'links', label: 'Links' },
  { key: 'prefs', label: 'Preferences' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ProfileEditor() {
  const { profile, loading, error, save } = useProfileForm();
  const [tab, setTab] = useState<TabKey>('personal');

  if (loading) return <div>Loading profile…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!profile) return <div>No profile.</div>;

  return (
    <div className="max-w-2xl">
      <nav className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? 'border-b-2 border-brand text-brand'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'personal' && <PersonalSection profile={profile} save={save} />}
      {tab === 'links' && <div className="text-slate-500">(Task 21)</div>}
      {tab === 'prefs' && <div className="text-slate-500">(Task 22)</div>}
      {tab === 'summary' && <div className="text-slate-500">(Task 23)</div>}
      {tab === 'skills' && <div className="text-slate-500">(Task 24)</div>}
    </div>
  );
}

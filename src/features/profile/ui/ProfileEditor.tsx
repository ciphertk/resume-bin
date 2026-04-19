import { useState } from 'react';
import { useProfileForm } from '../useProfileForm';
import { PersonalSection } from './PersonalSection';
import { LinksSection } from './LinksSection';
import { PreferencesSection } from './PreferencesSection';
import { SummarySection } from './SummarySection';
import { SkillsSection } from './SkillsSection';
import { WorkExperienceSection } from './WorkExperienceSection';
import { EducationSection } from './EducationSection';
import { FilesSection } from './FilesSection';

const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'links', label: 'Links' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'prefs', label: 'Preferences' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
  { key: 'files', label: 'Files' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ProfileEditor() {
  const { profile, loading, error, save } = useProfileForm();
  const [tab, setTab] = useState<TabKey>('personal');

  if (loading) return <div className="text-rb-muted text-sm font-mono">Loading profile…</div>;
  if (error) return <div className="text-red-500 text-sm font-mono">Error: {error}</div>;
  if (!profile) return <div className="text-rb-muted text-sm">No profile.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">Profile</div>
        <h1 className="font-display text-5xl font-normal tracking-tight leading-tight text-rb-text m-0">
          Your <em className="italic" style={{ color: 'hsl(var(--rb-accent))' }}>details</em>
        </h1>
      </div>

      {/* Tab bar */}
      <nav className="flex gap-0.5 p-1 rounded-xl" style={{ background: 'hsl(var(--rb-surface2))' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer border-none transition-all"
            style={
              tab === t.key
                ? {
                    background: 'hsl(var(--rb-surface))',
                    color: 'hsl(var(--rb-text))',
                    boxShadow: '0 1px 3px hsl(0 0% 0% / 0.08)',
                  }
                : {
                    background: 'transparent',
                    color: 'hsl(var(--rb-muted))',
                  }
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'personal' && <PersonalSection profile={profile} save={save} />}
        {tab === 'links' && <LinksSection profile={profile} save={save} />}
        {tab === 'experience' && <WorkExperienceSection profile={profile} save={save} />}
        {tab === 'education' && <EducationSection profile={profile} save={save} />}
        {tab === 'prefs' && <PreferencesSection profile={profile} save={save} />}
        {tab === 'summary' && <SummarySection profile={profile} save={save} />}
        {tab === 'skills' && <SkillsSection profile={profile} save={save} />}
        {tab === 'files' && <FilesSection profile={profile} save={save} />}
      </div>
    </div>
  );
}

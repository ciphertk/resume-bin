import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';

export function SkillsSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');

  const addSkill = (): void => {
    const v = draft.trim();
    if (!v) return;
    if (profile.skills.includes(v)) {
      setDraft('');
      return;
    }
    void save({ skills: [...profile.skills, v] });
    setDraft('');
  };

  const removeSkill = (s: string): void => {
    void save({ skills: profile.skills.filter((x) => x !== s) });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Skills</h2>
      <div className="flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs"
          >
            {s}
            <button
              className="text-slate-400 hover:text-red-600"
              onClick={() => removeSkill(s)}
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
          placeholder="Add a skill and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <button
          className="rounded bg-brand text-white px-3 py-1.5 text-sm"
          onClick={addSkill}
        >
          Add
        </button>
      </div>
    </section>
  );
}

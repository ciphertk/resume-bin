import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';
import { Icon } from '@/shared/ui/Icon';

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
      <div className="flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-rb-border"
            style={{ background: 'hsl(var(--rb-surface2))', color: 'hsl(var(--rb-text))' }}
          >
            {s}
            <button
              className="flex items-center text-rb-muted hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-0"
              onClick={() => removeSkill(s)}
              aria-label={`Remove ${s}`}
            >
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        {profile.skills.length === 0 && (
          <span className="text-sm text-rb-muted">No skills added yet.</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-rb-border bg-rb-surface px-3 py-2 text-sm text-rb-text placeholder:text-rb-muted focus:outline-none focus:border-rb-accent transition-colors"
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
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border-none cursor-pointer"
          style={{ background: 'hsl(var(--rb-accent))', color: 'white' }}
          onClick={addSkill}
        >
          <Icon name="plus" size={14} color="white" />
          Add
        </button>
      </div>
    </section>
  );
}

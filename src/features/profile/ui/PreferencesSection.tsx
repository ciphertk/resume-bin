import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function PreferencesSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const numberOrUndef = (v: string): number | undefined =>
    v.trim() === '' ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Preferences</h2>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Work authorization"
          value={profile.workAuthorization ?? ''}
          onCommit={(v) => save({ workAuthorization: v })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!profile.willingToRelocate}
            onChange={(e) => void save({ willingToRelocate: e.target.checked })}
          />
          <span className="text-sm">Willing to relocate</span>
        </label>
        <TextField
          label="Notice period (days)"
          type="number"
          value={profile.noticePeriodDays?.toString() ?? ''}
          onCommit={(v) => save({ noticePeriodDays: numberOrUndef(v) })}
        />
        <TextField
          label="Current CTC (annual)"
          type="number"
          value={profile.currentCtcAnnual?.toString() ?? ''}
          onCommit={(v) => save({ currentCtcAnnual: numberOrUndef(v) })}
        />
        <TextField
          label="Expected CTC (annual)"
          type="number"
          value={profile.expectedCtcAnnual?.toString() ?? ''}
          onCommit={(v) => save({ expectedCtcAnnual: numberOrUndef(v) })}
        />
        <TextField
          label="Desired start date"
          value={profile.desiredStartDate ?? ''}
          onCommit={(v) => save({ desiredStartDate: v })}
          placeholder="YYYY-MM-DD"
        />
      </div>
    </section>
  );
}

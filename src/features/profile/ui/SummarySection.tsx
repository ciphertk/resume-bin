import type { Profile } from '@/shared/schema/profile';
import { TextField, TextAreaField } from './field';

export function SummarySection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <TextField
        label="Headline"
        value={profile.headline}
        onCommit={(v) => save({ headline: v })}
      />
      <TextAreaField
        label="Summary"
        rows={6}
        value={profile.summary}
        onCommit={(v) => save({ summary: v })}
      />
    </section>
  );
}

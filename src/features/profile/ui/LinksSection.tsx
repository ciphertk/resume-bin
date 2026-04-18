import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function LinksSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Links</h2>
      <div className="grid grid-cols-1 gap-3">
        <TextField
          label="LinkedIn URL"
          type="url"
          value={profile.linkedinUrl ?? ''}
          onCommit={(v) => save({ linkedinUrl: v })}
        />
        <TextField
          label="GitHub URL"
          type="url"
          value={profile.githubUrl ?? ''}
          onCommit={(v) => save({ githubUrl: v })}
        />
        <TextField
          label="Portfolio URL"
          type="url"
          value={profile.portfolioUrl ?? ''}
          onCommit={(v) => save({ portfolioUrl: v })}
        />
        <TextField
          label="Website"
          type="url"
          value={profile.websiteUrl ?? ''}
          onCommit={(v) => save({ websiteUrl: v })}
        />
        <TextField
          label="Twitter / X"
          type="url"
          value={profile.twitterUrl ?? ''}
          onCommit={(v) => save({ twitterUrl: v })}
        />
      </div>
    </section>
  );
}

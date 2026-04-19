import type { Profile } from '@/shared/schema/profile';
import { TextField } from './field';

export function PersonalSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="First name"
          value={profile.firstName}
          onCommit={(v) => save({ firstName: v })}
        />
        <TextField
          label="Last name"
          value={profile.lastName}
          onCommit={(v) => save({ lastName: v })}
        />
        <TextField
          label="Email"
          type="email"
          value={profile.email}
          onCommit={(v) => save({ email: v })}
        />
        <TextField
          label="Phone"
          type="tel"
          value={profile.phone}
          onCommit={(v) => save({ phone: v })}
        />
        <TextField
          label="City"
          value={profile.location.city}
          onCommit={(v) => save({ location: { ...profile.location, city: v } })}
        />
        <TextField
          label="State"
          value={profile.location.state}
          onCommit={(v) => save({ location: { ...profile.location, state: v } })}
        />
        <TextField
          label="Country"
          value={profile.location.country}
          onCommit={(v) => save({ location: { ...profile.location, country: v } })}
        />
        <TextField
          label="ZIP"
          value={profile.location.zip ?? ''}
          onCommit={(v) => save({ location: { ...profile.location, zip: v } })}
        />
      </div>
    </section>
  );
}

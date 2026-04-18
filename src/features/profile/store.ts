import { db } from '@/shared/storage/db';
import {
  createEmptyProfile,
  profileSchema,
  type Profile,
} from '@/shared/schema/profile';

export async function ensureDefaultProfile(): Promise<Profile> {
  const existing = await db.profiles.filter((p) => p.isDefault).first();
  if (existing) return existing;
  const fresh = createEmptyProfile('Default');
  await db.profiles.put(fresh);
  return fresh;
}

export async function getActiveProfile(): Promise<Profile | null> {
  const p = await db.profiles.filter((x) => x.isDefault).first();
  return p ?? null;
}

export async function updateActiveProfile(patch: Partial<Profile>): Promise<Profile> {
  const current = await ensureDefaultProfile();
  const next: Profile = {
    ...current,
    ...patch,
    location: patch.location ? { ...current.location, ...patch.location } : current.location,
    updatedAt: Date.now(),
  };
  const parsed = profileSchema.parse(next);
  await db.profiles.put(parsed);
  return parsed;
}

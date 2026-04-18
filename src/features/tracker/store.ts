import { db } from '@/shared/storage/db';
import { uuidv4 } from '@/shared/util/id';
import { ensureDefaultProfile } from '@/features/profile';
import {
  applicationRecordSchema,
  type ApplicationRecord,
} from '@/shared/schema/application';
import type { TabInfo } from '@/shared/messaging';
import { normalizeUrl } from './normalize';

export async function markApplied(tab: TabInfo): Promise<ApplicationRecord> {
  const normalized = normalizeUrl(tab.url);
  const existing = await db.applications.where('url').equals(normalized).first();
  const now = Date.now();

  if (existing) {
    const updated: ApplicationRecord = {
      ...existing,
      updatedAt: now,
      companyName: existing.companyName || tab.host,
      jobTitle: existing.jobTitle || tab.title,
    };
    await db.applications.put(updated);
    return updated;
  }

  const profile = await ensureDefaultProfile();
  const record: ApplicationRecord = {
    id: uuidv4(),
    url: normalized,
    appliedAt: now,
    companyName: tab.host,
    jobTitle: tab.title,
    sourcePlatform: tab.host,
    profileId: profile.id,
    status: 'applied',
    createdAt: now,
    updatedAt: now,
  };
  const parsed = applicationRecordSchema.parse(record);
  await db.applications.put(parsed);
  return parsed;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const all = await db.applications.toArray();
  return all.sort((a, b) => b.appliedAt - a.appliedAt);
}

export async function clearAllApplications(): Promise<void> {
  await db.applications.clear();
}

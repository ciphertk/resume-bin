import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { ensureDefaultProfile, getActiveProfile, updateActiveProfile } from './store';

describe('profile store', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('ensureDefaultProfile creates one if none exists', async () => {
    const p = await ensureDefaultProfile();
    expect(p.isDefault).toBe(true);
    expect((await db.profiles.count())).toBe(1);
  });

  it('ensureDefaultProfile is idempotent', async () => {
    const a = await ensureDefaultProfile();
    const b = await ensureDefaultProfile();
    expect(a.id).toBe(b.id);
  });

  it('updateActiveProfile merges a patch and bumps updatedAt', async () => {
    const before = await ensureDefaultProfile();
    const after = await updateActiveProfile({ firstName: 'Tanay' });
    expect(after.firstName).toBe('Tanay');
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
  });

  it('getActiveProfile returns the active one', async () => {
    await ensureDefaultProfile();
    const p = await getActiveProfile();
    expect(p?.isDefault).toBe(true);
  });
});

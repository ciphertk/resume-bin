import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { getSettings, updateSettings } from './store';

describe('settings store', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('getSettings returns defaults when nothing stored', async () => {
    const s = await getSettings();
    expect(s.theme).toBe('system');
    expect(s.applyDetectionMode).toBe('manual-only');
  });

  it('updateSettings merges and persists', async () => {
    const s1 = await updateSettings({ theme: 'dark' });
    expect(s1.theme).toBe('dark');
    const s2 = await getSettings();
    expect(s2.theme).toBe('dark');
    expect(s2.passiveAnswerCapture).toBe(true);
  });
});

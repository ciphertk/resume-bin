import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from './db';

describe('Dexie schema v1', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(async () => {
    await db.close();
  });

  it('opens with all tables', async () => {
    await db.open();
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'applications',
        'files',
        'kv',
        'pendingAnswerCaptures',
        'profiles',
        'reminders',
        'savedAnswers',
        'variants',
      ].sort(),
    );
  });

  it('round-trips a kv entry', async () => {
    await db.kv.put({ key: 'schemaVersion', value: 1 });
    const row = await db.kv.get('schemaVersion');
    expect(row?.value).toBe(1);
  });
});

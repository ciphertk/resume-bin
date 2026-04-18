import { db } from '@/shared/storage/db';
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from '@/shared/schema/settings';

const KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get(KEY);
  if (!row) return { ...DEFAULT_SETTINGS };
  const parsed = settingsSchema.safeParse(row.value);
  return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  const parsed = settingsSchema.parse(next);
  await db.kv.put({ key: KEY, value: parsed });
  return parsed;
}

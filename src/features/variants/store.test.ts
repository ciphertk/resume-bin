import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { saveVariant, listVariants, deleteVariant, resolveVariantForContext } from './store';
import type { Variant } from '@/shared/schema/variant';

const makeVariant = (over: Partial<Variant> = {}): Variant => ({
  id: crypto.randomUUID(),
  baseProfileId: crypto.randomUUID(),
  name: 'Test',
  priority: 1,
  matchRules: {},
  overrides: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...over,
});

describe('variant store', () => {
  beforeEach(async () => { await resetDatabase(); });
  afterEach(async () => { await db.close(); });

  it('listVariants returns empty array when nothing stored', async () => {
    expect(await listVariants()).toEqual([]);
  });

  it('saveVariant persists and listVariants returns sorted by priority', async () => {
    const v2 = makeVariant({ name: 'B', priority: 2 });
    const v1 = makeVariant({ name: 'A', priority: 1 });
    await saveVariant(v2);
    await saveVariant(v1);
    const list = await listVariants();
    expect(list[0].name).toBe('A');
    expect(list[1].name).toBe('B');
  });

  it('deleteVariant removes the record', async () => {
    const v = makeVariant();
    await saveVariant(v);
    await deleteVariant(v.id);
    expect(await listVariants()).toHaveLength(0);
  });

  it('resolveVariantForContext returns null when no variants', async () => {
    const result = await resolveVariantForContext('https://example.com');
    expect(result).toBeNull();
  });

  it('resolveVariantForContext matches by site hostname', async () => {
    const v = makeVariant({ matchRules: { sites: ['wellfound.com'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://wellfound.com/jobs/123');
    expect(result?.id).toBe(v.id);
  });

  it('resolveVariantForContext matches by jobTitleKeywords case-insensitively', async () => {
    const v = makeVariant({ matchRules: { jobTitleKeywords: ['senior'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://example.com', 'Senior Engineer');
    expect(result?.id).toBe(v.id);
  });

  it('resolveVariantForContext matches by jdKeywords', async () => {
    const v = makeVariant({ matchRules: { jdKeywords: ['bangalore'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://example.com', undefined, 'Located in Bangalore');
    expect(result?.id).toBe(v.id);
  });

  it('higher priority (lower number) variant wins over lower priority', async () => {
    const vHigh = makeVariant({ priority: 1, matchRules: { sites: ['jobs.com'] } });
    const vLow  = makeVariant({ priority: 2, matchRules: { sites: ['jobs.com'] } });
    await saveVariant(vLow);
    await saveVariant(vHigh);
    const result = await resolveVariantForContext('https://jobs.com/apply');
    expect(result?.id).toBe(vHigh.id);
  });

  it('returns null when no patterns match', async () => {
    const v = makeVariant({ matchRules: { sites: ['wellfound.com'] } });
    await saveVariant(v);
    const result = await resolveVariantForContext('https://linkedin.com/jobs/123');
    expect(result).toBeNull();
  });
});

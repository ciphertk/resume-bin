import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';
import type { ApplicationRecord } from '@/shared/schema/application';

const rec = (over: Partial<ApplicationRecord> = {}): ApplicationRecord => ({
  id: 'id-1',
  url: 'https://x.com/j',
  appliedAt: 1700000000000,
  companyName: 'X',
  jobTitle: 'Eng',
  sourcePlatform: 'x.com',
  profileId: 'p-1',
  status: 'applied',
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe('toCsv', () => {
  it('starts with the header row', () => {
    const csv = toCsv([]);
    expect(csv.split('\n')[0]).toBe(
      'id,url,appliedAt,companyName,jobTitle,jobLocation,jobId,sourcePlatform,profileId,variantId,status,notes,followUpAt,salaryRange',
    );
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv([rec({ notes: 'a,b' }), rec({ notes: 'c"d' }), rec({ notes: 'e\nf' })]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"c""d"');
    expect(csv).toContain('"e\nf"');
  });

  it('writes ISO timestamp for appliedAt', () => {
    const csv = toCsv([rec({ appliedAt: Date.UTC(2026, 3, 16, 10, 0, 0) })]);
    expect(csv).toContain('2026-04-16T10:00:00.000Z');
  });
});

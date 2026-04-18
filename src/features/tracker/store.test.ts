import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, resetDatabase } from '@/shared/storage/db';
import { markApplied, listApplications } from './store';

const tabInfo = {
  url: 'https://acme.com/jobs/42?utm_source=li',
  title: 'Senior Engineer',
  host: 'acme.com',
};

describe('tracker store', () => {
  beforeEach(async () => {
    await resetDatabase();
    await db.profiles.put({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Default',
      isDefault: true,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: { city: '', state: '', country: '' },
      headline: '',
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      createdAt: 0,
      updatedAt: 0,
    });
  });
  afterEach(async () => {
    await db.close();
  });

  it('creates a record with normalized URL', async () => {
    const r = await markApplied(tabInfo);
    expect(r.url).toBe('https://acme.com/jobs/42');
    expect(r.status).toBe('applied');
    expect(r.jobTitle).toBe('Senior Engineer');
    expect(r.sourcePlatform).toBe('acme.com');
  });

  it('dedupes on normalized URL — second save updates the same row', async () => {
    const a = await markApplied(tabInfo);
    const b = await markApplied({
      ...tabInfo,
      url: 'https://acme.com/jobs/42?utm_source=other',
    });
    expect(a.id).toBe(b.id);
    expect(await db.applications.count()).toBe(1);
  });

  it('listApplications returns ordered by appliedAt desc', async () => {
    await markApplied({ ...tabInfo, url: 'https://a.com/1' });
    await markApplied({ ...tabInfo, url: 'https://b.com/2' });
    const list = await listApplications();
    expect(list.length).toBe(2);
    expect(list[0].appliedAt).toBeGreaterThanOrEqual(list[1].appliedAt);
  });
});

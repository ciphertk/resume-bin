import { describe, it, expect } from 'vitest';
import { profileSchema, createEmptyProfile } from './profile';

describe('profileSchema', () => {
  it('accepts a fully-populated profile', () => {
    const now = Date.now();
    const result = profileSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Base',
      isDefault: true,
      firstName: 'Tanay',
      lastName: 'K',
      email: 'tanay@example.com',
      phone: '+91-9876543210',
      location: { city: 'Pune', state: 'MH', country: 'IN' },
      headline: 'Engineer',
      summary: 'Builds things.',
      workExperience: [],
      education: [],
      skills: ['typescript'],
      certifications: [],
      languages: [],
      projects: [],
      createdAt: now,
      updatedAt: now,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = profileSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Base',
      isDefault: true,
      firstName: 'X',
      lastName: 'Y',
      email: 'not-an-email',
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
    expect(result.success).toBe(false);
  });

  it('createEmptyProfile builds a valid default', () => {
    const p = createEmptyProfile();
    expect(profileSchema.safeParse(p).success).toBe(true);
    expect(p.isDefault).toBe(true);
  });
});

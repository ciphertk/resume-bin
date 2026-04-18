import { describe, it, expect } from 'vitest';
import { buildCopyFields } from './CopyPanel';
import type { Profile } from '@/shared/schema/profile';

function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Default',
    isDefault: true,
    firstName: 'Tanay',
    lastName: 'Khobragade',
    email: 'tanay@example.com',
    phone: '+91 99999 00000',
    location: { city: 'Pune', state: 'MH', country: 'India' },
    headline: 'Full stack engineer',
    summary: 'I build things.',
    linkedinUrl: 'https://linkedin.com/in/tanay',
    githubUrl: 'https://github.com/tanay',
    portfolioUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    workAuthorization: '',
    skills: ['React', 'TypeScript', 'Node.js'],
    workExperience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('buildCopyFields', () => {
  it('includes core contact fields', () => {
    const fields = buildCopyFields(makeProfile());
    const keys = fields.map((f) => f.key);
    expect(keys).toContain('firstName');
    expect(keys).toContain('email');
    expect(keys).toContain('phone');
  });

  it('includes a fullName entry', () => {
    const fields = buildCopyFields(makeProfile());
    const full = fields.find((f) => f.key === 'fullName');
    expect(full?.value).toBe('Tanay Khobragade');
  });

  it('excludes fields with empty string values', () => {
    const fields = buildCopyFields(makeProfile());
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('portfolioUrl');
    expect(keys).not.toContain('websiteUrl');
    expect(keys).not.toContain('twitterUrl');
    expect(keys).not.toContain('workAuthorization');
  });

  it('joins skills as comma-separated string', () => {
    const fields = buildCopyFields(makeProfile());
    const skills = fields.find((f) => f.key === 'skills');
    expect(skills?.value).toBe('React, TypeScript, Node.js');
  });

  it('excludes skills when array is empty', () => {
    const fields = buildCopyFields(makeProfile({ skills: [] }));
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('skills');
  });

  it('formats noticePeriodDays as "<n> days"', () => {
    const fields = buildCopyFields(makeProfile({ noticePeriodDays: 30 }));
    const notice = fields.find((f) => f.key === 'noticePeriodDays');
    expect(notice?.value).toBe('30 days');
  });

  it('excludes numeric fields when undefined', () => {
    const fields = buildCopyFields(makeProfile({ noticePeriodDays: undefined, currentCtcAnnual: undefined }));
    const keys = fields.map((f) => f.key);
    expect(keys).not.toContain('noticePeriodDays');
    expect(keys).not.toContain('currentCtcAnnual');
  });

  it('stringifies CTC fields', () => {
    const fields = buildCopyFields(makeProfile({ currentCtcAnnual: 1200000 }));
    const ctc = fields.find((f) => f.key === 'currentCtcAnnual');
    expect(ctc?.value).toBe('1200000');
  });
});

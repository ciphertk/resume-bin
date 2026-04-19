import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Profile } from '@/shared/schema/profile';
import { buildMappings, applyFill, mergeProfileWithVariant } from './engine';
import { createEmptyProfile } from '@/shared/schema/profile';
import type { Variant } from '@/shared/schema/variant';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

const sampleProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Default',
  isDefault: true,
  firstName: 'Tanay',
  lastName: 'K',
  email: 'tanay@example.com',
  phone: '+91-9876543210',
  location: { city: 'Pune', state: 'MH', country: 'IN' },
  linkedinUrl: 'https://linkedin.com/in/tanay',
  githubUrl: 'https://github.com/tanay',
  headline: 'Engineer',
  summary: 'Builds things.',
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  createdAt: 0,
  updatedAt: 0,
};

describe('autofill engine', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('buildMappings returns one mapping per candidate with values resolved from the profile', () => {
    const mappings = buildMappings(document.body, sampleProfile);
    const byKey = Object.fromEntries(mappings.map((m) => [m.key, m.value]));
    expect(byKey['email']).toBe('tanay@example.com');
    expect(byKey['firstName']).toBe('Tanay');
    expect(byKey['city']).toBe('Pune');
    expect(byKey['summary']).toBe('Builds things.');
  });

  it('applyFill fills only the selected keys and returns counts', () => {
    const mappings = buildMappings(document.body, sampleProfile);
    const selectedIndexes = new Set(
      mappings
        .filter((m) => m.key === 'email' || m.key === 'firstName')
        .map((m) => m.candidateIndex),
    );
    const result = applyFill(document.body, mappings, selectedIndexes);
    expect(result.filled).toBe(2);
    expect((document.querySelector('input[name=email]') as HTMLInputElement).value).toBe(
      'tanay@example.com',
    );
    expect((document.querySelector('input[name=first_name]') as HTMLInputElement).value).toBe(
      'Tanay',
    );
    expect((document.querySelector('input[name=phone]') as HTMLInputElement).value).toBe('');
  });
});

const baseProfile = createEmptyProfile('Base');
const makeVariant = (overrides: Variant['overrides']): Variant => ({
  id: crypto.randomUUID(),
  baseProfileId: baseProfile.id,
  name: 'Test',
  priority: 1,
  matchRules: {},
  overrides,
  createdAt: 0,
  updatedAt: 0,
});

describe('mergeProfileWithVariant', () => {
  it('returns base profile unchanged when variant is null', () => {
    const result = mergeProfileWithVariant(baseProfile, null);
    expect(result).toBe(baseProfile);
  });

  it('variant scalar override wins over base', () => {
    const profile = { ...baseProfile, firstName: 'Alice' };
    const variant = makeVariant({ firstName: 'Bob' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.firstName).toBe('Bob');
  });

  it('base value used when variant does not override that field', () => {
    const profile = { ...baseProfile, email: 'a@b.com', firstName: 'Alice' };
    const variant = makeVariant({ firstName: 'Bob' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.email).toBe('a@b.com');
  });

  it('variant skills array replaces base skills', () => {
    const profile = { ...baseProfile, skills: ['JS', 'TS'] };
    const variant = makeVariant({ skills: ['Python'] });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.skills).toEqual(['Python']);
  });

  it('base skills preserved when variant has no skills override', () => {
    const profile = { ...baseProfile, skills: ['JS', 'TS'] };
    const variant = makeVariant({ summary: 'New summary' });
    const result = mergeProfileWithVariant(profile, variant);
    expect(result.skills).toEqual(['JS', 'TS']);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Profile } from '@/shared/schema/profile';
import { buildMappings, applyFill } from './engine';

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
    const result = applyFill(document.body, mappings, new Set(['email', 'firstName']));
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

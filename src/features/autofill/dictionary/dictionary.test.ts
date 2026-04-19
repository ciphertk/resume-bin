import { describe, it, expect } from 'vitest';
import { getDictionary } from './index';

describe('autofill dictionary', () => {
  it('includes all canonical keys (Phase 1 + Phase 2)', () => {
    const keys = getDictionary().map((e) => e.key).sort();
    const expected = [
      // Phase 1
      'city', 'email', 'firstName', 'githubUrl', 'lastName', 'linkedinUrl', 'phone', 'summary',
      // Phase 2
      'fullName', 'address', 'zip', 'state', 'country',
      'workAuthorization', 'noticePeriodDays', 'currentCtcAnnual', 'expectedCtcAnnual',
      'yearsOfExperience', 'currentCompany', 'currentTitle',
      'latestDegree', 'latestInstitution',
      'portfolioUrl', 'websiteUrl', 'twitterUrl',
    ].sort();
    expect(keys).toEqual(expected);
  });

  it('each entry has non-empty synonyms and regexHints', () => {
    for (const e of getDictionary()) {
      expect(e.synonyms.length).toBeGreaterThan(0);
      expect(e.regexHints.length).toBeGreaterThan(0);
    }
  });
});

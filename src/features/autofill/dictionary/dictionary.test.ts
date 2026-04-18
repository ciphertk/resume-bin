import { describe, it, expect } from 'vitest';
import { getDictionary } from './index';

describe('autofill dictionary', () => {
  it('includes all 8 Phase 1 canonical keys', () => {
    const keys = getDictionary().map((e) => e.key).sort();
    expect(keys).toEqual(
      ['city', 'email', 'firstName', 'githubUrl', 'lastName', 'linkedinUrl', 'phone', 'summary'].sort(),
    );
  });

  it('each entry has non-empty synonyms and regexHints', () => {
    for (const e of getDictionary()) {
      expect(e.synonyms.length).toBeGreaterThan(0);
      expect(e.regexHints.length).toBeGreaterThan(0);
    }
  });
});

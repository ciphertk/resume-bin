import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover';
import { identify } from './identify';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

describe('identify', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('maps the 8 known fields to their canonical keys with high confidence', () => {
    const cands = discover(document.body);
    const mapping = identify(cands);
    const byName = new Map<string, { key: string; confidence: number }>();
    for (const m of mapping) {
      const c = cands[m.candidateIndex];
      byName.set(c.name, { key: m.key, confidence: m.confidence });
    }
    expect(byName.get('email')?.key).toBe('email');
    expect(byName.get('phone')?.key).toBe('phone');
    expect(byName.get('first_name')?.key).toBe('firstName');
    expect(byName.get('last_name')?.key).toBe('lastName');
    expect(byName.get('linkedin')?.key).toBe('linkedinUrl');
    expect(byName.get('github')?.key).toBe('githubUrl');
    expect(byName.get('city')?.key).toBe('city');
    expect(byName.get('about')?.key).toBe('summary');
    for (const v of byName.values()) {
      expect(v.confidence).toBeGreaterThanOrEqual(50);
    }
  });
});

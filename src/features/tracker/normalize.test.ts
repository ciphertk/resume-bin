import { describe, it, expect } from 'vitest';
import { normalizeUrl } from './normalize';

describe('normalizeUrl', () => {
  it('strips fragment', () => {
    expect(normalizeUrl('https://x.com/a#frag')).toBe('https://x.com/a');
  });

  it('strips trailing slash on path (but not root)', () => {
    expect(normalizeUrl('https://x.com/a/')).toBe('https://x.com/a');
    expect(normalizeUrl('https://x.com/')).toBe('https://x.com/');
  });

  it('removes tracking params utm_*/gclid/ref/fbclid', () => {
    const raw =
      'https://x.com/job?utm_source=li&utm_medium=cpc&gclid=abc&ref=xyz&fbclid=qrs&id=42';
    expect(normalizeUrl(raw)).toBe('https://x.com/job?id=42');
  });

  it('keeps non-tracking params', () => {
    expect(normalizeUrl('https://x.com/job?id=42&src=partner')).toBe(
      'https://x.com/job?id=42&src=partner',
    );
  });

  it('lowercases host but preserves path case', () => {
    expect(normalizeUrl('https://Example.COM/Path')).toBe('https://example.com/Path');
  });
});

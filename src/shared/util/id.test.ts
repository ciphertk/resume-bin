import { describe, it, expect } from 'vitest';
import { uuidv4 } from './id';

describe('uuidv4', () => {
  it('returns a v4 uuid', () => {
    const id = uuidv4();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('produces unique values', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(uuidv4());
    expect(ids.size).toBe(100);
  });
});

import { describe, it, expect } from 'vitest';
import { getDictionary } from './index';

describe('autofill dictionary', () => {
  it('includes canonical keys', () => {
    const keys = getDictionary().map((e) => e.key);
    expect(keys).toContain('email');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover';

const html = fs.readFileSync(
  path.resolve(__dirname, '../../../test/fixtures/fields/basic-form.html'),
  'utf8',
);

describe('discover', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  it('finds all fillable inputs and textareas, skipping hidden/disabled/readonly', () => {
    const c = discover(document.body);
    const names = c.map((x) => x.name);
    expect(names).toContain('email');
    expect(names).toContain('about');
    expect(names).not.toContain('csrf');
    expect(names).not.toContain('disabled-field');
    expect(names).not.toContain('readonly-field');
  });

  it('assigns the right kind', () => {
    const c = discover(document.body);
    const by = Object.fromEntries(c.map((x) => [x.name, x.kind]));
    expect(by['email']).toBe('email');
    expect(by['phone']).toBe('tel');
    expect(by['about']).toBe('textarea');
  });
});

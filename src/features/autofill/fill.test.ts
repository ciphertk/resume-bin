import { describe, it, expect, beforeEach } from 'vitest';
import { fillField } from './fill';

describe('fillField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('writes to an <input> and dispatches input + change', () => {
    const input = document.createElement('input');
    input.type = 'email';
    document.body.appendChild(input);

    const seen: string[] = [];
    input.addEventListener('input', () => seen.push('input'));
    input.addEventListener('change', () => seen.push('change'));

    const ok = fillField(input, 'x@y.com');
    expect(ok).toBe(true);
    expect(input.value).toBe('x@y.com');
    expect(seen).toEqual(['input', 'change']);
  });

  it('writes to a <textarea>', () => {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    const ok = fillField(ta, 'hello');
    expect(ok).toBe(true);
    expect(ta.value).toBe('hello');
  });

  it('writes to <select> by value', () => {
    const sel = document.createElement('select');
    const opt = document.createElement('option');
    opt.value = 'b';
    opt.textContent = 'B';
    sel.appendChild(opt);
    document.body.appendChild(sel);
    const ok = fillField(sel, 'b');
    expect(ok).toBe(true);
    expect(sel.value).toBe('b');
  });

  it('returns false for unsupported element', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(fillField(div, 'x')).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApplyDetector } from './applyDetector';

const noopMeta = () => ({ title: 'Test Job', company: 'Test Co' });

describe('applyDetector', () => {
  beforeEach(() => {
    // Reset location mock
    Object.defineProperty(window, 'location', {
      value: { href: 'https://jobs.example.com/apply/123' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Signal A: fires on form submit with ≥2 inputs on a job page', async () => {
    const onDetected = vi.fn();
    const cleanup = mountApplyDetector({ onDetected, parseMetaFn: noopMeta });

    const form = document.createElement('form');
    form.innerHTML = '<input name="name"/><input name="email"/><input name="resume"/>';
    document.body.appendChild(form);

    form.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));

    expect(onDetected).toHaveBeenCalledOnce();
    form.remove();
    cleanup();
  });

  it('Signal A: does NOT fire for a form with < 2 inputs', async () => {
    const onDetected = vi.fn();
    const cleanup = mountApplyDetector({ onDetected, parseMetaFn: noopMeta });

    const form = document.createElement('form');
    form.innerHTML = '<input name="search"/>';
    document.body.appendChild(form);

    form.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));

    expect(onDetected).not.toHaveBeenCalled();
    form.remove();
    cleanup();
  });

  it('Signal B: fires on submit button click', async () => {
    const onDetected = vi.fn();
    const cleanup = mountApplyDetector({ onDetected, parseMetaFn: noopMeta });

    const btn = document.createElement('button');
    btn.textContent = 'Apply Now';
    document.body.appendChild(btn);

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 2000));

    expect(onDetected).toHaveBeenCalledOnce();
    btn.remove();
    cleanup();
  });

  it('does not fire when URL is in ignored patterns', async () => {
    const onDetected = vi.fn();
    const cleanup = mountApplyDetector({
      onDetected,
      ignoredPatterns: ['example.com'],
      parseMetaFn: noopMeta,
    });

    const form = document.createElement('form');
    form.innerHTML = '<input/><input/><input/>';
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));

    expect(onDetected).not.toHaveBeenCalled();
    form.remove();
    cleanup();
  });

  it('does not double-fire for the same URL', async () => {
    const onDetected = vi.fn();
    const cleanup = mountApplyDetector({ onDetected, parseMetaFn: noopMeta });

    const form = document.createElement('form');
    form.innerHTML = '<input/><input/><input/>';
    document.body.appendChild(form);

    form.dispatchEvent(new Event('submit', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));

    expect(onDetected).toHaveBeenCalledOnce();
    form.remove();
    cleanup();
  });
});

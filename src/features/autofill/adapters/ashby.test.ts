import { describe, it, expect } from 'vitest';
import { ashbyAdapter } from './ashby';
import type { FieldCandidate } from '../types';

function makeCandidate(name: string): FieldCandidate {
  const el = document.createElement('input');
  el.setAttribute('name', name);
  return {
    element: el,
    kind: 'text',
    label: '',
    ariaLabel: '',
    name,
    id: '',
    placeholder: '',
    nearbyText: '',
    fieldsetLegend: '',
  };
}

describe('ashbyAdapter', () => {
  describe('matches', () => {
    it('matches jobs.ashbyhq.com URLs', () => {
      expect(ashbyAdapter.matches('https://jobs.ashbyhq.com/acme/abc123')).toBe(true);
    });
    it('does not match other URLs', () => {
      expect(ashbyAdapter.matches('https://linkedin.com/jobs')).toBe(false);
    });
  });

  describe('overrideFieldMap', () => {
    it('maps firstName name attribute to "first name" label', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('firstName')]);
      expect(result[0].label).toBe('first name');
    });
    it('maps email name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('email')]);
      expect(result[0].label).toBe('email');
    });
    it('maps linkedInUrl name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('linkedInUrl')]);
      expect(result[0].label).toBe('linkedin url');
    });
    it('maps githubUrl name attribute', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('githubUrl')]);
      expect(result[0].label).toBe('github url');
    });
    it('leaves unknown name attributes unchanged', () => {
      const result = ashbyAdapter.overrideFieldMap([makeCandidate('coverLetter')]);
      expect(result[0].label).toBe('');
    });
  });

  describe('parseJob', () => {
    it('extracts from JSON-LD JobPosting', () => {
      const doc = document.implementation.createHTMLDocument('');
      const script = doc.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@type': 'JobPosting',
        title: 'Frontend Engineer',
        hiringOrganization: { name: 'Acme Corp' },
      });
      doc.head.append(script);

      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBe('Frontend Engineer');
      expect(result.company).toBe('Acme Corp');
    });

    it('falls back to og:title / og:site_name when no JSON-LD', () => {
      const doc = document.implementation.createHTMLDocument('');
      const ogTitle = doc.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', 'Backend Engineer');
      const ogSite = doc.createElement('meta');
      ogSite.setAttribute('property', 'og:site_name');
      ogSite.setAttribute('content', 'Startup Inc');
      doc.head.append(ogTitle, ogSite);

      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBe('Backend Engineer');
      expect(result.company).toBe('Startup Inc');
    });

    it('returns empty partial when no metadata', () => {
      const doc = document.implementation.createHTMLDocument('');
      const result = ashbyAdapter.parseJob!(doc);
      expect(result.title).toBeUndefined();
      expect(result.company).toBeUndefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { workdayAdapter } from './workday';
import type { FieldCandidate } from '../types';

function makeCandidate(automationId: string): FieldCandidate {
  const el = document.createElement('input');
  el.setAttribute('data-automation-id', automationId);
  return {
    element: el,
    kind: 'text',
    label: '',
    ariaLabel: '',
    name: '',
    id: '',
    placeholder: '',
    nearbyText: '',
    fieldsetLegend: '',
  };
}

describe('workdayAdapter', () => {
  describe('matches', () => {
    it('matches myworkdayjobs.com URLs', () => {
      expect(workdayAdapter.matches('https://amazon.wd3.myworkday.com/amazon/job/12345')).toBe(true);
      expect(workdayAdapter.matches('https://microsoft.myworkdayjobs.com/en-US/microsoft_careers')).toBe(true);
    });

    it('does not match other URLs', () => {
      expect(workdayAdapter.matches('https://linkedin.com/jobs')).toBe(false);
      expect(workdayAdapter.matches('https://greenhouse.io/jobs/123')).toBe(false);
    });
  });

  describe('overrideFieldMap', () => {
    it('overrides label for legalNameSection_firstName', () => {
      const candidates = [makeCandidate('legalNameSection_firstName')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('first name');
    });

    it('overrides label for legalNameSection_lastName', () => {
      const candidates = [makeCandidate('legalNameSection_lastName')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('last name');
    });

    it('overrides label for email', () => {
      const candidates = [makeCandidate('email')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('email');
    });

    it('overrides label for phone-number', () => {
      const candidates = [makeCandidate('phone-number')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('phone');
    });

    it('overrides label for addressSection_city', () => {
      const candidates = [makeCandidate('addressSection_city')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('city');
    });

    it('leaves unknown automation-id candidates unchanged', () => {
      const candidates = [makeCandidate('howDidYouHearAboutUs')];
      const result = workdayAdapter.overrideFieldMap(candidates);
      expect(result[0].label).toBe('');
    });

    it('handles candidates with no automation-id attribute', () => {
      const el = document.createElement('input');
      const candidate: FieldCandidate = {
        element: el, kind: 'text', label: 'First name',
        ariaLabel: '', name: '', id: '', placeholder: '', nearbyText: '', fieldsetLegend: '',
      };
      const result = workdayAdapter.overrideFieldMap([candidate]);
      expect(result[0].label).toBe('First name');
    });
  });

  describe('parseJob', () => {
    it('extracts title from og:title and company from og:site_name', () => {
      const doc = document.implementation.createHTMLDocument('');
      const ogTitle = doc.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', 'Software Engineer');
      const ogSite = doc.createElement('meta');
      ogSite.setAttribute('property', 'og:site_name');
      ogSite.setAttribute('content', 'Amazon');
      doc.head.append(ogTitle, ogSite);

      const result = workdayAdapter.parseJob!(doc);
      expect(result.title).toBe('Software Engineer');
      expect(result.company).toBe('Amazon');
    });

    it('returns empty partial when no metadata present', () => {
      const doc = document.implementation.createHTMLDocument('');
      const result = workdayAdapter.parseJob!(doc);
      expect(result.title).toBeUndefined();
      expect(result.company).toBeUndefined();
    });
  });
});

import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

// Greenhouse uses <label> text matching; this adapter normalizes label text
// to canonical keys via a label-text map.
const LABEL_MAP: Record<string, string> = {
  'first name': 'first name',
  'last name': 'last name',
  'email address': 'email',
  'email': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'linkedin profile': 'linkedin url',
  'website': 'website',
  'cover letter': 'summary',
  'resume': 'resume',
  'city': 'city',
  'location': 'city',
};

export const greenhouseAdapter: SiteAdapter = {
  name: 'greenhouse',

  matches(url: string): boolean {
    return /boards\.greenhouse\.io\//i.test(url) || /greenhouse\.io\/jobs\//i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const labelKey = f.label.toLowerCase().trim();
      const override = LABEL_MAP[labelKey];
      if (override) {
        return { ...f, label: override };
      }
      return f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    const result: Partial<JobMeta> = {};

    const h1 = doc.querySelector('.app-title, h1')?.textContent?.trim();
    if (h1) result.title = h1;

    const company = doc.querySelector('.company-name, [class*="company"]')?.textContent?.trim();
    if (company) result.company = company;

    return result;
  },
};

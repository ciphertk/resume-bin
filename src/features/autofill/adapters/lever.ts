import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

// Lever uses `name` attributes like "name", "email", "phone", "org", "urls[LinkedIn]"
const FIELD_MAP: Record<string, string> = {
  name: 'full name',
  email: 'email',
  phone: 'phone',
  org: 'current company',
  'urls[LinkedIn]': 'linkedin url',
  'urls[GitHub]': 'github url',
  'urls[Portfolio]': 'portfolio',
  'urls[Other]': 'website',
  comments: 'summary',
};

export const leverAdapter: SiteAdapter = {
  name: 'lever',

  matches(url: string): boolean {
    return /jobs\.lever\.co\//i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const override = FIELD_MAP[f.name] ?? FIELD_MAP[f.id];
      if (override) {
        return { ...f, label: override };
      }
      return f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    const result: Partial<JobMeta> = {};

    const h2 = doc.querySelector('.posting-headline h2')?.textContent?.trim();
    if (h2) result.title = h2;

    const h1 = doc.querySelector('h1')?.textContent?.trim();
    if (h1 && !result.title) result.title = h1;

    const company = doc.querySelector('.main-header-logo img')?.getAttribute('alt')?.trim();
    if (company) result.company = company;

    return result;
  },
};

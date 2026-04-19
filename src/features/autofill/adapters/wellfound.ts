import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const FIELD_MAP: Record<string, string> = {
  name: 'full name',
  first_name: 'first name',
  last_name: 'last name',
  email: 'email',
  phone: 'phone',
  linkedin: 'linkedin url',
  github: 'github url',
  portfolio: 'portfolio',
  website: 'website',
  cover_letter: 'summary',
};

export const wellfoundAdapter: SiteAdapter = {
  name: 'wellfound',

  matches(url: string): boolean {
    return /wellfound\.com\/jobs\//i.test(url) || /angel\.co\/jobs\//i.test(url);
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

    const h1 = doc.querySelector('h1')?.textContent?.trim();
    if (h1) result.title = h1;

    const ogTitle = doc.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content;
    if (ogTitle && !result.title) result.title = ogTitle;

    return result;
  },
};

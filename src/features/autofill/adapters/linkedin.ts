import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const FIELD_MAP: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  phoneNumber: 'phone',
  city: 'city',
  state: 'state',
  zipCode: 'zip code',
  country: 'country',
  email: 'email',
  summary: 'summary',
  headline: 'summary',
  linkedInUrl: 'linkedin url',
  websiteUrl: 'website',
  portfolioUrl: 'portfolio',
};

export const linkedinAdapter: SiteAdapter = {
  name: 'linkedin',

  matches(url: string): boolean {
    return /linkedin\.com\/jobs\//i.test(url);
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

    const ogTitle = doc.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content;
    if (ogTitle) result.title = ogTitle;

    const h1 = doc.querySelector('h1')?.textContent?.trim();
    if (h1 && !result.title) result.title = h1;

    const jsonLd = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent ?? '');
        if (data['@type'] === 'JobPosting') {
          result.title = data.title ?? result.title;
          result.company = data.hiringOrganization?.name ?? result.company;
          result.location = data.jobLocation?.address?.addressLocality ?? result.location;
        }
      } catch {
        // ignore malformed JSON-LD
      }
    }

    return result;
  },
};

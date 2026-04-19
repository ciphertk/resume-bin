import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

// Naukri uses id/name attributes on form fields
const FIELD_MAP: Record<string, string> = {
  name: 'full name',
  fullName: 'full name',
  email: 'email',
  emailAddress: 'email',
  mobile: 'phone',
  mobileNumber: 'phone',
  phone: 'phone',
  currentCity: 'city',
  hometown: 'city',
  experience: 'years of experience',
  totalExperience: 'years of experience',
  currentCtc: 'current ctc',
  expectedCtc: 'expected ctc',
  noticePeriod: 'notice period',
  coverLetter: 'summary',
  resume: 'resume',
};

export const naukriAdapter: SiteAdapter = {
  name: 'naukri',

  matches(url: string): boolean {
    return /naukri\.com/i.test(url);
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

    const h1 = doc.querySelector('.jd-header-title, h1')?.textContent?.trim();
    if (h1) result.title = h1;

    const company = doc.querySelector('.jd-header-comp-name, [class*="comp-name"]')?.textContent?.trim();
    if (company) result.company = company;

    return result;
  },
};

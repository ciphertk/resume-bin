import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const AUTOMATION_LABEL_MAP: Record<string, string> = {
  legalNameSection_firstName: 'first name',
  legalNameSection_lastName: 'last name',
  email: 'email',
  'phone-number': 'phone',
  addressSection_city: 'city',
  addressSection_countryRegion: 'state',
  addressSection_country: 'country',
  addressSection_postalCode: 'zip',
  linkedIn: 'linkedin url',
  website: 'website',
};

export const workdayAdapter: SiteAdapter = {
  name: 'workday',

  matches(url: string): boolean {
    return /myworkdayjobs\.com|wd[35]?\.myworkday\.com/i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const automationId = f.element.getAttribute('data-automation-id') ?? '';
      const labelOverride = AUTOMATION_LABEL_MAP[automationId];
      return labelOverride ? { ...f, label: labelOverride } : f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    const result: Partial<JobMeta> = {};
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (title) result.title = title;
    const company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
    if (company) result.company = company;
    return result;
  },
};

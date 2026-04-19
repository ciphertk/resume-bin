import type { FieldCandidate, JobMeta, SiteAdapter } from '../types';

const NAME_LABEL_MAP: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  phone: 'phone',
  linkedInUrl: 'linkedin url',
  githubUrl: 'github url',
  websiteUrl: 'website',
};

export const ashbyAdapter: SiteAdapter = {
  name: 'ashby',

  matches(url: string): boolean {
    return /jobs\.ashbyhq\.com/i.test(url);
  },

  overrideFieldMap(fields: FieldCandidate[]): FieldCandidate[] {
    return fields.map((f) => {
      const labelOverride = NAME_LABEL_MAP[f.name];
      return labelOverride ? { ...f, label: labelOverride } : f;
    });
  },

  parseJob(doc: Document): Partial<JobMeta> {
    // Try JSON-LD JobPosting first
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent ?? '') as Record<string, unknown>;
        if (data['@type'] === 'JobPosting') {
          return {
            title: data['title'] as string | undefined,
            company: (data['hiringOrganization'] as Record<string, string> | undefined)?.name,
          };
        }
      } catch { /* continue to next script */ }
    }

    // Fallback: og:title / og:site_name
    const result: Partial<JobMeta> = {};
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (title) result.title = title;
    const company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
    if (company) result.company = company;
    return result;
  },
};

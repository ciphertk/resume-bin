import type { SiteAdapter } from '@/features/autofill/types';

export interface JobMeta {
  title: string;
  company: string;
  location?: string;
  jdText?: string;
}

const JD_KEYWORDS = /responsibilities|requirements|qualifications|about the role|what you.ll do|who you are|your background|skills required|about this role/i;

function extractJdText(doc: Document): string | undefined {
  const candidates = Array.from(doc.querySelectorAll('div, section, article'))
    .filter((el) => {
      const text = (el as HTMLElement).innerText ?? '';
      return text.length > 200 && JD_KEYWORDS.test(text);
    })
    .sort((a, b) => {
      const aLen = ((a as HTMLElement).innerText ?? '').length;
      const bLen = ((b as HTMLElement).innerText ?? '').length;
      return bLen - aLen;
    });

  const el = candidates[0] as HTMLElement | undefined;
  if (!el) return undefined;
  return el.innerText.trim().slice(0, 8000);
}

function fromJsonLd(doc: Document): Partial<JobMeta> {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '');
      const item = Array.isArray(data) ? data.find((d) => d['@type'] === 'JobPosting') : data;
      if (item?.['@type'] === 'JobPosting') {
        return {
          title: item.title,
          company: item.hiringOrganization?.name,
          location: item.jobLocation?.address?.addressLocality ?? item.jobLocation?.address?.addressRegion,
        };
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return {};
}

function fromOpenGraph(doc: Document): Partial<JobMeta> {
  const ogTitle = doc.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content;
  const ogSite = doc.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;
  return {
    title: ogTitle,
    company: ogSite,
  };
}

function fromH1(doc: Document): Partial<JobMeta> {
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  // Try to find a nearby company element (common patterns)
  const companyEl = doc.querySelector(
    '[class*="company"],[class*="employer"],[class*="org-name"],[data-company]',
  );
  return {
    title: h1,
    company: companyEl?.textContent?.trim(),
  };
}

export function parseJobMeta(doc: Document, adapter?: SiteAdapter): Partial<JobMeta> {
  // Priority: adapter > JSON-LD > og:title > h1
  const adapterMeta = adapter?.parseJob?.(doc) ?? {};
  const jsonLd = fromJsonLd(doc);
  const og = fromOpenGraph(doc);
  const h1 = fromH1(doc);

  const merged: Partial<JobMeta> = {
    title: adapterMeta.title ?? jsonLd.title ?? og.title ?? h1.title,
    company: adapterMeta.company ?? jsonLd.company ?? og.company ?? h1.company,
    location: adapterMeta.location ?? jsonLd.location,
    jdText: extractJdText(doc),
  };

  // Remove undefined keys
  return Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined),
  ) as Partial<JobMeta>;
}

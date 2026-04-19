import { describe, it, expect } from 'vitest';
import { parseJobMeta } from './parseJobMeta';

function makeDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('parseJobMeta', () => {
  it('extracts from JSON-LD JobPosting', () => {
    const doc = makeDoc(`
      <html><head>
        <script type="application/ld+json">${JSON.stringify({
          '@type': 'JobPosting',
          title: 'Senior Engineer',
          hiringOrganization: { name: 'Acme Corp' },
          jobLocation: { address: { addressLocality: 'San Francisco' } },
        })}</script>
      </head><body><h1>Some Other Title</h1></body></html>
    `);
    const meta = parseJobMeta(doc);
    expect(meta.title).toBe('Senior Engineer');
    expect(meta.company).toBe('Acme Corp');
    expect(meta.location).toBe('San Francisco');
  });

  it('falls back to og:title when no JSON-LD', () => {
    const doc = makeDoc(`
      <html><head>
        <meta property="og:title" content="Frontend Dev at Startup" />
        <meta property="og:site_name" content="Startup Inc" />
      </head><body><h1>Frontend Dev</h1></body></html>
    `);
    const meta = parseJobMeta(doc);
    expect(meta.title).toBe('Frontend Dev at Startup');
    expect(meta.company).toBe('Startup Inc');
  });

  it('falls back to h1 when no JSON-LD and no og tags', () => {
    const doc = makeDoc(`
      <html><body>
        <h1>Product Manager</h1>
        <div class="company-name">TechCo</div>
      </body></html>
    `);
    const meta = parseJobMeta(doc);
    expect(meta.title).toBe('Product Manager');
  });

  it('adapter result takes priority over JSON-LD', () => {
    const doc = makeDoc(`
      <html><head>
        <script type="application/ld+json">${JSON.stringify({
          '@type': 'JobPosting',
          title: 'JSON-LD Title',
          hiringOrganization: { name: 'JSON-LD Co' },
        })}</script>
      </head><body></body></html>
    `);
    const adapter = {
      name: 'test',
      matches: () => true,
      overrideFieldMap: (f: unknown[]) => f,
      parseJob: () => ({ title: 'Adapter Title', company: 'Adapter Co' }),
    };
    const meta = parseJobMeta(doc, adapter as never);
    expect(meta.title).toBe('Adapter Title');
    expect(meta.company).toBe('Adapter Co');
  });
});

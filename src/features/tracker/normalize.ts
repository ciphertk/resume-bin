const TRACKING_PARAM_PREFIXES = ['utm_'];
const TRACKING_PARAM_EXACT = new Set(['gclid', 'fbclid', 'ref']);

export function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();

  const kept: [string, string][] = [];
  for (const [k, v] of u.searchParams) {
    const lower = k.toLowerCase();
    if (TRACKING_PARAM_EXACT.has(lower)) continue;
    if (TRACKING_PARAM_PREFIXES.some((p) => lower.startsWith(p))) continue;
    kept.push([k, v]);
  }
  const params = new URLSearchParams();
  for (const [k, v] of kept) params.append(k, v);
  u.search = params.toString() ? `?${params}` : '';

  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }

  return u.toString();
}

import type { SiteAdapter } from '../types';
import { linkedinAdapter } from './linkedin';
import { naukriAdapter } from './naukri';
import { wellfoundAdapter } from './wellfound';
import { greenhouseAdapter } from './greenhouse';
import { leverAdapter } from './lever';

export const ADAPTERS: SiteAdapter[] = [
  linkedinAdapter,
  naukriAdapter,
  wellfoundAdapter,
  greenhouseAdapter,
  leverAdapter,
];

export function findAdapter(url: string): SiteAdapter | undefined {
  return ADAPTERS.find((a) => a.matches(url));
}

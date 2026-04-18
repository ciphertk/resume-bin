import type { DictionaryEntry } from '../types';

export const city: DictionaryEntry = {
  key: 'city',
  synonyms: ['city', 'current city', 'city of residence', 'town'],
  regexHints: [/\bcity\b/i],
  expectedKinds: ['text'],
};

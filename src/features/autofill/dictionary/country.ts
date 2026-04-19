import type { DictionaryEntry } from '../types';

export const country: DictionaryEntry = {
  key: 'country',
  synonyms: ['country', 'country of residence', 'nation', 'country / region'],
  regexHints: [/\bcountry\b/i, /\bnation\b/i],
  expectedKinds: ['text', 'select'],
};

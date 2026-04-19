import type { DictionaryEntry } from '../types';

export const zip: DictionaryEntry = {
  key: 'zip',
  synonyms: ['zip', 'zip code', 'postal code', 'postcode', 'pin code', 'pincode'],
  regexHints: [/zip[\s_-]?code/i, /postal[\s_-]?code/i, /\bzip\b/i, /\bpin\b/i],
  expectedKinds: ['text', 'number'],
};

import type { DictionaryEntry } from '../types';

export const linkedinUrl: DictionaryEntry = {
  key: 'linkedinUrl',
  synonyms: ['linkedin', 'linkedin url', 'linkedin profile'],
  regexHints: [/linkedin/i],
  expectedKinds: ['url', 'text'],
};

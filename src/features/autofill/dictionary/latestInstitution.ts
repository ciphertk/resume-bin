import type { DictionaryEntry } from '../types';

export const latestInstitution: DictionaryEntry = {
  key: 'latestInstitution',
  synonyms: ['college', 'university', 'school', 'institution', 'highest institution'],
  regexHints: [/\bcollege\b/i, /\buniversity\b/i, /\binstitut/i],
  expectedKinds: ['text'],
};

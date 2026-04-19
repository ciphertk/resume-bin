import type { DictionaryEntry } from '../types';

export const currentCompany: DictionaryEntry = {
  key: 'currentCompany',
  synonyms: ['current company', 'current employer', 'current organization', 'present company', 'employer'],
  regexHints: [/current\s+(company|employer|org)/i, /present\s+company/i],
  expectedKinds: ['text'],
};

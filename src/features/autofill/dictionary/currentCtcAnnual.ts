import type { DictionaryEntry } from '../types';

export const currentCtcAnnual: DictionaryEntry = {
  key: 'currentCtcAnnual',
  synonyms: [
    'current ctc', 'current salary', 'current compensation', 'current package',
    'current annual salary', 'current annual ctc', 'present ctc', 'current total compensation',
  ],
  regexHints: [/current\s+(ctc|salary|compensation|package)/i, /present\s+ctc/i],
  expectedKinds: ['text', 'number'],
};

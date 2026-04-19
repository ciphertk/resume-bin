import type { DictionaryEntry } from '../types';

export const expectedCtcAnnual: DictionaryEntry = {
  key: 'expectedCtcAnnual',
  synonyms: [
    'expected ctc', 'expected salary', 'desired salary', 'salary expectation',
    'expected compensation', 'expected package', 'salary expectation', 'expected annual ctc',
  ],
  regexHints: [/expected\s+(ctc|salary|compensation|package)/i, /desired\s+salary/i, /salary\s+expect/i],
  expectedKinds: ['text', 'number'],
};

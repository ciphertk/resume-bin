import type { DictionaryEntry } from '../types';

export const summary: DictionaryEntry = {
  key: 'summary',
  synonyms: ['summary', 'about', 'about me', 'bio', 'biography', 'professional summary'],
  regexHints: [/\bsummary\b/i, /\babout (me|yourself)?\b/i, /\bbio\b/i],
  expectedKinds: ['textarea', 'text'],
};

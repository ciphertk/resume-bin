import type { DictionaryEntry } from '../types';

export const currentTitle: DictionaryEntry = {
  key: 'currentTitle',
  synonyms: [
    'current title', 'current designation', 'current role', 'current position',
    'job title', 'designation', 'present designation',
  ],
  regexHints: [/current\s+(title|designation|role|position)/i, /job\s+title/i, /\bdesignation\b/i],
  expectedKinds: ['text'],
};

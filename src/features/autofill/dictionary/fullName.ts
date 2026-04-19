import type { DictionaryEntry } from '../types';

export const fullName: DictionaryEntry = {
  key: 'fullName',
  synonyms: ['full name', 'name', 'your name', 'applicant name', 'candidate name'],
  regexHints: [/full[\s_-]?name/i, /^name$/i],
  expectedKinds: ['text'],
};

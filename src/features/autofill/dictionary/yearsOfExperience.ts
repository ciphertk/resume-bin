import type { DictionaryEntry } from '../types';

export const yearsOfExperience: DictionaryEntry = {
  key: 'yearsOfExperience',
  synonyms: [
    'years of experience', 'total experience', 'years experience', 'experience years',
    'total years of experience', 'work experience years', 'professional experience',
  ],
  regexHints: [/years?\s+of\s+exp/i, /total\s+exp/i, /exp\s+years?/i],
  expectedKinds: ['text', 'number', 'select'],
};

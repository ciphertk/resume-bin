import type { DictionaryEntry } from '../types';

export const githubUrl: DictionaryEntry = {
  key: 'githubUrl',
  synonyms: ['github', 'github url', 'github profile'],
  regexHints: [/github/i],
  expectedKinds: ['url', 'text'],
};

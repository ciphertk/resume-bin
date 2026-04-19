import type { DictionaryEntry } from '../types';

export const websiteUrl: DictionaryEntry = {
  key: 'websiteUrl',
  synonyms: ['website', 'personal website', 'website url', 'web site', 'personal url', 'homepage'],
  regexHints: [/\bwebsite\b/i, /\bhomepage\b/i],
  expectedKinds: ['text', 'url'],
};

import type { DictionaryEntry } from '../types';

export const twitterUrl: DictionaryEntry = {
  key: 'twitterUrl',
  synonyms: ['twitter', 'twitter url', 'twitter profile', 'x profile', 'x.com'],
  regexHints: [/twitter/i, /\bx\.com\b/i],
  expectedKinds: ['text', 'url'],
};

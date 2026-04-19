import type { DictionaryEntry } from '../types';

export const portfolioUrl: DictionaryEntry = {
  key: 'portfolioUrl',
  synonyms: ['portfolio', 'portfolio url', 'portfolio website', 'portfolio link'],
  regexHints: [/portfolio/i],
  expectedKinds: ['text', 'url'],
};

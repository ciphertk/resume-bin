import type { DictionaryEntry } from '../types';

export const state: DictionaryEntry = {
  key: 'state',
  synonyms: ['state', 'province', 'region', 'state / province', 'state or province'],
  regexHints: [/\bstate\b/i, /\bprovince\b/i],
  expectedKinds: ['text', 'select'],
};

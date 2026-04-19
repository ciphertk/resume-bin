import type { DictionaryEntry } from '../types';

export const latestDegree: DictionaryEntry = {
  key: 'latestDegree',
  synonyms: ['degree', 'highest degree', 'highest qualification', 'education level', 'qualification'],
  regexHints: [/\bdegree\b/i, /highest\s+(degree|qualification)/i, /education\s+level/i],
  expectedKinds: ['text', 'select'],
};

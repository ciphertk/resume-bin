import type { DictionaryEntry } from '../types';

export const noticePeriodDays: DictionaryEntry = {
  key: 'noticePeriodDays',
  synonyms: [
    'notice period', 'notice period days', 'notice', 'how soon can you join',
    'joining notice', 'availability', 'days notice',
  ],
  regexHints: [/notice[\s_-]?period/i, /\bnotice\b/i, /joining\s+(notice|period)/i],
  expectedKinds: ['text', 'number', 'select'],
};

import type { DictionaryEntry } from '../types';

export const workAuthorization: DictionaryEntry = {
  key: 'workAuthorization',
  synonyms: [
    'work authorization', 'work authorisation', 'work permit', 'visa status',
    'visa type', 'right to work', 'employment eligibility', 'work eligibility',
    'authorization to work',
  ],
  regexHints: [/work\s+(auth|permit|visa|eligib)/i, /visa\s+status/i, /right\s+to\s+work/i],
  expectedKinds: ['text', 'select'],
};

import type { DictionaryEntry } from '../types';

export const lastName: DictionaryEntry = {
  key: 'lastName',
  synonyms: ['last name', 'family name', 'surname', 'lastname'],
  regexHints: [/last[_ -]?name/i, /\bsurname\b/i, /\bfamily[_ -]?name\b/i, /^lname$/i],
  expectedKinds: ['text'],
};

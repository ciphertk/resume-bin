import type { DictionaryEntry } from '../types';

export const firstName: DictionaryEntry = {
  key: 'firstName',
  synonyms: ['first name', 'given name', 'firstname', 'forename', 'preferred first name'],
  regexHints: [/first[_ -]?name/i, /\bgiven[_ -]?name\b/i, /^fname$/i],
  expectedKinds: ['text'],
};

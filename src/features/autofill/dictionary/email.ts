import type { DictionaryEntry } from '../types';

export const email: DictionaryEntry = {
  key: 'email',
  synonyms: ['email', 'e-mail', 'mail', 'email address', 'contact email', 'work email'],
  regexHints: [/e[- ]?mail/i, /^email$/i],
  expectedKinds: ['email', 'text'],
};

import type { DictionaryEntry } from '../types';

export const address: DictionaryEntry = {
  key: 'address',
  synonyms: ['address', 'street address', 'address line', 'home address', 'mailing address', 'residential address'],
  regexHints: [/\baddress\b/i, /street/i],
  expectedKinds: ['text', 'textarea'],
};

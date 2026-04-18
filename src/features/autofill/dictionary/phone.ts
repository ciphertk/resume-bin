import type { DictionaryEntry } from '../types';

export const phone: DictionaryEntry = {
  key: 'phone',
  synonyms: ['phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'telephone', 'cell'],
  regexHints: [/phone/i, /mobile/i, /telephone/i, /\bcell\b/i],
  expectedKinds: ['tel', 'text'],
};

import type { DictionaryEntry } from '../types';
import { email } from './email';
import { phone } from './phone';
import { firstName } from './firstName';
import { lastName } from './lastName';
import { linkedinUrl } from './linkedinUrl';
import { githubUrl } from './githubUrl';
import { city } from './city';
import { summary } from './summary';

export const dictionary: DictionaryEntry[] = [
  email,
  phone,
  firstName,
  lastName,
  linkedinUrl,
  githubUrl,
  city,
  summary,
];

export function getDictionary(): DictionaryEntry[] {
  return dictionary;
}

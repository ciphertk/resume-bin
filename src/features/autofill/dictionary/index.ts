import type { DictionaryEntry } from '../types';
import { email } from './email';

export const dictionary: DictionaryEntry[] = [email];

export function getDictionary(): DictionaryEntry[] {
  return dictionary;
}

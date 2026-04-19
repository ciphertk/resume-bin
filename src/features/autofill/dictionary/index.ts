import type { DictionaryEntry } from '../types';
import { email } from './email';
import { phone } from './phone';
import { firstName } from './firstName';
import { lastName } from './lastName';
import { linkedinUrl } from './linkedinUrl';
import { githubUrl } from './githubUrl';
import { city } from './city';
import { summary } from './summary';
import { fullName } from './fullName';
import { address } from './address';
import { zip } from './zip';
import { state } from './state';
import { country } from './country';
import { workAuthorization } from './workAuthorization';
import { noticePeriodDays } from './noticePeriodDays';
import { currentCtcAnnual } from './currentCtcAnnual';
import { expectedCtcAnnual } from './expectedCtcAnnual';
import { yearsOfExperience } from './yearsOfExperience';
import { currentCompany } from './currentCompany';
import { currentTitle } from './currentTitle';
import { latestDegree } from './latestDegree';
import { latestInstitution } from './latestInstitution';
import { portfolioUrl } from './portfolioUrl';
import { websiteUrl } from './websiteUrl';
import { twitterUrl } from './twitterUrl';

export const dictionary: DictionaryEntry[] = [
  email,
  phone,
  firstName,
  lastName,
  fullName,
  linkedinUrl,
  githubUrl,
  portfolioUrl,
  websiteUrl,
  twitterUrl,
  city,
  state,
  country,
  address,
  zip,
  summary,
  workAuthorization,
  noticePeriodDays,
  currentCtcAnnual,
  expectedCtcAnnual,
  yearsOfExperience,
  currentCompany,
  currentTitle,
  latestDegree,
  latestInstitution,
];

export function getDictionary(): DictionaryEntry[] {
  return dictionary;
}

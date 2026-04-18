import type { Profile } from '@/shared/schema/profile';

export interface CopyField {
  key: string;
  label: string;
  value: string;
}

export function buildCopyFields(profile: Profile): CopyField[] {
  const candidates: Array<{ key: string; label: string; value: string | undefined }> = [
    { key: 'firstName', label: 'First name', value: profile.firstName },
    { key: 'lastName', label: 'Last name', value: profile.lastName },
    { key: 'fullName', label: 'Full name', value: `${profile.firstName} ${profile.lastName}`.trim() },
    { key: 'email', label: 'Email', value: profile.email },
    { key: 'phone', label: 'Phone', value: profile.phone },
    { key: 'city', label: 'City', value: profile.location.city },
    { key: 'state', label: 'State', value: profile.location.state },
    { key: 'country', label: 'Country', value: profile.location.country },
    { key: 'headline', label: 'Headline', value: profile.headline },
    { key: 'summary', label: 'Summary', value: profile.summary },
    { key: 'linkedinUrl', label: 'LinkedIn', value: profile.linkedinUrl },
    { key: 'githubUrl', label: 'GitHub', value: profile.githubUrl },
    { key: 'portfolioUrl', label: 'Portfolio', value: profile.portfolioUrl },
    { key: 'websiteUrl', label: 'Website', value: profile.websiteUrl },
    { key: 'twitterUrl', label: 'Twitter', value: profile.twitterUrl },
    { key: 'workAuthorization', label: 'Work authorization', value: profile.workAuthorization },
    {
      key: 'noticePeriodDays',
      label: 'Notice period',
      value: profile.noticePeriodDays !== undefined ? `${profile.noticePeriodDays} days` : undefined,
    },
    {
      key: 'currentCtcAnnual',
      label: 'Current CTC',
      value: profile.currentCtcAnnual !== undefined ? String(profile.currentCtcAnnual) : undefined,
    },
    {
      key: 'expectedCtcAnnual',
      label: 'Expected CTC',
      value: profile.expectedCtcAnnual !== undefined ? String(profile.expectedCtcAnnual) : undefined,
    },
    {
      key: 'skills',
      label: 'Skills',
      value: profile.skills.length > 0 ? profile.skills.join(', ') : undefined,
    },
  ];

  return candidates
    .filter((c): c is { key: string; label: string; value: string } =>
      typeof c.value === 'string' && c.value.trim().length > 0,
    )
    .map(({ key, label, value }) => ({ key, label, value }));
}

import type { Profile } from '@/shared/schema/profile';
import type { FieldCandidate, FieldMapping, FillResult } from './types';
import { discover } from './discover';
import { identify } from './identify';
import { fillField } from './fill';
import { findAdapter } from './adapters/index';

function yearsFromWorkExperience(profile: Profile): number {
  let months = 0;
  const now = new Date();
  for (const exp of profile.workExperience) {
    const start = exp.startDate ? new Date(exp.startDate + '-01') : null;
    const end = exp.current ? now : (exp.endDate ? new Date(exp.endDate + '-01') : null);
    if (start && end && end >= start) {
      months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }
  }
  return Math.round(months / 12);
}

function resolveValue(key: string, profile: Profile): string | undefined {
  switch (key) {
    case 'email':
      return profile.email || undefined;
    case 'phone':
      return profile.phone || undefined;
    case 'firstName':
      return profile.firstName || undefined;
    case 'lastName':
      return profile.lastName || undefined;
    case 'fullName': {
      const full = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      return full || undefined;
    }
    case 'linkedinUrl':
      return profile.linkedinUrl || undefined;
    case 'githubUrl':
      return profile.githubUrl || undefined;
    case 'portfolioUrl':
      return profile.portfolioUrl || undefined;
    case 'websiteUrl':
      return profile.websiteUrl || undefined;
    case 'twitterUrl':
      return profile.twitterUrl || undefined;
    case 'city':
      return profile.location.city || undefined;
    case 'state':
      return profile.location.state || undefined;
    case 'country':
      return profile.location.country || undefined;
    case 'address':
      return profile.location.address || undefined;
    case 'zip':
      return profile.location.zip || undefined;
    case 'summary':
      return profile.summary || undefined;
    case 'workAuthorization':
      return profile.workAuthorization || undefined;
    case 'noticePeriodDays':
      return profile.noticePeriodDays != null ? String(profile.noticePeriodDays) : undefined;
    case 'currentCtcAnnual':
      return profile.currentCtcAnnual != null ? String(profile.currentCtcAnnual) : undefined;
    case 'expectedCtcAnnual':
      return profile.expectedCtcAnnual != null ? String(profile.expectedCtcAnnual) : undefined;
    case 'yearsOfExperience': {
      const yoe = yearsFromWorkExperience(profile);
      return yoe > 0 ? String(yoe) : undefined;
    }
    case 'currentCompany':
      return profile.workExperience[0]?.company || undefined;
    case 'currentTitle':
      return profile.workExperience[0]?.title || undefined;
    case 'latestDegree':
      return profile.education[profile.education.length - 1]?.degree || undefined;
    case 'latestInstitution':
      return profile.education[profile.education.length - 1]?.school || undefined;
    default:
      return undefined;
  }
}

export function buildMappings(
  root: ParentNode,
  profile: Profile,
  url?: string,
): FieldMapping[] {
  let candidates: FieldCandidate[] = discover(root);

  if (url) {
    const adapter = findAdapter(url);
    if (adapter) {
      candidates = adapter.overrideFieldMap(candidates);
    }
  }

  const mappings = identify(candidates);
  for (const m of mappings) {
    if (m.key !== 'unknown') {
      m.value = resolveValue(m.key, profile);
    }
  }
  return mappings;
}

export function applyFill(
  root: ParentNode,
  mappings: FieldMapping[],
  selectedIndexes: Set<number>,
): FillResult {
  const candidates = discover(root);
  let filled = 0;
  let skipped = 0;
  let failed = 0;
  for (const m of mappings) {
    if (m.key === 'unknown' || !selectedIndexes.has(m.candidateIndex)) {
      skipped++;
      continue;
    }
    const value = m.value;
    if (value == null || value === '') {
      skipped++;
      continue;
    }
    const el = candidates[m.candidateIndex]?.element;
    if (!el) {
      failed++;
      continue;
    }
    const ok = fillField(el, value);
    if (ok) filled++;
    else failed++;
  }
  return { filled, skipped, failed };
}

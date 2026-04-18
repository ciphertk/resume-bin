import type { Profile } from '@/shared/schema/profile';
import type { FieldCandidate, FieldMapping, FillResult } from './types';
import { discover } from './discover';
import { identify } from './identify';
import { fillField } from './fill';

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
    case 'linkedinUrl':
      return profile.linkedinUrl || undefined;
    case 'githubUrl':
      return profile.githubUrl || undefined;
    case 'city':
      return profile.location.city || undefined;
    case 'summary':
      return profile.summary || undefined;
    default:
      return undefined;
  }
}

export function buildMappings(
  root: ParentNode,
  profile: Profile,
): FieldMapping[] {
  const candidates: FieldCandidate[] = discover(root);
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

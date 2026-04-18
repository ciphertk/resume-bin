import type { FieldCandidate, FieldMapping, DictionaryEntry } from './types';
import { getDictionary } from './dictionary';

const CONFIDENCE_THRESHOLD = 40;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreCandidate(candidate: FieldCandidate, entry: DictionaryEntry): number {
  const signals = [
    candidate.label,
    candidate.ariaLabel,
    candidate.name,
    candidate.id,
    candidate.placeholder,
    candidate.nearbyText,
    candidate.fieldsetLegend,
  ].map(normalize);

  let score = 0;

  for (const syn of entry.synonyms) {
    const s = normalize(syn);
    for (const sig of signals) {
      if (!sig) continue;
      if (sig === s) score = Math.max(score, 90);
      else if (sig.includes(s)) score = Math.max(score, 70);
    }
  }

  for (const rx of entry.regexHints) {
    for (const sig of signals) {
      if (sig && rx.test(sig)) score = Math.max(score, 75);
    }
  }

  if (entry.expectedKinds.includes(candidate.kind)) score += 10;

  if (!entry.expectedKinds.includes(candidate.kind) && candidate.kind !== 'text') {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

export function identify(candidates: FieldCandidate[]): FieldMapping[] {
  const dict = getDictionary();
  const results: FieldMapping[] = [];
  for (let i = 0; i < candidates.length; i++) {
    let bestKey: string | 'unknown' = 'unknown';
    let bestScore = 0;
    for (const entry of dict) {
      const s = scoreCandidate(candidates[i], entry);
      if (s > bestScore) {
        bestScore = s;
        bestKey = entry.key;
      }
    }
    if (bestScore < CONFIDENCE_THRESHOLD) {
      results.push({ candidateIndex: i, key: 'unknown', confidence: 0 });
    } else {
      results.push({ candidateIndex: i, key: bestKey, confidence: bestScore });
    }
  }
  return results;
}

import { db } from '@/shared/storage/db';
import type { Variant } from '@/shared/schema/variant';
import { variantSchema } from '@/shared/schema/variant';

export async function listVariants(): Promise<Variant[]> {
  const all = await db.variants.toArray();
  return all.sort((a, b) => a.priority - b.priority);
}

export async function saveVariant(variant: Variant): Promise<Variant> {
  const record = variantSchema.parse({ ...variant, updatedAt: Date.now() });
  await db.variants.put(record);
  return record;
}

export async function deleteVariant(id: string): Promise<void> {
  await db.variants.delete(id);
}

export async function resolveVariantForContext(
  url: string,
  jobTitle?: string,
  jdText?: string,
): Promise<Variant | null> {
  const variants = await listVariants();
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { /* ignore bad URLs */ }

  for (const v of variants) {
    const { sites = [], jobTitleKeywords = [], jdKeywords = [] } = v.matchRules;

    if (hostname && sites.some((s) => hostname.includes(s))) return v;

    if (jobTitle) {
      const titleLower = jobTitle.toLowerCase();
      if (jobTitleKeywords.some((k) => titleLower.includes(k.toLowerCase()))) return v;
    }

    if (jdText) {
      const jdLower = jdText.toLowerCase();
      if (jdKeywords.some((k) => jdLower.includes(k.toLowerCase()))) return v;
    }
  }

  return null;
}

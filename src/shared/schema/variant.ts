import { z } from 'zod';
import { idSchema, baseEntitySchema } from './common';
import { profileSchema } from './profile';

export const matchRulesSchema = z.object({
  jobTitleKeywords: z.array(z.string()).optional(),
  sites: z.array(z.string()).optional(),
  jdKeywords: z.array(z.string()).optional(),
});

export const variantSchema = baseEntitySchema.extend({
  baseProfileId: idSchema,
  name: z.string().min(1),
  priority: z.number().int(),
  matchRules: matchRulesSchema,
  overrides: profileSchema.partial(),
});

export type Variant = z.infer<typeof variantSchema>;
export type MatchRules = z.infer<typeof matchRulesSchema>;

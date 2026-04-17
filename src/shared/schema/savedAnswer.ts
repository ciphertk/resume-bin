import { z } from 'zod';
import { baseEntitySchema, timestampSchema } from './common';

export const savedAnswerSchema = baseEntitySchema.extend({
  label: z.string().min(1),
  questionSamples: z.array(z.string()),
  answer: z.string(),
  tags: z.array(z.string()).optional(),
  useCount: z.number().int().nonnegative(),
  lastUsedAt: timestampSchema.optional(),
});

export type SavedAnswer = z.infer<typeof savedAnswerSchema>;

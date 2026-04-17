import { z } from 'zod';
import { idSchema, baseEntitySchema, timestampSchema } from './common';

export const reminderStatusSchema = z.enum(['pending', 'done', 'dismissed']);

export const reminderSchema = baseEntitySchema.extend({
  applicationId: idSchema.optional(),
  title: z.string().min(1),
  dueAt: timestampSchema,
  notes: z.string().optional(),
  status: reminderStatusSchema,
});

export type Reminder = z.infer<typeof reminderSchema>;

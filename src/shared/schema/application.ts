import { z } from 'zod';
import { idSchema, baseEntitySchema, timestampSchema } from './common';

export const applicationStatusSchema = z.enum([
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'ghosted',
]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const applicationRecordSchema = baseEntitySchema.extend({
  url: z.string().url(),
  appliedAt: timestampSchema,
  companyName: z.string(),
  jobTitle: z.string(),
  jobLocation: z.string().optional(),
  jobId: z.string().optional(),
  sourcePlatform: z.string(),
  profileId: idSchema,
  variantId: idSchema.optional(),
  status: applicationStatusSchema,
  notes: z.string().optional(),
  followUpAt: timestampSchema.optional(),
  jdSnapshot: z.string().optional(),
  salaryRange: z.string().optional(),
});

export type ApplicationRecord = z.infer<typeof applicationRecordSchema>;

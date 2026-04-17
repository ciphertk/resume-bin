import { z } from 'zod';

export const idSchema = z.string().uuid();
export const timestampSchema = z.number().int().nonnegative();

export type Id = z.infer<typeof idSchema>;
export type Timestamp = z.infer<typeof timestampSchema>;

export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

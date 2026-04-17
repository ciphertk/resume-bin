import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

export const fileBlobSchema = z.object({
  id: idSchema,
  name: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  data: z.instanceof(Blob),
  createdAt: timestampSchema,
});

export type FileBlob = z.infer<typeof fileBlobSchema>;

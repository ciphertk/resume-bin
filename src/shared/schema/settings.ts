import { z } from 'zod';
import { idSchema } from './common';

export const applyDetectionModeSchema = z.enum(['auto-confirm', 'manual-only', 'off']);

export const settingsSchema = z.object({
  activeProfileId: idSchema.optional(),
  applyDetectionMode: applyDetectionModeSchema,
  passiveAnswerCapture: z.boolean(),
  captureJdSnapshot: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  applyDetectionMode: 'manual-only',
  passiveAnswerCapture: true,
  captureJdSnapshot: true,
  theme: 'system',
};

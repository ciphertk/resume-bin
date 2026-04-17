import { z } from 'zod';

export const aiProviderIdSchema = z.enum(['openai', 'anthropic', 'gemini']);
export type AIProviderId = z.infer<typeof aiProviderIdSchema>;

export const aiConfigSchema = z.object({
  enabledProviders: z.array(aiProviderIdSchema),
  defaultProvider: aiProviderIdSchema.optional(),
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    gemini: z.string().optional(),
  }),
  modelByProvider: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    gemini: z.string().optional(),
  }),
  featuresEnabled: z.object({
    qaAnswering: z.boolean(),
    coverLetter: z.boolean(),
    resumeTailoring: z.boolean(),
    metadataExtraction: z.boolean(),
    jdSummary: z.boolean(),
  }),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabledProviders: [],
  apiKeys: {},
  modelByProvider: {},
  featuresEnabled: {
    qaAnswering: false,
    coverLetter: false,
    resumeTailoring: false,
    metadataExtraction: false,
    jdSummary: false,
  },
};

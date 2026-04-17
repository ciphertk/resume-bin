import { describe, it, expect } from 'vitest';
import {
  applicationRecordSchema,
  DEFAULT_SETTINGS,
  DEFAULT_AI_CONFIG,
  settingsSchema,
  aiConfigSchema,
} from './index';

describe('schema defaults', () => {
  it('DEFAULT_SETTINGS parses', () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
  it('DEFAULT_AI_CONFIG parses', () => {
    expect(aiConfigSchema.safeParse(DEFAULT_AI_CONFIG).success).toBe(true);
  });
});

describe('applicationRecordSchema', () => {
  it('rejects non-URL', () => {
    const result = applicationRecordSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      url: 'not-a-url',
      appliedAt: 0,
      companyName: '',
      jobTitle: '',
      sourcePlatform: '',
      profileId: '00000000-0000-4000-8000-000000000002',
      status: 'applied',
      createdAt: 0,
      updatedAt: 0,
    });
    expect(result.success).toBe(false);
  });
});

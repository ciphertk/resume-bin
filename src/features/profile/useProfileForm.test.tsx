import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileForm } from './useProfileForm';

vi.mock('@/shared/messaging', () => {
  const profile = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Default',
    isDefault: true,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    headline: '',
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: 0,
    updatedAt: 0,
  };
  const sendMessage = vi.fn((type: string, _payload: unknown) => {
    if (type === 'profile/get-active') return Promise.resolve(profile);
    if (type === 'profile/update') return Promise.resolve({ ...profile, firstName: 'X' });
    return Promise.resolve(null);
  });
  return { sendMessage };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProfileForm', () => {
  it('loads the active profile', async () => {
    const { result } = renderHook(() => useProfileForm());
    await waitFor(() => expect(result.current.profile).not.toBeNull());
    expect(result.current.profile?.isDefault).toBe(true);
  });

  it('save() sends profile/update with the patch', async () => {
    const { result } = renderHook(() => useProfileForm());
    await waitFor(() => expect(result.current.profile).not.toBeNull());
    await act(async () => {
      await result.current.save({ firstName: 'X' });
    });
    expect(result.current.profile?.firstName).toBe('X');
  });
});

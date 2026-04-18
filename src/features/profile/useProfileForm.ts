import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { Profile } from '@/shared/schema/profile';

export interface UseProfileFormResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  save: (patch: Partial<Profile>) => Promise<void>;
  reload: () => Promise<void>;
}

export function useProfileForm(): UseProfileFormResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async (): Promise<void> => {
    setLoading(true);
    try {
      const p = await sendMessage('profile/get-active', undefined as never);
      setProfile(p);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const save = async (patch: Partial<Profile>): Promise<void> => {
    try {
      const updated = await sendMessage('profile/update', { patch });
      setProfile(updated);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  return { profile, loading, error, save, reload };
}

import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const page = await base44.entities.UserProfile.filter({}, { sort: '-updated_date', limit: 1 });
    setProfile((page.items && page.items[0]) || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (payload) => {
    const saved = profile?.id
      ? await base44.entities.UserProfile.update(profile.id, payload)
      : await base44.entities.UserProfile.create(payload);
    setProfile(saved);
    return saved;
  }, [profile]);

  return { profile, loading, save, reload: load };
}
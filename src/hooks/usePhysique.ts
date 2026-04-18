import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PhysiqueLog = Tables<'physique_logs'>;

const BUCKET = 'physique-photos';

export function usePhysique() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<PhysiqueLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('physique_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    if (error) {
      toast.error('Failed to load physique data');
      setLoading(false);
      return;
    }
    setLogs(data || []);
    setLoading(false);

    // Sign URLs for photos
    const paths = (data || []).map(l => l.photo_url).filter(Boolean) as string[];
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      signed?.forEach(s => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      setSignedUrls(map);
    } else {
      setSignedUrls({});
    }
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      toast.error('Photo upload failed');
      return null;
    }
    return path;
  };

  const addLog = async (
    log: Omit<TablesInsert<'physique_logs'>, 'user_id'>,
    photoFile?: File | null,
  ) => {
    if (!user) return;
    let photo_url: string | null = log.photo_url ?? null;
    if (photoFile) {
      photo_url = await uploadPhoto(photoFile);
    }
    const { error } = await supabase
      .from('physique_logs')
      .insert({ ...log, photo_url, user_id: user.id });
    if (error) {
      toast.error('Failed to save entry');
      return;
    }
    toast.success('Entry saved!');
    await fetchLogs();
  };

  const deleteLog = async (id: string, photoPath?: string | null) => {
    if (!user) return;
    if (photoPath) {
      await supabase.storage.from(BUCKET).remove([photoPath]);
    }
    const { error } = await supabase
      .from('physique_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to delete entry');
      return;
    }
    await fetchLogs();
  };

  return { logs, loading, signedUrls, addLog, deleteLog, refetch: fetchLogs };
}

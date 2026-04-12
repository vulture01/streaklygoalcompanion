import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGroqAI() {
  const [loading, setLoading] = useState(false);

  const callGroq = async (
    type: 'suggestions' | 'weekly-review' | 'prediction' | 'correlation',
    context: string
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: { type, context },
      });
      if (error) throw error;
      return data?.result || null;
    } catch (e) {
      console.error('Groq AI error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callGroq, loading };
}

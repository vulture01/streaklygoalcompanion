import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGroqAI() {
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const callGroq = async (
    type: 'suggestions' | 'weekly-review' | 'prediction' | 'correlation',
    context: string
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: { type, context },
      });

      if (error) {
        // Check for rate limit from FunctionsHttpError
        const msg = (error as any)?.context?.body;
        if (msg) {
          try {
            const parsed = JSON.parse(typeof msg === 'string' ? msg : await msg.text());
            if (parsed.error === 'rate_limit') {
              setRateLimited(true);
              setRateLimitMessage(parsed.message);
              toast.info(parsed.message);
              return null;
            }
          } catch {}
        }
        throw error;
      }

      if (data?.error === 'rate_limit') {
        setRateLimited(true);
        setRateLimitMessage(data.message);
        toast.info(data.message);
        return null;
      }

      return data?.result || null;
    } catch (e) {
      console.error('Groq AI error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callGroq, loading, rateLimited, rateLimitMessage };
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

export default function GroqSetupPage({ onComplete }: Props) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ groq_api_key: apiKey.trim() })
      .eq('user_id', user.id);
    setLoading(false);
    if (error) {
      toast.error('Failed to save API key');
    } else {
      toast.success('API key saved!');
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
            <Key size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Set Up AI Features</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Paste your free Groq API key to unlock AI-powered suggestions, weekly reviews, and progress predictions.
          </p>

          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary text-sm font-medium mb-4"
          >
            Get your free key at console.groq.com <ExternalLink size={14} />
          </a>

          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-card border border-border rounded-lg px-4 py-3.5 text-foreground outline-none focus:ring-2 focus:ring-primary mb-4 font-mono text-sm"
          />

          <button
            onClick={handleSave}
            disabled={loading || !apiKey.trim()}
            className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 tap-target disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onComplete}
            className="w-full mt-3 py-2 text-sm text-muted-foreground tap-target"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  );
}

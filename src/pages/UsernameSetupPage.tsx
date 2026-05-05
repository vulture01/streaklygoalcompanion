import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

export default function UsernameSetupPage({ onComplete }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const value = username.trim();
    if (!USERNAME_REGEX.test(value)) {
      setError('3–20 characters, letters, numbers and underscores only.');
      return;
    }
    if (!user) return;
    setLoading(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: value })
      .eq('user_id', user.id);
    setLoading(false);
    if (updateError) {
      if ((updateError as any).code === '23505') {
        setError('That username is taken. Try another.');
      } else {
        setError('Could not save username. Try again.');
      }
      return;
    }
    toast.success(`Welcome, @${value}`);
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
            <AtSign size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pick a username</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Friends will use this to find and challenge you on the leaderboard.
          </p>

          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              maxLength={20}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-3.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <p className="text-xs text-muted-foreground mb-4">3–20 characters · letters, numbers, underscore</p>

          <button
            onClick={handleSave}
            disabled={loading || !username.trim()}
            className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 tap-target disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

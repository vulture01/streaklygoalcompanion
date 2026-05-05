import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Row {
  user_id: string;
  username: string | null;
  name: string | null;
  total_streak: number;
  rank: number;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weekly, setWeekly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc('get_leaderboard' as any, { _weekly: weekly }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error(error);
      setRows(((data as any) || []) as Row[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [weekly]);

  const friendsCount = rows.length - 1; // excludes current user

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="tap-target"><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="text-xl font-bold text-foreground flex-1">Leaderboard</h1>
          <Trophy size={20} className="text-warning" />
        </div>

        <div className="flex bg-card border border-border rounded-lg p-1 mb-6">
          <button
            onClick={() => setWeekly(false)}
            className={`flex-1 py-2 rounded-md text-sm font-medium tap-target transition ${!weekly ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            All-time
          </button>
          <button
            onClick={() => setWeekly(true)}
            className={`flex-1 py-2 rounded-md text-sm font-medium tap-target transition ${weekly ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            This week
          </button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Loading...</p>
        ) : friendsCount <= 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Users size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Add friends to see the leaderboard</p>
            <button
              onClick={() => navigate('/friends')}
              className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold tap-target"
            >
              Find friends
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const isMe = r.user_id === user?.id;
              const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : null;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isMe ? 'border-primary bg-primary/10 glow-violet' : 'border-border bg-card'}`}
                >
                  <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                    {medal || `#${r.rank}`}
                  </div>
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {(r.username || r.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      @{r.username || 'unknown'} {isMe && <span className="text-xs text-muted-foreground">· you</span>}
                    </p>
                    {r.name && <p className="text-xs text-muted-foreground truncate">{r.name}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold gradient-primary-text">{r.total_streak}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{weekly ? 'days' : 'streak'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          {weekly ? 'Resets every Monday at midnight' : 'Sum of all your active goal streaks'}
        </p>
      </div>
    </PageTransition>
  );
}

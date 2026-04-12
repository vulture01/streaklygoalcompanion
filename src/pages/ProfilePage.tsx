import { PageTransition } from '@/components/PageTransition';
import { useProfile, useGoals, useLogs, useBadges } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { User, Download, LogOut, ChevronRight, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { BottomSheet } from '@/components/BottomSheet';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { goals } = useGoals();
  const { logs } = useLogs();
  const { badges } = useBadges();
  const [groqOpen, setGroqOpen] = useState(false);
  const [newKey, setNewKey] = useState('');

  const totalLogs = logs.filter(l => l.completed).length;
  const bestStreak = Math.max(...goals.map(g => g.best_streak), 0);

  const handleExportJSON = async () => {
    const exportData = { goals, logs, badges, profile };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'streakly-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const handleSaveKey = async () => {
    if (!newKey.trim()) return;
    await updateProfile({ groq_api_key: newKey.trim() });
    setNewKey('');
    setGroqOpen(false);
    toast.success('API key updated!');
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
            <User size={32} className="text-primary-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{profile?.name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Logs', value: totalLogs },
            { label: 'Best Streak', value: bestStreak },
            { label: 'Badges', value: badges.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg p-4 border border-border text-center">
              <div className="text-xl font-bold gradient-primary-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Badges Earned</h3>
            <div className="flex gap-2 flex-wrap">
              {badges.map(b => {
                const goal = goals.find(g => g.id === b.goal_id);
                return (
                  <div key={b.id} className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-medium">
                    {goal?.emoji} {b.milestone}-day
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button onClick={() => setGroqOpen(true)} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Key size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Change Groq API Key</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button onClick={handleExportJSON} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Download size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Export Data (JSON)</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <LogOut size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Sign Out</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <BottomSheet open={groqOpen} onClose={() => setGroqOpen(false)} title="Update Groq API Key">
        <div className="space-y-4">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="gsk_..."
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary font-mono" />
          <button onClick={handleSaveKey} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target">
            Save Key
          </button>
        </div>
      </BottomSheet>
    </PageTransition>
  );
}

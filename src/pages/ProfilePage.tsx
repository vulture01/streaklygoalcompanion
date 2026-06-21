import { PageTransition } from '@/components/PageTransition';
import { useProfile, useGoals, useLogs, useBadges } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { User, Download, LogOut, ChevronRight, Key, Trash2, Activity, RotateCcw, Users, Trophy, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { goals } = useGoals();
  const { logs } = useLogs();
  const { badges } = useBadges();
  const [groqOpen, setGroqOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarPath = (profile as any)?.avatar_url as string | undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!avatarPath) { setAvatarUrl(null); return; }
      const { data } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 60 * 60);
      if (!cancelled) setAvatarUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [avatarPath]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      await updateProfile({ avatar_url: path } as any);
      toast.success('Profile photo updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error || (data as any)?.error) {
        throw error || new Error((data as any).error);
      }
      toast.success('Account deleted');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  const handleResetAccount = async () => {
    if (resetting || !user) return;
    setResetting(true);
    try {
      const uid = user.id;
      const tables = [
        'session_sets',
        'workout_sessions',
        'routine_exercises',
        'routines',
        'physique_logs',
        'todos',
        'badges',
        'habit_completions',
        'habits',
        'logs',
        'goals',
        'ai_usage',
      ] as const;
      for (const t of tables) {
        const { error } = await supabase.from(t as any).delete().eq('user_id', uid);
        if (error) {
          console.error(`Reset failed on ${t}:`, error);
          throw error;
        }
      }
      toast.success('Account reset. Starting fresh!');
      setResetOpen(false);
      setResetText('');
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      toast.error('Failed to reset account. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 safe-bottom max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            className="group relative w-20 h-20 rounded-full overflow-hidden mb-3 tap-target focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Change profile photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <User size={32} className="text-primary-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <h2 className="text-lg font-semibold text-foreground">{profile?.name || 'User'}</h2>
          {(profile as any)?.username && (
            <p className="text-sm text-primary font-medium">@{(profile as any).username}</p>
          )}
          <p className="text-xs text-muted-foreground">{user?.email}</p>
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
          <button onClick={() => navigate('/friends')} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Users size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Friends</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/leaderboard')} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Trophy size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Leaderboard</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/profile/physique')} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Activity size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Physique</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button onClick={() => setGroqOpen(true)} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
            <Key size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Groq API Key (optional, for unlimited AI)</span>
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

        <div className="mt-8">
          <h3 className="text-xs uppercase tracking-wider text-destructive font-semibold mb-3 px-1">Danger Zone</h3>
          <div className="space-y-1">
            <button
              onClick={() => { setResetText(''); setResetOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-destructive/40 tap-target"
            >
              <RotateCcw size={18} className="text-destructive" />
              <span className="text-sm text-destructive flex-1 text-left">Reset Account</span>
              <ChevronRight size={16} className="text-destructive" />
            </button>
            <button
              onClick={() => { setConfirmText(''); setDeleteOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-destructive/40 tap-target"
            >
              <Trash2 size={18} className="text-destructive" />
              <span className="text-sm text-destructive flex-1 text-left">Delete Account</span>
              <ChevronRight size={16} className="text-destructive" />
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your profile and all associated data — goals, habits, workouts, logs, todos, and badges. This action cannot be undone.
              <br /><br />
              Type <span className="font-mono font-semibold text-destructive">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-destructive font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={(o) => { if (!resetting) setResetOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your goals, habits, entries, workouts, todos and progress. This cannot be undone.
              <br /><br />
              Type <span className="font-mono font-semibold text-destructive">RESET</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            placeholder="RESET"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-destructive font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAccount}
              disabled={resetText !== 'RESET' || resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? 'Resetting...' : 'Reset Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

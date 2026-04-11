import { PageTransition } from '@/components/PageTransition';
import { useAppStore } from '@/store/useAppStore';
import { User, Settings, Download, LogOut, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const { userName, goals } = useAppStore();

  const totalLogs = goals.reduce((acc, g) => acc + g.logs.filter(l => l.completed).length, 0);
  const bestStreak = Math.max(...goals.map(g => g.bestStreak), 0);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
            <User size={32} className="text-primary-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{userName}</h2>
          <p className="text-sm text-muted-foreground">{goals.length} active goals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Logs', value: totalLogs },
            { label: 'Best Streak', value: bestStreak },
            { label: 'Goals', value: goals.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg p-4 border border-border text-center">
              <div className="text-xl font-bold gradient-primary-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          {[
            { icon: Settings, label: 'Settings' },
            { icon: Download, label: 'Export Data (JSON)' },
            { icon: LogOut, label: 'Sign Out' },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border tap-target">
              <item.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

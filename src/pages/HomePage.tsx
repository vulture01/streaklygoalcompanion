import { PageTransition } from '@/components/PageTransition';
import { GoalCard } from '@/components/GoalCard';
import { WeeklySummaryBar } from '@/components/WeeklySummaryBar';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Bell } from 'lucide-react';
import { useState } from 'react';
import { AddGoalSheet } from '@/components/AddGoalSheet';

export default function HomePage() {
  const { goals, userName, todos } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);

  const todayTodos = todos.filter((t) => !t.completed).slice(0, 3);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()},</p>
            <h1 className="text-2xl font-bold text-foreground">{userName} 👋</h1>
          </div>
          <button className="tap-target flex items-center justify-center rounded-full bg-secondary w-10 h-10">
            <Bell size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Weekly Summary */}
        <div className="mb-5">
          <WeeklySummaryBar />
        </div>

        {/* Goals */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Active Goals</h2>
          <button
            onClick={() => setAddOpen(true)}
            className="tap-target flex items-center gap-1 text-sm text-primary font-medium"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {goals.filter(g => !g.paused).map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
          ))}
        </div>

        {/* Today's Tasks */}
        {todayTodos.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Today's Tasks</h2>
            <div className="space-y-2">
              {todayTodos.map((todo) => (
                <div key={todo.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    todo.priority === 'High' ? 'bg-destructive' : todo.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <span className="text-sm text-foreground flex-1">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddGoalSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </PageTransition>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

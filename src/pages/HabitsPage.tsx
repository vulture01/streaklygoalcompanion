import { useState } from 'react';
import { Plus, Flame, Check, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';
import { useHabits } from '@/hooks/useHabits';
import { HabitGrid } from '@/components/HabitGrid';
import { AddHabitSheet } from '@/components/AddHabitSheet';
import { EditHabitSheet } from '@/components/EditHabitSheet';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PullToRefresh } from '@/components/PullToRefresh';
import type { Tables } from '@/integrations/supabase/types';

type Habit = Tables<'habits'>;

export default function HabitsPage() {
  const { habits, loading, toggleToday, deleteHabit, getCompletionsFor, isCompletedToday, refetch } = useHabits();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen safe-bottom max-w-lg mx-auto w-full" style={{ paddingTop: 'var(--safe-top)' }}>
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Habits</h1>
            <p className="text-sm text-muted-foreground mt-1">Build daily momentum</p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center tap-target"
            aria-label="Add habit"
          >
            <Plus size={22} className="text-primary-foreground" />
          </button>
        </header>

        <PullToRefresh onRefresh={refetch}>
        <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : habits.length === 0 ? (
            <EmptyState
              emoji="🌱"
              title="No habits yet"
              description="Build daily momentum by adding your first habit."
              ctaLabel="Add Habit"
              onCta={() => setSheetOpen(true)}
            />
          ) : (
            habits.map((habit) => {
              const completed = isCompletedToday(habit.id);
              const dates = getCompletionsFor(habit.id).map((c) => c.date);
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{habit.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{habit.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="capitalize">{habit.frequency}</span>
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-primary" />
                          {habit.streak} day{habit.streak === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleToday(habit.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center tap-target transition-colors ${
                        completed ? 'gradient-primary' : 'bg-muted'
                      }`}
                      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <Check size={20} className={completed ? 'text-primary-foreground' : 'text-muted-foreground'} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <HabitGrid completionDates={dates} days={7} />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(habit)}
                        className="text-muted-foreground hover:text-primary p-2 tap-target"
                        aria-label="Edit habit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(habit)}
                        className="text-muted-foreground hover:text-destructive p-2 tap-target"
                        aria-label="Delete habit"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        </PullToRefresh>

        <AddHabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
        <EditHabitSheet habit={editing} onClose={() => setEditing(null)} />
        <ConfirmDeleteDialog
          open={!!pendingDelete}
          onOpenChange={(o) => !o && setPendingDelete(null)}
          title="Delete this habit?"
          description="This will remove all its history too."
          onConfirm={async () => {
            if (pendingDelete) {
              await deleteHabit(pendingDelete.id);
              setPendingDelete(null);
            }
          }}
        />
      </div>
    </PageTransition>
  );
}

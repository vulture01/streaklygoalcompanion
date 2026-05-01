import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Dumbbell, Play, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { useRoutines, useWorkoutSessions } from '@/hooks/useWorkouts';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PullToRefresh } from '@/components/PullToRefresh';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const { routines, getExercises, deleteRoutine, loading: routinesLoading, refetch: refetchRoutines } = useRoutines();
  const { sessions, startSession, deleteSession, loading: sessionsLoading, refetch: refetchSessions } = useWorkoutSessions();
  const [tab, setTab] = useState<'routines' | 'history'>('routines');

  const handleStart = async (name: string, routineId: string | null) => {
    const id = await startSession(name, routineId);
    if (id) navigate(`/workout/session/${id}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24" style={{ paddingTop: 'var(--safe-top)' }}>
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workout</h1>
            <p className="text-sm text-muted-foreground mt-1">Train, log, progress</p>
          </div>
          <button
            onClick={() => navigate('/workout/new-routine')}
            className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center tap-target"
            aria-label="New routine"
          >
            <Plus size={22} className="text-primary-foreground" />
          </button>
        </header>

        <div className="px-5">
          <Button
            onClick={() => handleStart('Quick Workout', null)}
            className="w-full h-12 gradient-primary mb-4"
          >
            <Play size={18} className="mr-2" /> Quick Start
          </Button>

          <div className="flex gap-2 mb-4 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTab('routines')}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                tab === 'routines' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              Routines
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                tab === 'history' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              History
            </button>
          </div>

          {tab === 'routines' && (
            <PullToRefresh onRefresh={refetchRoutines}>
            <div className="space-y-3">
              {routinesLoading ? (
                <ListSkeleton rows={3} />
              ) : routines.length === 0 ? (
                <EmptyState
                  icon={<Dumbbell size={32} className="text-muted-foreground" />}
                  title="No routines yet"
                  description="Create a routine like 'Push Day' with your favorite exercises."
                  ctaLabel="Create routine"
                  onCta={() => navigate('/workout/new-routine')}
                />
              ) : (
                routines.map((r) => {
                  const ex = getExercises(r.id);
                  return (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">{r.name}</div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {ex.length} exercise{ex.length === 1 ? '' : 's'}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRoutine(r.id)}
                          className="text-muted-foreground hover:text-destructive p-2 tap-target"
                          aria-label="Delete routine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {ex.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {ex.slice(0, 3).map((e) => (
                            <div key={e.id}>
                              • {e.name} — {e.sets}×{e.reps} @ {Number(e.weight)}kg
                            </div>
                          ))}
                          {ex.length > 3 && <div>+ {ex.length - 3} more</div>}
                        </div>
                      )}
                      <Button
                        onClick={() => handleStart(r.name, r.id)}
                        className="w-full mt-3 gradient-primary h-10"
                      >
                        <Play size={16} className="mr-2" /> Start workout
                      </Button>
                    </motion.div>
                  );
                })
              )}
            </div>
            </PullToRefresh>
          )}

          {tab === 'history' && (
            <PullToRefresh onRefresh={refetchSessions}>
            <div className="space-y-3">
              {sessionsLoading ? (
                <ListSkeleton rows={3} />
              ) : sessions.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={32} className="text-muted-foreground" />}
                  title="No workouts logged yet"
                  description="Start a quick workout or pick a routine to begin tracking."
                />
              ) : (
                sessions.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-4"
                    onClick={() => navigate(`/workout/session/${s.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(s.started_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' · '}
                          {s.ended_at ? 'Completed' : 'In progress'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary mt-1">
                          <TrendingUp size={12} />
                          {Number(s.total_volume).toLocaleString()} kg total volume
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive p-2 tap-target"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            </PullToRefresh>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

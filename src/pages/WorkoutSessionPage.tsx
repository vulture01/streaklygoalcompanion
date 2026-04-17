import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trophy, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRoutines, useWorkoutSessions, useSessionSets } from '@/hooks/useWorkouts';

const setSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name required').max(60, 'Max 60 characters'),
  reps: z.number().int().min(1, 'Reps must be ≥ 1').max(500, 'Reps too high'),
  weight: z.number().min(0).max(2000, 'Weight too high'),
});

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, finishSession } = useWorkoutSessions();
  const { routines, getExercises } = useRoutines();
  const { sets, logSet, deleteSet } = useSessionSets(id ?? null);

  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);
  const routineExercises = session?.routine_id ? getExercises(session.routine_id) : [];

  const [exerciseName, setExerciseName] = useState('');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [logging, setLogging] = useState(false);

  const totalVolume = sets.reduce((s, x) => s + Number(x.reps) * Number(x.weight), 0);

  const handleLog = async () => {
    if (logging) return;
    const parsed = setSchema.safeParse({
      name: exerciseName,
      reps: Number(reps),
      weight: Number(weight),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLogging(true);
    try {
      const setNumber = sets.filter((s) => s.exercise_name === parsed.data.name).length + 1;
      await logSet(parsed.data.name, setNumber, parsed.data.reps, parsed.data.weight);
    } finally {
      setLogging(false);
    }
  };

  const handleFinish = async () => {
    if (!id) return;
    await finishSession(id);
    toast.success('Workout complete 💪');
    navigate('/workout');
  };

  // Group sets by exercise
  const grouped = sets.reduce((acc, s) => {
    (acc[s.exercise_name] = acc[s.exercise_name] || []).push(s);
    return acc;
  }, {} as Record<string, typeof sets>);

  return (
    <PageTransition>
      <div className="min-h-screen pb-32" style={{ paddingTop: 'var(--safe-top)' }}>
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/workout')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{session?.name ?? 'Workout'}</h1>
            <p className="text-xs text-muted-foreground">
              {totalVolume.toLocaleString()} kg total volume
            </p>
          </div>
          {!session?.ended_at && (
            <Button onClick={handleFinish} size="sm" className="gradient-primary">
              <Check size={16} className="mr-1" /> Finish
            </Button>
          )}
        </header>

        <div className="px-5 space-y-4">
          {routineExercises.length > 0 && Object.keys(grouped).length === 0 && (
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-2">Planned exercises</div>
              <div className="flex flex-wrap gap-2">
                {routineExercises.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setExerciseName(e.name);
                      setReps(String(e.reps));
                      setWeight(String(e.weight));
                    }}
                    className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium tap-target"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([name, list]) => (
            <div key={name} className="bg-card border border-border rounded-2xl p-4">
              <div className="font-semibold mb-2">{name}</div>
              <div className="space-y-1">
                {list.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-muted-foreground">#{s.set_number}</span>
                    <span className="flex-1">
                      {s.reps} reps × {Number(s.weight)} kg
                    </span>
                    {s.is_pr && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Trophy size={12} /> PR
                      </span>
                    )}
                    <button
                      onClick={() => deleteSet(s.id)}
                      className="text-muted-foreground hover:text-destructive p-1 tap-target"
                      aria-label="Delete set"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!session?.ended_at && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="text-sm font-medium">Log a set</div>
              <Input
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="Exercise name"
                maxLength={60}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Reps</div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    min={1}
                    max={500}
                  />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Weight (kg)</div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min={0}
                    max={2000}
                  />
                </div>
              </div>
              <Button
                onClick={handleLog}
                disabled={!exerciseName.trim() || logging}
                className="w-full gradient-primary"
              >
                <Plus size={16} className="mr-1" /> {logging ? 'Logging…' : 'Log Set'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

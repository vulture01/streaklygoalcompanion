import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRoutines } from '@/hooks/useWorkouts';

interface Row {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

const routineSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(60, 'Max 60 characters'),
  description: z.string().trim().max(200, 'Max 200 characters'),
});

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(60),
  sets: z.number().int().min(1).max(50),
  reps: z.number().int().min(1).max(500),
  weight: z.number().min(0).max(2000),
});

type Exercise = z.infer<typeof exerciseSchema>;

export default function NewRoutinePage() {
  const navigate = useNavigate();
  const { addRoutine } = useRoutines();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<Row[]>([{ name: '', sets: '3', reps: '10', weight: '0' }]);
  const [saving, setSaving] = useState(false);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows([...rows, { name: '', sets: '3', reps: '10', weight: '0' }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (saving) return;
    const meta = routineSchema.safeParse({ name, description });
    if (!meta.success) {
      toast.error(meta.error.issues[0].message);
      return;
    }
    const items: Exercise[] = [];
    for (const r of rows) {
      if (!r.name.trim()) continue;
      const parsed = exerciseSchema.safeParse({
        name: r.name,
        sets: Number(r.sets),
        reps: Number(r.reps),
        weight: Number(r.weight),
      });
      if (!parsed.success) {
        toast.error(`Invalid values for "${r.name || 'exercise'}"`);
        return;
      }
      items.push(parsed.data as Exercise);
    }
    setSaving(true);
    try {
      const id = await addRoutine(meta.data.name, meta.data.description, items);
      if (id) navigate('/workout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24" style={{ paddingTop: 'var(--safe-top)' }}>
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">New Routine</h1>
        </header>

        <div className="px-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Day" maxLength={60} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chest, shoulders, triceps"
              maxLength={200}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Exercises</label>
              <button onClick={addRow} className="text-sm text-primary font-medium tap-target px-2">
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={r.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      placeholder="Exercise name"
                      maxLength={60}
                      className="flex-1"
                    />
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="w-9 h-9 rounded-md bg-muted flex items-center justify-center tap-target"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Sets</div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={r.sets}
                        onChange={(e) => updateRow(i, { sets: e.target.value })}
                        min={1}
                        max={50}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Reps</div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={r.reps}
                        onChange={(e) => updateRow(i, { reps: e.target.value })}
                        min={1}
                        max={500}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Weight (kg)</div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={r.weight}
                        onChange={(e) => updateRow(i, { weight: e.target.value })}
                        min={0}
                        max={2000}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={addRow} variant="outline" className="w-full mt-3">
              <Plus size={16} className="mr-1" /> Add exercise
            </Button>
          </div>

          <Button onClick={handleSave} disabled={!name.trim() || saving} className="w-full h-12 gradient-primary">
            {saving ? 'Saving…' : 'Save Routine'}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

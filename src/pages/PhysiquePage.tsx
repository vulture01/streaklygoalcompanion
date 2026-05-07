import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ImageIcon, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageTransition } from '@/components/PageTransition';
import { BottomSheet } from '@/components/BottomSheet';
import { usePhysique, type PhysiqueLog } from '@/hooks/usePhysique';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type MetricKey = 'weight' | 'body_fat' | 'chest' | 'waist' | 'hips' | 'arms';

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'body_fat', label: 'Body Fat', unit: '%' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'arms', label: 'Arms', unit: 'cm' },
];

function fmt(n: number | null | undefined, unit: string) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(1)} ${unit}`;
}

function diff(first: number | null | undefined, last: number | null | undefined) {
  if (first == null || last == null) return null;
  return Number(last) - Number(first);
}

export default function PhysiquePage() {
  const navigate = useNavigate();
  const { logs, loading, signedUrls, addLog, deleteLog } = usePhysique();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight');

  const handleSave = async () => {
    if (saving) return;
    const hasAny =
      form.weight || form.body_fat || form.chest || form.waist || form.hips || form.arms || photoFile;
    if (!hasAny) {
      toast.error('Add at least one measurement or photo');
      return;
    }
    setSaving(true);
    const parse = (v: string) => (v.trim() === '' ? null : Number(v));
    await addLog(
      {
        date: form.date,
        weight: parse(form.weight),
        body_fat: parse(form.body_fat),
        chest: parse(form.chest),
        waist: parse(form.waist),
        hips: parse(form.hips),
        arms: parse(form.arms),
      },
      photoFile,
    );
    setSaving(false);
    setOpen(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      weight: '', body_fat: '', chest: '', waist: '', hips: '', arms: '',
    });
    setPhotoFile(null);
  };

  const chartData = logs
    .filter(l => l[activeMetric] !== null && l[activeMetric] !== undefined)
    .map(l => ({ date: l.date, value: Number(l[activeMetric]) }));

  const photoLogs = logs.filter(l => l.photo_url).slice().reverse();

  const first = logs[0];
  const latest = logs[logs.length - 1];
  const hasComparison = first && latest && first.id !== latest.id;

  return (
    <PageTransition>
      <div className="px-4 pt-12 safe-bottom max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="tap-target -ml-2">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Physique</h1>
          <button
            onClick={() => setOpen(true)}
            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center tap-target"
            aria-label="Add entry"
          >
            <Plus size={20} className="text-primary-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💪</div>
            <p className="text-muted-foreground mb-1">No physique data yet</p>
            <p className="text-xs text-muted-foreground">Tap + to log your first entry</p>
          </div>
        ) : (
          <>
            {/* Progress since start */}
            {hasComparison && (
              <div className="bg-card rounded-lg p-4 border border-border mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Progress since start</h3>
                <div className="grid grid-cols-3 gap-3">
                  {METRICS.map(m => {
                    const d = diff(first[m.key], latest[m.key]);
                    const Icon = d == null ? Minus : d < 0 ? TrendingDown : d > 0 ? TrendingUp : Minus;
                    const color = d == null ? 'text-muted-foreground' : d < 0 ? 'text-emerald-400' : d > 0 ? 'text-amber-400' : 'text-muted-foreground';
                    return (
                      <div key={m.key} className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</div>
                        <div className={`text-sm font-semibold mt-1 flex items-center justify-center gap-1 ${color}`}>
                          <Icon size={12} />
                          {d == null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(1)}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{m.unit}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metric tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setActiveMetric(m.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap tap-target ${
                    activeMetric === m.key
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-card rounded-lg p-4 border border-border mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">
                  {METRICS.find(m => m.key === activeMetric)?.label} over time
                </h3>
                <span className="text-xs text-muted-foreground">
                  {METRICS.find(m => m.key === activeMetric)?.unit}
                </span>
              </div>
              {chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No data for this metric yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Photo timeline */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Photo timeline</h3>
              {photoLogs.length === 0 ? (
                <div className="bg-card rounded-lg p-6 border border-border text-center">
                  <ImageIcon size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No progress photos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photoLogs.map(l => {
                    const url = l.photo_url ? signedUrls[l.photo_url] : undefined;
                    return (
                      <div key={l.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary border border-border">
                        {url ? (
                          <img src={url} alt={`Progress ${l.date}`} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <span className="text-[10px] font-medium text-white">{l.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent entries */}
            <h3 className="text-sm font-medium text-foreground mb-3">All entries</h3>
            <div className="space-y-2">
              {logs.slice().reverse().map((l: PhysiqueLog) => (
                <div key={l.id} className="bg-card rounded-lg p-3 border border-border flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground mb-1">{l.date}</div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      {METRICS.map(m =>
                        l[m.key] != null ? (
                          <div key={m.key}>
                            <span className="text-foreground">{fmt(l[m.key], m.unit)}</span>{' '}
                            <span>{m.label.toLowerCase()}</span>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteLog(l.id, l.photo_url)}
                    className="tap-target text-muted-foreground hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomSheet open={open} onClose={() => !saving && setOpen(false)} title="New physique entry">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map(m => (
              <div key={m.key}>
                <label className="text-xs text-muted-foreground">{m.label} ({m.unit})</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form[m.key]}
                  onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Progress photo (optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {photoFile && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{photoFile.name}</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save entry'}
          </button>
        </div>
      </BottomSheet>
    </PageTransition>
  );
}

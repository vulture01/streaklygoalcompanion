import { PageTransition } from '@/components/PageTransition';
import { useTodos, useGoals, useLogs, useStreakCalculator } from '@/hooks/useSupabaseData';
import { SwipeableCard } from '@/components/SwipeableCard';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PullToRefresh } from '@/components/PullToRefresh';

export default function TodosPage() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, refetch } = useTodos();
  const { goals, refetch: refetchGoals } = useGoals();
  const { addLog } = useLogs();
  const { recalcStreak } = useStreakCalculator();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newGoalId, setNewGoalId] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addTodo({
      title: newTitle.trim(),
      priority: newPriority,
      goal_id: newGoalId || undefined,
    });
    setNewTitle('');
    setShowAdd(false);
  };

  const handleComplete = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    await updateTodo(todoId, { completed: true });
    // Auto-log linked goal
    if (todo.goal_id) {
      await addLog({
        goal_id: todo.goal_id,
        date: new Date().toISOString().split('T')[0],
        note: `Completed task: ${todo.title}`,
        mood: '💪',
        energy: 'Medium',
        completed: true,
      });
      await recalcStreak(todo.goal_id);
      await refetchGoals();
    }
  };

  const pending = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">To-Do</h1>
          <button onClick={() => setShowAdd(!showAdd)} className="tap-target text-primary"><Plus size={22} /></button>
        </div>

        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-card rounded-lg p-4 border border-border mb-4">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..."
              className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary mb-3" />
            <div className="flex gap-2 mb-3">
              {(['High', 'Medium', 'Low'] as const).map((p) => (
                <button key={p} onClick={() => setNewPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium tap-target ${newPriority === p ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{p}</button>
              ))}
            </div>
            {goals.length > 0 && (
              <select value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)}
                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-foreground text-sm outline-none mb-3">
                <option value="">No linked goal</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
              </select>
            )}
            <button onClick={handleAdd} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold tap-target">
              Add Task
            </button>
          </motion.div>
        )}

        <PullToRefresh onRefresh={refetch}>
        <div className="space-y-2 mb-6">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : pending.length === 0 && done.length === 0 ? (
            <EmptyState
              emoji="✅"
              title="No tasks yet"
              description="Add your first task to keep your day on track."
              ctaLabel="Add Task"
              onCta={() => setShowAdd(true)}
            />
          ) : pending.map((todo, i) => {
            const goal = goals.find(g => g.id === todo.goal_id);
            const isExpanded = expanded === todo.id;
            const subtasks = (todo.subtasks as any[]) || [];
            return (
              <SwipeableCard key={todo.id} onSwipeRight={() => handleComplete(todo.id)} onSwipeLeft={() => deleteTodo(todo.id)} rightLabel="Done" leftLabel="Delete">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-3 flex items-center gap-3">
                    <button onClick={() => handleComplete(todo.id)}
                      className="w-6 h-6 rounded-md border-2 border-border flex items-center justify-center tap-target shrink-0" />
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      todo.priority === 'High' ? 'bg-destructive' : todo.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                    }`} />
                    <span className="text-sm text-foreground flex-1">{todo.title}</span>
                    {goal && <span className="text-xs text-muted-foreground">{goal.emoji}</span>}
                    {subtasks.length > 0 && (
                      <button onClick={() => setExpanded(isExpanded ? null : todo.id)} className="tap-target text-muted-foreground">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                  {isExpanded && subtasks.length > 0 && (
                    <div className="px-3 pb-3 pl-12 space-y-1">
                      {subtasks.map((st: any) => (
                        <div key={st.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${st.done ? 'bg-primary border-primary' : 'border-border'}`}>
                            {st.done && <Check size={10} className="text-primary-foreground" />}
                          </div>
                          <span className={st.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{st.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </SwipeableCard>
            );
          })}
        </div>
        </PullToRefresh>

        {done.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Completed ({done.length})</h2>
            <div className="space-y-2">
              {done.map((todo) => (
                <div key={todo.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3 opacity-50">
                  <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center shrink-0">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground line-through flex-1">{todo.title}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

import { PageTransition } from '@/components/PageTransition';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Check, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';

export default function TodosPage() {
  const { todos, toggleTodo, removeTodo, addTodo, goals } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTodo({
      id: Date.now().toString(),
      title: newTitle.trim(),
      priority: newPriority,
      subtasks: [],
      completed: false,
    });
    setNewTitle('');
    setShowAdd(false);
  };

  const pending = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">To-Do</h1>
          <button onClick={() => setShowAdd(!showAdd)} className="tap-target text-primary">
            <Plus size={22} />
          </button>
        </div>

        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-card rounded-lg p-4 border border-border mb-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary mb-3"
            />
            <div className="flex gap-2 mb-3">
              {(['High', 'Medium', 'Low'] as const).map((p) => (
                <button key={p} onClick={() => setNewPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium tap-target ${
                    newPriority === p ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>{p}</button>
              ))}
            </div>
            <button onClick={handleAdd} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold tap-target">
              Add Task
            </button>
          </motion.div>
        )}

        <div className="space-y-2 mb-6">
          {pending.map((todo, i) => {
            const goal = goals.find(g => g.id === todo.goalId);
            const isExpanded = expanded === todo.id;
            return (
              <motion.div key={todo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-lg border border-border overflow-hidden"
              >
                <div className="p-3 flex items-center gap-3">
                  <button onClick={() => toggleTodo(todo.id)}
                    className="w-6 h-6 rounded-md border-2 border-border flex items-center justify-center tap-target shrink-0" />
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    todo.priority === 'High' ? 'bg-destructive' : todo.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <span className="text-sm text-foreground flex-1">{todo.title}</span>
                  {goal && <span className="text-xs text-muted-foreground">{goal.emoji}</span>}
                  {todo.subtasks.length > 0 && (
                    <button onClick={() => setExpanded(isExpanded ? null : todo.id)} className="tap-target text-muted-foreground">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                  <button onClick={() => removeTodo(todo.id)} className="tap-target text-muted-foreground">
                    <Trash2 size={14} />
                  </button>
                </div>
                {isExpanded && todo.subtasks.length > 0 && (
                  <div className="px-3 pb-3 pl-12 space-y-1">
                    {todo.subtasks.map((st) => (
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
            );
          })}
        </div>

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

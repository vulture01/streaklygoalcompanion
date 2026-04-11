import { create } from 'zustand';

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  type: 'boolean' | 'numeric';
  target?: number;
  streak: number;
  bestStreak: number;
  paused: boolean;
  linkedGoalId?: string;
  reminderTime?: string;
  logs: GoalLog[];
}

export interface GoalLog {
  id: string;
  date: string;
  note: string;
  mood: string;
  energy: 'High' | 'Medium' | 'Low';
  value?: number;
  completed: boolean;
}

export interface Todo {
  id: string;
  goalId?: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  recurring?: 'daily' | 'weekly' | 'custom';
  subtasks: { id: string; title: string; done: boolean }[];
  timeBlock?: string;
  completed: boolean;
}

interface AppState {
  userName: string;
  onboarded: boolean;
  goals: Goal[];
  todos: Todo[];
  setUserName: (name: string) => void;
  setOnboarded: (v: boolean) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  logGoal: (goalId: string, log: GoalLog) => void;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

const defaultGoals: Goal[] = [
  {
    id: '1', name: 'Fitness', emoji: '💪', type: 'boolean',
    streak: 5, bestStreak: 12, paused: false,
    logs: generateMockLogs(5),
  },
  {
    id: '2', name: 'Learning', emoji: '📚', type: 'numeric', target: 30,
    streak: 3, bestStreak: 8, paused: false,
    logs: generateMockLogs(3),
  },
  {
    id: '3', name: 'No Sugar', emoji: '🚫', type: 'boolean',
    streak: 7, bestStreak: 14, paused: false,
    logs: generateMockLogs(7),
  },
];

function generateMockLogs(streakDays: number): GoalLog[] {
  const logs: GoalLog[] = [];
  const moods = ['💪', '😐', '😓'];
  const energies: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const completed = i < streakDays || Math.random() > 0.4;
    if (completed || Math.random() > 0.5) {
      logs.push({
        id: `log-${Date.now()}-${i}`,
        date: date.toISOString().split('T')[0],
        note: completed ? 'Great session!' : '',
        mood: moods[Math.floor(Math.random() * moods.length)],
        energy: energies[Math.floor(Math.random() * energies.length)],
        completed,
      });
    }
  }
  return logs;
}

const defaultTodos: Todo[] = [
  { id: 't1', goalId: '1', title: 'Morning run — 30 min', priority: 'High', recurring: 'daily', subtasks: [], completed: false },
  { id: 't2', goalId: '2', title: 'Read 1 chapter', priority: 'Medium', recurring: 'daily', subtasks: [], completed: false },
  { id: 't3', title: 'Meal prep for the week', priority: 'Low', subtasks: [
    { id: 's1', title: 'Buy groceries', done: true },
    { id: 's2', title: 'Cook meals', done: false },
  ], completed: false },
];

export const useAppStore = create<AppState>((set) => ({
  userName: 'User',
  onboarded: true,
  goals: defaultGoals,
  todos: defaultTodos,
  setUserName: (name) => set({ userName: name }),
  setOnboarded: (v) => set({ onboarded: v }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, updates) => set((s) => ({
    goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g),
  })),
  logGoal: (goalId, log) => set((s) => ({
    goals: s.goals.map((g) =>
      g.id === goalId ? { ...g, logs: [log, ...g.logs], streak: log.completed ? g.streak + 1 : 0, bestStreak: Math.max(g.bestStreak, log.completed ? g.streak + 1 : g.bestStreak) } : g
    ),
  })),
  addTodo: (todo) => set((s) => ({ todos: [...s.todos, todo] })),
  toggleTodo: (id) => set((s) => ({
    todos: s.todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
  })),
  removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
}));

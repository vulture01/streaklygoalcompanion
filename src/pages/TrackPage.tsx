import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HabitsPage from './HabitsPage';
import WorkoutPage from './WorkoutPage';
import TodosPage from './TodosPage';

type Tab = 'habits' | 'workout' | 'todos';

const STORAGE_KEY = 'track-active-tab';

const chips: { id: Tab; label: string }[] = [
  { id: 'habits', label: 'Habits' },
  { id: 'workout', label: 'Workout' },
  { id: 'todos', label: 'To-Do' },
];

export default function TrackPage() {
  const [active, setActive] = useState<Tab>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY) as Tab | null;
    return stored && chips.some((c) => c.id === stored) ? stored : 'habits';
  });

  const select = (id: Tab) => {
    setActive(id);
    sessionStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <div>
      <div
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          {chips.map((chip) => {
            const isActive = active === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => select(chip.id)}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all tap-target ${
                  isActive
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === 'habits' && <HabitsPage />}
      {active === 'workout' && <WorkoutPage />}
      {active === 'todos' && <TodosPage />}
    </div>
  );
}

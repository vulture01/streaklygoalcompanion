import { Home, Target, BarChart3, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/track', icon: Target, label: 'Track' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[220px] z-40 bg-card/95 backdrop-blur-lg border-r border-border flex-col">
      <div className="px-6 py-7">
        <h1 className="text-2xl font-bold gradient-primary-text">Streakly</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { Home, Target, BarChart3, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/track', icon: Target, label: 'Track' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border lg:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div className="flex items-center justify-around h-16 sm:h-20 max-w-2xl mx-auto px-2 sm:px-6">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex-1 flex flex-col items-center justify-center tap-target gap-0.5"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 w-8 sm:w-10 h-1 rounded-full gradient-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                className={`sm:!w-6 sm:!h-6 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-[10px] sm:text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

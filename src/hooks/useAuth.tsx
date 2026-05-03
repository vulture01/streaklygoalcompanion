import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

const LAST_ACTIVE_KEY = 'last_active_at';
const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const touchActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {}
};

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        touchActivity();
      }
      if (event === 'SIGNED_OUT') {
        try { localStorage.removeItem(LAST_ACTIVE_KEY); } catch {}
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Inactivity check
      if (session) {
        const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) || 0);
        if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
          supabase.auth.signOut().then(() => {
            try { localStorage.removeItem(LAST_ACTIVE_KEY); } catch {}
            toast.info('You were logged out due to inactivity.');
            setSession(null);
            setUser(null);
            setLoading(false);
          });
          return;
        }
        touchActivity();
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Activity listeners
    const onActivity = () => touchActivity();
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (!error) touchActivity();
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) touchActivity();
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem(LAST_ACTIVE_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

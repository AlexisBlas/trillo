import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}

async function applySession(
  session: Session | null,
  setters: {
    setSession: (s: Session | null) => void;
    setUser: (u: User | null) => void;
    setProfile: (p: Profile | null) => void;
  }
): Promise<Profile | null> {
  if (!session?.user) {
    setters.setSession(null);
    setters.setUser(null);
    setters.setProfile(null);
    return null;
  }

  const profile = await fetchProfile(session.user.id);
  if (profile?.is_banned) {
    await supabase.auth.signOut();
    setters.setSession(null);
    setters.setUser(null);
    setters.setProfile(null);
    return null;
  }

  setters.setSession(session);
  setters.setUser(session.user);
  setters.setProfile(profile);
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setters = { setSession, setUser, setProfile };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session, setters);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session, setters);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      if (profile?.is_banned) {
        await supabase.auth.signOut();
        return {
          error: {
            name: 'AuthApiError',
            message: 'This account has been banned.',
            status: 403,
          } as AuthError,
        };
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin: profile?.is_admin ?? false,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

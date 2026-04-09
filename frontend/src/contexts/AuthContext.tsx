import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Profile } from '../types';
import { api } from '../lib/api';

interface AuthSession {
  access_token: string;
}

interface AuthContextValue {
  user: Profile | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.auth.me();
      if (res && res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const refreshProfile = async () => {
    await fetchMe();
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.auth.login({ email, password });
      setUser(res.user);
      setSession(res.session);
      localStorage.setItem('app_session', JSON.stringify({ session: res.session, user: res.user }));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error occurred';
      return { error: new Error(message) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const res = await api.auth.register({ email, password, full_name: fullName, role });
      setUser(res.user);
      setSession(res.session);
      localStorage.setItem('app_session', JSON.stringify({ session: res.session, user: res.user }));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error occurred';
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('app_session');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile: user, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Profile } from "../types";
import { api } from "../lib/api";

interface AuthSession {
  access_token: string;
}

interface AuthContextValue {
  user: Profile | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Recover the stored session (access_token) from localStorage, if any.
 */
function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem("app_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = parsed?.session?.access_token;
    return token ? { access_token: token } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch the current user via /api/auth/me (requires a stored JWT). */
  const fetchMe = async () => {
    try {
      // First check if we even have a stored token — skip the request otherwise
      const storedSession = getStoredSession();
      if (!storedSession) {
        setUser(null);
        setSession(null);
        return;
      }

      const res = await api.auth.me();
      if (res?.user) {
        setUser(res.user);
        // /me doesn't return a session — keep the one from localStorage
        setSession(storedSession);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
      localStorage.removeItem("app_session");
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
      localStorage.setItem(
        "app_session",
        JSON.stringify({ session: res.session, user: res.user }),
      );
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error occurred";
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("app_session");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile: user,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

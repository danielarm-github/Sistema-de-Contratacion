import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface RouterContextValue {
  path: string;
  params: Record<string, string>;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function parsePath(hash: string): { path: string; params: Record<string, string> } {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathname, search] = raw.split('?');
  const params: Record<string, string> = {};
  if (search) {
    new URLSearchParams(search).forEach((v, k) => { params[k] = v; });
  }
  return { path: pathname, params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [{ path, params }, setState] = useState(() => parsePath(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setState(parsePath(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return (
    <RouterContext.Provider value={{ path, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

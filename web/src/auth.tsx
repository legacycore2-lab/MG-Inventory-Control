import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, getToken, post, setToken, setUnauthorizedHandler, type User } from './api';

interface AuthCtx {
  user: User | null; ready: boolean; can: (p: string) => boolean;
  login: (u: string, p: string) => Promise<void>; logout: () => void; refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null as never);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);
  const refresh = useCallback(async () => { setUser(await get<User>('/auth/me')); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) { setReady(true); return; }
    refresh().catch(logout).finally(() => setReady(true));
  }, [logout, refresh]);

  const login = async (username: string, password: string) => {
    const r = await post<{ token: string; user: User }>('/auth/login', { username, password });
    setToken(r.token);
    setUser(r.user);
  };
  const can = (p: string) => !!user?.permissions.includes(p);

  return <Ctx.Provider value={{ user, ready, can, login, logout, refresh }}>{children}</Ctx.Provider>;
}

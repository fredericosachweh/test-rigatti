import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { apiFetch } from "../lib/api";

export interface AuthUser {
  id: string;
  companyId: string;
  role: "admin" | "cliente";
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "cliente";
    companyName?: string;
    companySlug?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "orbit-commerce-auth";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AuthResponse;
      setToken(parsed.token);
      setUser(parsed.user);

      apiFetch<{ user: AuthUser }>("/auth/me", { token: parsed.token })
        .then((response) => setUser(response.user))
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsReady(true));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsReady(true);
    }
  }, []);

  async function handleAuth(path: "/auth/login" | "/auth/register", payload: unknown) {
    const response = await apiFetch<AuthResponse>(path, {
      method: "POST",
      body: payload
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value: AuthContextValue = {
    user,
    token,
    isReady,
    login: async (payload) => handleAuth("/auth/login", payload),
    register: async (payload) => handleAuth("/auth/register", payload),
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

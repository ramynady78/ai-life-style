import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearToken,
  getToken,
  setToken,
  type User,
} from "@/lib/api";

type RegisterPayload = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  refreshUser: () => Promise<User | null>;
  login: (payload: { email: string; password: string }) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearToken();
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        if (getToken()) {
          const currentUser = await api.getCurrentUser();
          if (isMounted) {
            setUser(currentUser);
          }
        }
      } catch {
        clearToken();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      clearToken();
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const response = await api.login(payload);
      setToken(response.token);
      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error("Failed to load user after login");
      }

      return currentUser;
    },
    [refreshUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await api.register(payload);
      setToken(response.token);
      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error("Failed to load user after registration");
      }

      return currentUser;
    },
    [refreshUser],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      refreshUser,
      login,
      register,
      logout,
    }),
    [user, isInitializing, refreshUser, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

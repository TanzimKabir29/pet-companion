import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthActions {
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

function createAuthStore() {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  const [state, setState] = createStore<AuthState>({
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    loading: false,
  });

  const actions: AuthActions = {
    setAuth(token: string, user: User) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setState({ token, user });
    },
    clearAuth() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setState({ token: null, user: null });
    },
    setLoading(loading: boolean) {
      setState({ loading });
    },
  };

  return { state, actions };
}

type AuthStore = ReturnType<typeof createAuthStore>;
export const AuthContext = createContext<AuthStore>();

export function createAuth() {
  return createAuthStore();
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

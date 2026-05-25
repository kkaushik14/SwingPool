import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants";
import { authService } from "@/services";
import {
  clearSession as clearStoredSession,
  readSession,
  subscribeSession,
  writeSession
} from "@/store";
import type { AuthResult, LoginPayload, RegisterPayload, StoredSession, UserRecord } from "@/types";
import { ApiRequestError } from "@/types";

interface AuthContextValue {
  session: StoredSession | null;
  user: UserRecord | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authReady: boolean;
  isLoadingUser: boolean;
  login: (payload: LoginPayload) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setAuthResult: (result: AuthResult) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredSession | null>(() => readSession());

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await authService.me();
      return response.data;
    },
    enabled: Boolean(session?.accessToken),
    staleTime: 1000 * 60,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  useEffect(() => subscribeSession(setSession), []);

  const clearAuth = () => {
    clearStoredSession();
    queryClient.removeQueries({ queryKey: queryKeys.auth.me });
  };

  useEffect(() => {
    if (meQuery.error instanceof ApiRequestError && meQuery.error.statusCode === 401) {
      clearAuth();
    }
  }, [meQuery.error, queryClient]);

  useEffect(() => {
    if (!session) {
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    }
  }, [queryClient, session]);

  const setAuthResult = (result: AuthResult) => {
    writeSession(result.tokens);
    queryClient.setQueryData(queryKeys.auth.me, result.user);
  };

  const login = async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setAuthResult(response.data);
    return response.data;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setAuthResult(response.data);
    return response.data;
  };

  const logout = async () => {
    if (session?.refreshToken) {
      try {
        await authService.logout(session.refreshToken);
      } catch (_error) {
        // Logout should still clear local state even if the network request fails.
      }
    }

    clearAuth();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: meQuery.data || null,
      isAuthenticated: Boolean(session?.accessToken),
      isAdmin: meQuery.data?.role === "admin",
      authReady: !session?.accessToken || !meQuery.isPending,
      isLoadingUser: meQuery.isLoading,
      login,
      register,
      logout,
      setAuthResult,
      clearAuth
    }),
    [session, meQuery.data, meQuery.isLoading, meQuery.isPending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};

// src/app/AppContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";

import {
  resolveRoute,
  type AppRoute,
  type AuthStatus,
  type RouteState,
} from "./routePolicy";
import { supabase } from "../lib/supabase";

type OnboardingProfile = {
  userId: string;
  onboardingComplete: boolean;
};

type AppContextValue = {
  user: User | null;
  authStatus: AuthStatus;
  onboardingComplete: boolean | null;
  requestedRoute: AppRoute;
  currentRoute: AppRoute | "boot" | "update";
  isUpdateRequired: boolean;
  isLoading: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
  setRequestedRoute: (route: AppRoute) => void;
  clearError: () => void;
};

type AppProviderProps = {
  children: ReactNode;
  initialRoute?: AppRoute;
  isUpdateRequired?: boolean;
};

const DEFAULT_ROUTE: AppRoute = "/auth";

const AppContext = createContext<AppContextValue | undefined>(
  undefined,
);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to initialize the application.";
}

async function loadOnboardingProfile(
  userId: string,
): Promise<OnboardingProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    userId,
    onboardingComplete: data?.onboarding_complete === true,
  };
}

export function AppProvider({
  children,
  initialRoute = DEFAULT_ROUTE,
  isUpdateRequired = false,
}: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] =
    useState<AuthStatus>("checking");
  const [onboardingComplete, setOnboardingComplete] = useState<
    boolean | null
  >(null);
  const [requestedRoute, setRequestedRoute] =
    useState<AppRoute>(initialRoute);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearApplicationIdentity = useCallback(() => {
    setUser(null);
    setAuthStatus("anonymous");
    setOnboardingComplete(null);
  }, []);

  const loadVerifiedApplicationState = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setAuthStatus("checking");
      setOnboardingComplete(null);

      try {
        const {
          data: { user: verifiedUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (signal?.aborted) {
          return;
        }

        if (userError || !verifiedUser) {
          clearApplicationIdentity();
          return;
        }

        setUser(verifiedUser);
        setAuthStatus("verified");

        const profile = await loadOnboardingProfile(
          verifiedUser.id,
        );

        if (signal?.aborted) {
          return;
        }

        setOnboardingComplete(profile.onboardingComplete);
      } catch (caughtError) {
        if (signal?.aborted || isAbortError(caughtError)) {
          return;
        }

        clearApplicationIdentity();
        setError(getErrorMessage(caughtError));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [clearApplicationIdentity],
  );

  const refreshAuth = useCallback(async (): Promise<void> => {
    await loadVerifiedApplicationState();
  }, [loadVerifiedApplicationState]);

  useEffect(() => {
    const controller = new AbortController();

    void loadVerifiedApplicationState(controller.signal);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (controller.signal.aborted) {
          return;
        }

        if (event === "SIGNED_OUT") {
          clearApplicationIdentity();
          setIsLoading(false);
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          void loadVerifiedApplicationState(
            controller.signal,
          );
        }
      },
    );

    return () => {
      controller.abort();
      subscription.unsubscribe();
    };
  }, [
    clearApplicationIdentity,
    loadVerifiedApplicationState,
  ]);

  const routeState: RouteState = useMemo(
    () => ({
      authStatus,
      onboardingComplete,
      isUpdateRequired,
    }),
    [
      authStatus,
      onboardingComplete,
      isUpdateRequired,
    ],
  );

  const currentRoute = useMemo(
    () =>
      resolveRoute(
        requestedRoute,
        routeState,
      ),
    [
      requestedRoute,
      routeState,
    ],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authStatus,
      onboardingComplete,
      requestedRoute,
      currentRoute,
      isUpdateRequired,
      isLoading,
      error,
      refreshAuth,
      setRequestedRoute,
      clearError,
    }),
    [
      user,
      authStatus,
      onboardingComplete,
      requestedRoute,
      currentRoute,
      isUpdateRequired,
      isLoading,
      error,
      refreshAuth,
      clearError,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider.",
    );
  }

  return context;
}

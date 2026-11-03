// src/app/routePolicy.ts
export const APP_ROUTES = [
  "/auth",
  "/onboarding",
  "/home",
  "/learn",
  "/viva",
  "/hub",
  "/friends",
  "/bazaar",
  "/profile",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];
export type AuthStatus = "checking" | "anonymous" | "verified";

export type RouteState = {
  authStatus: AuthStatus;
  onboardingComplete: boolean | null;
  isUpdateRequired: boolean;
};

export function resolveRoute(
  requested: AppRoute,
  state: RouteState,
): AppRoute | "boot" | "update" {
  if (state.isUpdateRequired) return "update";
  if (state.authStatus === "checking") return "boot";
  if (state.authStatus !== "verified") return "/auth";
  if (state.onboardingComplete === null) return "boot";
  if (!state.onboardingComplete) return "/onboarding";

  return requested === "/auth" || requested === "/onboarding"
    ? "/home"
    : requested;
}

export function showAppChrome(route: AppRoute): boolean {
  return !["/auth", "/onboarding", "/learn", "/viva"].includes(route);
}

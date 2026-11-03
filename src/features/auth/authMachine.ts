// src/features/auth/authMachine.ts
export type AuthMachineState =
  | "idle"
  | "submitting"
  | "telemetry"
  | "verification-pending"
  | "identity-verified"
  | "login-ready"
  | "error";

export type AuthMode = "login" | "signup" | "forgot-password" | "recovery";

export type AuthMachineContext = {
  state: AuthMachineState;
  mode: AuthMode;
  email: string;
  error: string | null;
  notice: string | null;
};

export type AuthMachineEvent =
  | { type: "LOGIN_SUBMIT"; email: string }
  | { type: "SIGNUP_SUBMIT"; email: string }
  | { type: "FORGOT_PASSWORD_SUBMIT"; email: string }
  | { type: "RECOVERY_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "EMAIL_VERIFICATION_REQUIRED"; message?: string }
  | { type: "IDENTITY_VERIFIED" }
  | { type: "TELEMETRY_COMPLETE" }
  | { type: "FAIL"; message: string }
  | { type: "RESET_ERROR" }
  | { type: "SET_MODE"; mode: AuthMode };

export const initialAuthMachineContext: AuthMachineContext = {
  state: "idle",
  mode: "login",
  email: "",
  error: null,
  notice: null,
};

export function authMachineReducer(
  context: AuthMachineContext,
  event: AuthMachineEvent,
): AuthMachineContext {
  switch (event.type) {
    case "LOGIN_SUBMIT":
      return {
        ...context,
        state: "submitting",
        mode: "login",
        email: event.email,
        error: null,
        notice: null,
      };

    case "SIGNUP_SUBMIT":
      return {
        ...context,
        state: "submitting",
        mode: "signup",
        email: event.email,
        error: null,
        notice: null,
      };

    case "FORGOT_PASSWORD_SUBMIT":
      return {
        ...context,
        state: "submitting",
        mode: "forgot-password",
        email: event.email,
        error: null,
        notice: null,
      };

    case "RECOVERY_START":
      return {
        ...context,
        state: "identity-verified",
        mode: "recovery",
        error: null,
        notice: null,
      };

    case "SUBMIT_SUCCESS":
      return {
        ...context,
        state: "telemetry",
        error: null,
        notice: null,
      };

    case "EMAIL_VERIFICATION_REQUIRED":
      return {
        ...context,
        state: "verification-pending",
        error: null,
        notice:
          event.message ??
          "Check your email to verify your account before signing in.",
      };

    case "IDENTITY_VERIFIED":
      return {
        ...context,
        state: "identity-verified",
        error: null,
        notice: null,
      };

    case "TELEMETRY_COMPLETE":
      return {
        ...context,
        state: "login-ready",
        error: null,
      };

    case "FAIL":
      return {
        ...context,
        state: "error",
        error: event.message,
        notice: null,
      };

    case "RESET_ERROR":
      return {
        ...context,
        state: "idle",
        error: null,
        notice: null,
      };

    case "SET_MODE":
      return {
        ...context,
        state: "idle",
        mode: event.mode,
        error: null,
        notice: null,
      };

    default:
      return context;
  }
}

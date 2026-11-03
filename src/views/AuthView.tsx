// src/views/AuthView.tsx
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  authMachineReducer,
  initialAuthMachineContext,
  type AuthMode,
} from "../features/auth/authMachine";
import { supabase } from "../lib/supabase";

type AuthViewProps = {
  initialMode?: AuthMode;
};

const TELEMETRY_DELAY_MS = 3000;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isGmailAddress(email: string): boolean {
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(email);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getRedirectUrl(): string {
  return `${window.location.origin}/auth?mode=recovery`;
}

export function AuthView({
  initialMode = "login",
}: AuthViewProps) {
  const navigate = useNavigate();

  const [machine, dispatch] = useReducer(
    authMachineReducer,
    {
      ...initialAuthMachineContext,
      mode: initialMode,
    },
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isSubmitting = machine.state === "submitting";
  const isTelemetry = machine.state === "telemetry";
  const isBusy = isSubmitting || isTelemetry;
  const isRecovery = machine.mode === "recovery";
  const isForgotPassword = machine.mode === "forgot-password";

  const heading = useMemo(() => {
    if (isRecovery) {
      return "Set a new password";
    }

    if (isForgotPassword) {
      return "Recover your account";
    }

    if (machine.mode === "signup") {
      return "Create your account";
    }

    return "Welcome back";
  }, [isForgotPassword, isRecovery, machine.mode]);

  const submitLabel = useMemo(() => {
    if (isTelemetry) {
      return "Preparing your study space";
    }

    if (isRecovery) {
      return "Update password";
    }

    if (isForgotPassword) {
      return "Send recovery email";
    }

    if (machine.mode === "signup") {
      return "Create account";
    }

    return "Log in";
  }, [isForgotPassword, isRecovery, isTelemetry, machine.mode]);

  const resetForm = useCallback((mode: AuthMode) => {
    dispatch({ type: "SET_MODE", mode });
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");

    if (mode === "recovery") {
      dispatch({ type: "RECOVERY_START" });
    }
  }, []);

  useEffect(() => {
    if (machine.state !== "telemetry") {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "TELEMETRY_COMPLETE" });
      navigate("/home", { replace: true });
    }, TELEMETRY_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [machine.state, navigate]);

  const validateEmail = useCallback((): string | null => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return "Enter your Gmail address.";
    }

    if (!isGmailAddress(normalizedEmail)) {
      return "Use a valid Gmail address ending in @gmail.com.";
    }

    return null;
  }, [email]);

  const validatePassword = useCallback((): string | null => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (isRecovery && password !== confirmation) {
      return "The passwords do not match.";
    }

    return null;
  }, [confirmation, isRecovery, password]);

  const handleLogin = useCallback(async () => {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Login did not return a verified user.");
    }

    const {
      data: { user: verifiedUser },
      error: verificationError,
    } = await supabase.auth.getUser();

    if (verificationError || !verifiedUser) {
      throw verificationError ?? new Error("Unable to verify your identity.");
    }

    dispatch({ type: "IDENTITY_VERIFIED" });
    dispatch({ type: "SUBMIT_SUCCESS" });
  }, [email, password]);

  const handleSignup = useCallback(async () => {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      throw error;
    }

    if (data.session && data.user) {
      const {
        data: { user: verifiedUser },
        error: verificationError,
      } = await supabase.auth.getUser();

      if (verificationError || !verifiedUser) {
        throw (
          verificationError ??
          new Error("Unable to verify your identity.")
        );
      }

      dispatch({ type: "IDENTITY_VERIFIED" });
      dispatch({ type: "SUBMIT_SUCCESS" });
      return;
    }

    dispatch({
      type: "EMAIL_VERIFICATION_REQUIRED",
      message:
        "Your account was created. Check your Gmail inbox to verify your email.",
    });
  }, [email, password]);

  const handleForgotPassword = useCallback(async () => {
    const normalizedEmail = normalizeEmail(email);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: getRedirectUrl(),
        },
      );

    if (error) {
      throw error;
    }

    dispatch({
      type: "EMAIL_VERIFICATION_REQUIRED",
      message:
        "If an account matches that address, a recovery email has been sent.",
    });
  }, [email]);

  const handleRecovery = useCallback(async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    dispatch({ type: "IDENTITY_VERIFIED" });
    dispatch({ type: "SUBMIT_SUCCESS" });
  }, [password]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    dispatch({ type: "RESET_ERROR" });

    const emailError = validateEmail();
    if (emailError) {
      dispatch({ type: "FAIL", message: emailError });
      return;
    }

    if (!isForgotPassword) {
      const passwordError = validatePassword();
      if (passwordError) {
        dispatch({ type: "FAIL", message: passwordError });
        return;
      }
    }

    const normalizedEmail = normalizeEmail(email);

    if (isRecovery) {
      dispatch({ type: "LOGIN_SUBMIT", email: normalizedEmail });
    } else if (isForgotPassword) {
      dispatch({
        type: "FORGOT_PASSWORD_SUBMIT",
        email: normalizedEmail,
      });
    } else if (machine.mode === "signup") {
      dispatch({
        type: "SIGNUP_SUBMIT",
        email: normalizedEmail,
      });
    } else {
      dispatch({
        type: "LOGIN_SUBMIT",
        email: normalizedEmail,
      });
    }

    try {
      if (isRecovery) {
        await handleRecovery();
      } else if (isForgotPassword) {
        await handleForgotPassword();
      } else if (machine.mode === "signup") {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (caughtError) {
      dispatch({
        type: "FAIL",
        message: getErrorMessage(caughtError),
      });
    }
  };

  const handleModeChange = (mode: AuthMode) => {
    resetForm(mode);
    setEmail("");
  };

  return (
    <main className="auth-view">
      <section
        className="auth-card"
        aria-labelledby="auth-heading"
      >
        <div className="auth-card__intro">
          <p className="auth-card__eyebrow">StudyMitra</p>
          <h1 id="auth-heading">{heading}</h1>

          {!isForgotPassword && !isRecovery && (
            <p className="auth-card__description">
              Build a steady learning habit with a focused study space.
            </p>
          )}
        </div>

        <div
          className="auth-status"
          aria-live="polite"
          role="status"
        >
          {isTelemetry && (
            <span>
              Verifying your account and preparing your study space.
            </span>
          )}

          {machine.notice && <span>{machine.notice}</span>}

          {machine.error && (
            <span className="auth-status__error">
              {machine.error}
            </span>
          )}
        </div>

        {!isTelemetry && machine.state !== "verification-pending" && (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {!isRecovery && (
              <label className="auth-field">
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete={
                    machine.mode === "signup"
                      ? "email"
                      : "username"
                  }
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="name@gmail.com"
                  disabled={isBusy}
                  required
                />
              </label>
            )}

            {!isForgotPassword && (
              <label className="auth-field">
                <span>
                  {isRecovery ? "New password" : "Password"}
                </span>
                <span className="auth-password-control">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRecovery
                        ? "new-password"
                        : machine.mode === "signup"
                        ? "new-password"
                        : "current-password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    disabled={isBusy}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword((visible) => !visible)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={isBusy}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            )}

            {isRecovery && (
              <label className="auth-field">
                <span>Confirm new password</span>
                <input
                  name="password-confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(event.target.value)
                  }
                  disabled={isBusy}
                  required
                />
              </label>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={isBusy}
            >
              {isBusy ? "Please wait" : submitLabel}
            </button>
          </form>
        )}

        {!isRecovery && !isForgotPassword && (
          <div className="auth-mode-switcher">
            <button
              type="button"
              className={
                machine.mode === "login"
                  ? "is-selected"
                  : ""
              }
              onClick={() => handleModeChange("login")}
              disabled={isBusy}
              aria-pressed={machine.mode === "login"}
            >
              Log in
            </button>

            <button
              type="button"
              className={
                machine.mode === "signup"
                  ? "is-selected"
                  : ""
              }
              onClick={() => handleModeChange("signup")}
              disabled={isBusy}
              aria-pressed={machine.mode === "signup"}
            >
              Sign up
            </button>
          </div>
        )}

        {machine.mode === "login" && !isBusy && (
          <button
            type="button"
            className="auth-secondary-action"
            onClick={() => handleModeChange("forgot-password")}
          >
            Forgot password?
          </button>
        )}

        {(isForgotPassword ||
          machine.state === "verification-pending") &&
          !isBusy && (
            <button
              type="button"
              className="auth-secondary-action"
              onClick={() => handleModeChange("login")}
            >
              Return to login
            </button>
          )}
      </section>
    </main>
  );
        }

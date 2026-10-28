"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail, CheckCircle2, RefreshCw, ArrowRight, Crop, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageCropModal } from "@/components/image-crop-modal";

const disposableDomains = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "yopmail.com",
  "temp-mail.org",
]);

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 9) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

async function isBreached(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`,
  );
  if (!response.ok) return false;
  const suffix = hash.slice(5);
  return (await response.text())
    .split("\n")
    .some((line) => line.startsWith(suffix));
}

export function AuthShell({
  mode,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
}) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [rawAvatarSrc, setRawAvatarSrc] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("error") || "";
    }
    return "";
  });
  const [busy, setBusy] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();
  const score = passwordScore(password);
  const passwordsMatch = !confirmation || password === confirmation;

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (mode === "login" || mode === "signup") {
      try {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setIsNavigating(true);
            window.location.assign("/dashboard");
          }
        }).catch(() => {});
      } catch {}
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "signup") return;
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus("idle");
      setUsernameFeedback("");
      setUsernameSuggestions([]);
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Username must be at least 3 characters.");
      setUsernameSuggestions([]);
      return;
    }

    if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Use 3 to 24 letters, numbers, periods, or underscores.");
      setUsernameSuggestions([]);
      return;
    }

    setUsernameStatus("checking");
    setUsernameFeedback("Checking availability...");

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/username?username=${encodeURIComponent(cleanUsername)}`
        );
        if (!active) return;
        if (!res.ok) {
          setUsernameStatus("invalid");
          setUsernameFeedback("Username lookup is currently unavailable.");
          return;
        }
        const data = await res.json();
        if (!active) return;

        if (data.available) {
          setUsernameStatus("available");
          setUsernameFeedback("Username is available");
          setUsernameSuggestions([]);
        } else {
          setUsernameStatus("taken");
          setUsernameFeedback("This username is already used.");
          setUsernameSuggestions(data.suggestions || []);
        }
      } catch {
        if (active) {
          setUsernameStatus("invalid");
          setUsernameFeedback("Network error checking username.");
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, mode]);

  const handleAvatarFile = (file: File | undefined) => {
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose an image file smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setRawAvatarSrc(result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    let navigating = false;
    try {
      const supabase = createClient();
      if (mode === "login") {
        const identity = emailOrUsername.trim().toLowerCase();
        if (!identity) {
          throw new Error("Enter your username or email address.");
        }
        if (!password) {
          throw new Error("Enter your account password.");
        }

        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity, password }),
        });

        const loginData = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok) {
          throw new Error(loginData.error || "Unable to sign in. Check your credentials.");
        }

        if (loginData.session) {
          await supabase.auth.setSession({
            access_token: loginData.session.access_token,
            refresh_token: loginData.session.refresh_token,
          });
        }

        navigating = true;
        setIsNavigating(true);
        router.refresh();
        window.location.assign("/dashboard");
        return;
      } else if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          },
        );
        if (result.error) throw result.error;
        setMessage(
          "If an account exists for that email, a reset link has been sent.",
        );
      } else if (mode === "reset") {
        if (score < 5 || password !== confirmation)
          throw new Error("Use a strong matching password before continuing.");
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setMessage("Password updated. You can now sign in.");
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();

        if (usernameStatus === "taken") {
          throw new Error("This username is already used. Please choose another username.");
        }
        if (usernameStatus === "checking") {
          throw new Error("Checking username availability. Please wait a moment.");
        }
        if (!/^[a-z0-9._]{3,24}$/.test(normalizedUsername))
          throw new Error(
            "Username must be 3 to 24 characters using letters, numbers, periods, or underscores.",
          );
        if (disposableDomains.has(normalizedEmail.split("@")[1] || ""))
          throw new Error("Temporary email addresses are not accepted.");
        if (
          password.toLowerCase().includes(normalizedUsername) ||
          password.toLowerCase().includes(normalizedEmail.split("@")[0])
        )
          throw new Error(
            "Password cannot contain your name, username, or email.",
          );
        if (score < 5)
          throw new Error(
            "Password needs 9+ characters, upper and lowercase letters, a number, and a symbol.",
          );
        if (password !== confirmation)
          throw new Error("Passwords do not match.");
        if (await isBreached(password))
          throw new Error(
            "That password has appeared in a breach. Choose a different one.",
          );

        const availabilityRes = await fetch(
          `/api/auth/username?username=${encodeURIComponent(normalizedUsername)}`,
        );
        if (!availabilityRes.ok)
          throw new Error("Could not verify username availability. Please try again.");

        const availabilityData = await availabilityRes.json();
        if (!availabilityData.available) {
          setUsernameStatus("taken");
          setUsernameSuggestions(availabilityData.suggestions || []);
          throw new Error("This username is already used. Please choose another username.");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("daydraft_pending_name", name.trim());
          localStorage.setItem("daydraft_pending_username", normalizedUsername);
          localStorage.setItem("daydraft_is_first_session", "true");
          if (avatarPreview) {
            localStorage.setItem("daydraft_pending_avatar", avatarPreview);
          }
        }

        const result = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            data: {
              username: normalizedUsername,
              name: name.trim(),
              avatar_url: "",
            },
          },
        });
        if (result.error) throw result.error;

        if (result.data?.session) {
          try {
            await supabase.from("profiles").upsert(
              {
                id: result.data.session.user.id,
                username: normalizedUsername,
                name: name.trim(),
                email: normalizedEmail,
                avatar_url: "",
              },
              { onConflict: "id" }
            );
          } catch {}
          navigating = true;
          setIsNavigating(true);
          router.refresh();
          window.location.assign("/dashboard");
          return;
        }

        setPendingVerificationEmail(normalizedEmail);
        setMessage(
          "Account created. Check your email for a confirmation link or enter the 6-digit code below."
        );
      }
    } catch (caught) {
      let errorMessage = caught instanceof Error ? caught.message : "Authentication failed. Please try again.";

      if (errorMessage.includes("Database error saving new user")) {
        errorMessage = "A database error occurred. This usually means the username or email is already taken.";
      } else if (errorMessage.toLowerCase().includes("rate limit") || errorMessage.includes("Error sending confirmation mail")) {
        errorMessage = "We couldn't send the confirmation email due to email provider limits. Please try again in a few minutes.";
      }

      setError(errorMessage);
    } finally {
      if (!navigating) {
        setBusy(false);
      }
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingVerificationEmail || otpCode.trim().length < 6) return;
    setError("");
    setMessage("");
    setOtpBusy(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingVerificationEmail,
        token: otpCode.trim(),
        type: "signup",
      });
      if (verifyError) throw verifyError;
      if (data.session) {
        if (typeof window !== "undefined") {
          const pendingName = localStorage.getItem("daydraft_pending_name") || "";
          const pendingUsername = localStorage.getItem("daydraft_pending_username") || "";
          localStorage.setItem("daydraft_is_first_session", "true");
          if (pendingUsername) {
            try {
              await supabase.from("profiles").upsert(
                {
                  id: data.session.user.id,
                  username: pendingUsername,
                  name: pendingName,
                  email: pendingVerificationEmail,
                  avatar_url: "",
                },
                { onConflict: "id" }
              );
            } catch {}
          }
        }
        setIsNavigating(true);
        router.refresh();
        window.location.assign("/dashboard");
        return;
      } else {
        setMessage("Email verified successfully! You can now sign in.");
        setPendingVerificationEmail(null);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid or expired confirmation code."
      );
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setResendBusy(true);
    setError("");
    setResendMessage("");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingVerificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (resendError) throw resendError;
      setResendMessage("A new confirmation email and code were dispatched.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not resend confirmation email."
      );
    } finally {
      setResendBusy(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to initialize Google Sign In. Please try again."
      );
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : mode === "forgot"
          ? "Recover account"
          : "Choose a new password";

  const subtitle =
    mode === "login"
      ? "Sign in to continue to your Daydraft workspace."
      : mode === "signup"
        ? "Get organized with clarity and focus."
        : mode === "forgot"
          ? "Enter your email to receive a password reset link."
          : "Enter your new secure password below.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f2] dark:bg-zinc-950 px-4 py-4 sm:px-6 sm:py-8 text-[#15211c] dark:text-zinc-100 transition-colors">
      <div className="mx-auto grid w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-none lg:grid-cols-[0.8fr_1.2fr] overflow-hidden transition-colors">
        <aside className="bg-[#15211c] dark:bg-zinc-950/90 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800/40">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/logo.jpg"
                alt="Daydraft logo"
                width={32}
                height={32}
                className="rounded-lg shadow-xs"
              />
              <span className="text-base font-semibold tracking-tight">Daydraft</span>
            </Link>

            <div className="mt-6 lg:mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                A calmer day starts here
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight tracking-[-0.03em]">
                Make room for the work that matters.
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/60">
                Quietly transform mental chaos into structured tasks, schedules, and actionable focus.
              </p>
            </div>
          </div>

          {mode === "signup" ? (
            <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                  Profile Preview
                </span>
                {usernameStatus === "taken" && (
                  <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                    Taken
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-semibold text-white overflow-hidden shrink-0 shadow-xs text-xs">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name ? name.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : "U")
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-white truncate">
                    {name || "Your Name"}
                  </span>
                  <span
                    className={`block text-[11px] font-mono truncate transition-colors ${
                      usernameStatus === "taken"
                        ? "text-rose-300"
                        : usernameStatus === "available"
                          ? "text-emerald-300"
                          : "text-white/60"
                    }`}
                  >
                    @{username ? username.toLowerCase().replace(/[^a-z0-9._]/g, "") : "username"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 hidden lg:block p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 leading-relaxed">
              Your tasks, notes, and habits are end-to-end encrypted and safely stored.
            </div>
          )}
        </aside>

        <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-9">
          {pendingVerificationEmail ? (
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerificationEmail(null);
                    setError("");
                    setMessage("");
                  }}
                  className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back / Change email
                </button>
                <ThemeToggle />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#15211c] dark:text-zinc-100">
                    Verify your email
                  </h2>
                  <p className="text-xs text-[#66766d] dark:text-zinc-400">
                    Enter the code sent to your inbox to finish.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#66766d] dark:text-zinc-400">
                Code sent to{" "}
                <span className="font-semibold text-[#15211c] dark:text-zinc-200">
                  {pendingVerificationEmail}
                </span>
                . Enter the 6-digit confirmation code:
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                  6-Digit Code
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="auth-input text-center text-xl font-mono tracking-[0.35em] font-semibold !py-2 !mt-1"
                    required
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 p-2.5 text-xs text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}

                {resendMessage && (
                  <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{resendMessage}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otpBusy || otpCode.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  {otpBusy ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Confirm Code
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between border-t border-[#e2eae3] dark:border-zinc-800 pt-3 text-xs text-[#66766d] dark:text-zinc-400">
                <span>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendBusy}
                  className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendBusy ? "Resending..." : "Resend email"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <Link
                  href="/login"
                  className="text-xs font-medium text-[#66766d] dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200 hover:underline"
                >
                  Already verified? Sign in &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Daydraft
                </Link>
                <ThemeToggle />
              </div>

              <div className="mt-3">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#15211c] dark:text-zinc-100">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-[#66766d] dark:text-zinc-400">
                  {subtitle}
                </p>
              </div>

              {(mode === "login" || mode === "signup") && (
                <>
                  <div className="mt-3.5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={busy || isNavigating}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>
                        {mode === "login" ? "Sign in with Google" : "Continue with Google"}
                      </span>
                    </button>
                  </div>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <span className="relative bg-white dark:bg-zinc-900 px-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                      or with email
                    </span>
                  </div>
                </>
              )}

              <form onSubmit={submit} className="space-y-2.5">
                {mode === "signup" && (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 px-3 py-1.5">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          handleAvatarFile(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/80 bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 cursor-pointer shadow-2xs"
                        >
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "+"
                          )}
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                          {avatarPreview ? "Avatar uploaded" : "Profile photo (optional)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs">
                        {avatarPreview ? (
                          <>
                            {rawAvatarSrc && (
                              <button
                                type="button"
                                onClick={() => setIsCropModalOpen(true)}
                                className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                              >
                                Crop
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarPreview("");
                                setRawAvatarSrc("");
                              }}
                              className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Choose image
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                          Name
                        </label>
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="auth-input !mt-1 !py-2 !px-3 text-base"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                            Username
                          </label>
                          <span className="text-[10px] text-[#89968d] dark:text-zinc-500 font-mono">
                            {username.length}/24
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            required
                            value={username}
                            onChange={(e) =>
                              setUsername(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9._]/g, "")
                              )
                            }
                            className={`auth-input !mt-1 !py-2 !px-3 pr-8 text-xs sm:text-sm font-mono ${
                              usernameStatus === "taken"
                                ? "border-rose-400 dark:border-rose-500 bg-rose-50/20 dark:bg-rose-950/10"
                                : usernameStatus === "available"
                                  ? "border-emerald-500/80 dark:border-emerald-500"
                                  : ""
                            }`}
                            placeholder="username"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            {usernameStatus === "checking" && (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                            )}
                            {usernameStatus === "available" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {usernameStatus === "taken" && (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {usernameStatus === "taken" && (
                      <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 px-2.5 py-1.5 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">Username taken.</span>
                        {usernameSuggestions.length > 0 && (
                          <>
                            <span>Try:</span>
                            {usernameSuggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setUsername(sug)}
                                className="font-mono underline font-medium hover:text-rose-800 dark:hover:text-rose-300 cursor-pointer"
                              >
                                @{sug}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {usernameStatus === "invalid" && username.length > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {usernameFeedback}
                      </p>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input !mt-1 !py-2 !px-3 text-base"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                          Password
                        </label>
                        <input
                          required
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input !mt-1 !py-2 !px-3 text-base"
                          placeholder="Min 9 chars"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                          Confirm password
                        </label>
                        <input
                          required
                          type="password"
                          value={confirmation}
                          onChange={(e) => setConfirmation(e.target.value)}
                          className="auth-input !mt-1 !py-2 !px-3 text-base"
                          placeholder="Repeat password"
                        />
                      </div>
                    </div>

                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                index < score ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                            />
                          ))}
                        </div>
                        {!passwordsMatch && (
                          <p className="text-[11px] text-rose-500">
                            Passwords do not match.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {mode === "login" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                        Username or email
                      </label>
                      <input
                        required
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        className="auth-input !mt-1 !py-2.5 !px-3.5 text-base"
                        placeholder="you or you@example.com"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                          Password
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input !mt-1 !py-2.5 !px-3.5 text-base"
                        placeholder="Your password"
                      />
                    </div>
                  </>
                )}

                {mode === "forgot" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                      Account email
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input !mt-1 !py-2.5 !px-3.5 text-base"
                      placeholder="you@example.com"
                    />
                  </div>
                )}

                {mode === "reset" && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                        New password
                      </label>
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input !mt-1 !py-2 !px-3 text-base"
                        placeholder="New secure password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                        Confirm new password
                      </label>
                      <input
                        required
                        type="password"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        className="auth-input !mt-1 !py-2 !px-3 text-base"
                        placeholder="Repeat new password"
                      />
                    </div>
                    {!passwordsMatch && (
                      <p className="text-[11px] text-rose-500">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 p-2.5 text-xs text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    busy ||
                    isNavigating ||
                    (mode === "signup" &&
                      (usernameStatus === "taken" || usernameStatus === "checking"))
                  }
                  className="w-full rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1 shadow-xs hover:shadow"
                >
                  {isNavigating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Signing in...</span>
                    </>
                  ) : busy ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Working...</span>
                    </>
                  ) : mode === "login" ? (
                    "Sign in with Email"
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : mode === "forgot" ? (
                    "Send reset link"
                  ) : (
                    "Update password"
                  )}
                </button>

                {mode === "signup" && (
                  <p className="text-center text-[10px] text-[#89968d] dark:text-zinc-500 pt-0.5">
                    By registering, you accept our{" "}
                    <Link href="/terms" className="underline text-zinc-600 dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline text-zinc-600 dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                )}
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs text-[#66766d] dark:text-zinc-400">
                {mode === "login" && (
                  <>
                    <span>Don&apos;t have an account?</span>
                    <Link href="/signup" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                      Create account &rarr;
                    </Link>
                  </>
                )}
                {mode === "signup" && (
                  <>
                    <span>Already have an account?</span>
                    <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                      Sign in &rarr;
                    </Link>
                  </>
                )}
                {(mode === "forgot" || mode === "reset") && (
                  <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                    &larr; Back to sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawAvatarSrc}
        onClose={() => setIsCropModalOpen(false)}
        onApply={(cropped) => {
          setAvatarPreview(cropped);
        }}
      />
    </main>
  );
}

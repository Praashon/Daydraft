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
        });
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


  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your workspace"
        : mode === "forgot"
          ? "Recover your account"
          : "Choose a new password";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f2] dark:bg-zinc-950 px-6 py-8 text-[#15211c] dark:text-zinc-100 sm:py-12 transition-colors">
      <div className="mx-auto grid max-h-[calc(100vh-4rem)] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_25px_80px_rgba(21,33,28,0.1)] dark:shadow-none lg:grid-cols-[0.85fr_1.15fr] transition-colors">
        <aside className="bg-[#15211c] dark:bg-zinc-950/80 p-8 text-white sm:p-12 border-b lg:border-b-0 lg:border-r border-zinc-800/40">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Daydraft logo"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-lg font-semibold">Daydraft</span>
          </Link>
          <div className="mt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              A calmer day starts here
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Make room for the work that matters.
            </h1>
            <p className="mt-5 text-sm leading-6 text-white/60">
              Secure account access for your tasks, notes, priorities, and daily
              plans.
            </p>
          </div>
          {mode === "signup" && (
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                  Live Profile Preview
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-semibold text-white overflow-hidden shrink-0 shadow-xs">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name ? name.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : "U")
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white truncate">
                    {name || "Your Name"}
                  </span>
                  <span
                    className={`block text-xs font-mono truncate transition-colors ${
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
          )}
        </aside>
        <section className="flex flex-col justify-center p-7 sm:p-12">
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
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change email / Back
                </button>
                <ThemeToggle />
              </div>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#15211c] dark:text-zinc-100">
                    Verify your email
                  </h2>
                  <p className="text-xs text-[#66766d] dark:text-zinc-400">
                    Almost there! Confirm your Daydraft account.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#66766d] dark:text-zinc-400">
                We sent a confirmation link and 6-digit code to{" "}
                <span className="font-semibold text-[#15211c] dark:text-zinc-200">
                  {pendingVerificationEmail}
                </span>
                . Click the link in your email, or enter the code below:
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  6-Digit Confirmation Code
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
                    className="auth-input text-center text-2xl font-mono tracking-[0.35em] font-semibold"
                    required
                  />
                </label>

                {error && (
                  <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}

                {resendMessage && (
                  <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{resendMessage}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otpBusy || otpCode.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  {otpBusy ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Confirm Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between border-t border-[#e2eae3] dark:border-zinc-800 pt-4 text-sm text-[#66766d] dark:text-zinc-400">
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

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-xs font-medium text-[#66766d] dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200 hover:underline"
                >
                  Already verified via email link? Sign in &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Daydraft
                </Link>
                <ThemeToggle />
              </div>
              <h2 className="mt-7 text-3xl font-semibold tracking-[-0.04em] text-[#15211c] dark:text-zinc-100">
                {title}
              </h2>
              <p className="mt-2 text-sm text-[#66766d] dark:text-zinc-400">
                {mode === "signup"
                  ? "Your email must be verified before your first sign in."
                  : "Your account stays protected by Supabase Auth."}
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  Profile picture
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
                  {avatarPreview ? (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 truncate">
                          Photo cropped & ready
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {rawAvatarSrc && (
                          <button
                            type="button"
                            onClick={() => setIsCropModalOpen(true)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition-colors cursor-pointer"
                          >
                            Recrop
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarPreview("");
                            setRawAvatarSrc("");
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-left text-sm font-normal text-[#66766d] dark:text-zinc-400 hover:border-emerald-600 dark:hover:border-emerald-500 cursor-pointer"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium text-lg">
                        +
                      </span>
                      <span>Choose a profile image</span>
                    </button>
                  )}
                </label>
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="auth-input"
                    placeholder="Your name"
                  />
                </label>
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  Username
                  <div className="relative">
                    <input
                      required
                      value={username}
                      onChange={(event) =>
                        setUsername(
                          event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9._]/g, "")
                        )
                      }
                      className={`auth-input font-mono pr-9 transition-all ${
                        usernameStatus === "taken"
                          ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10"
                          : usernameStatus === "available"
                            ? "border-emerald-500/80 dark:border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                            : ""
                      }`}
                      placeholder="your.username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {usernameStatus === "checking" && (
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                      )}
                      {usernameStatus === "available" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {usernameStatus === "taken" && (
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5 px-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[#66766d] dark:text-zinc-400">Public handle:</span>
                        <span
                          className={`font-mono font-medium px-2 py-0.5 rounded-md border truncate transition-colors ${
                            usernameStatus === "taken"
                              ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/60"
                              : usernameStatus === "available"
                                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60"
                                : "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60"
                          }`}
                        >
                          @{username || "username"}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#89968d] dark:text-zinc-500 font-mono shrink-0">
                        {username.length}/24
                      </span>
                    </div>

                    {usernameStatus === "taken" && (
                      <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 p-3 text-xs text-rose-700 dark:text-rose-400 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>This username is already used.</span>
                        </div>
                        {usernameSuggestions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-zinc-600 dark:text-zinc-400">Available:</span>
                            {usernameSuggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setUsername(sug)}
                                className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 transition-all active:scale-95 cursor-pointer"
                              >
                                @{sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {usernameStatus === "available" && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Username is available</span>
                      </div>
                    )}

                    {usernameStatus === "checking" && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                        <span>Checking availability...</span>
                      </div>
                    )}

                    {usernameStatus === "invalid" && username.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {usernameFeedback}
                      </p>
                    )}
                  </div>
                </label>
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input"
                    placeholder="you@example.com"
                  />
                </label>
              </>
            )}
            {mode === "login" && (
              <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                Username or email
                <input
                  required
                  value={emailOrUsername}
                  onChange={(event) => setEmailOrUsername(event.target.value)}
                  className="auth-input"
                  placeholder="you or you@example.com"
                />
              </label>
            )}
            {mode === "forgot" && (
              <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                />
              </label>
            )}
            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <>
                <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                  Password
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="auth-input"
                    placeholder="Your secure password"
                  />
                </label>
                {mode === "signup" && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${index < score ? "bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-800"}`}
                      />
                    ))}
                  </div>
                )}
                {(mode === "signup" || mode === "reset") && (
                  <label className="block text-sm font-semibold text-[#15211c] dark:text-zinc-200">
                    Confirm password
                    <input
                      required
                      type="password"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      className="auth-input"
                      placeholder="Repeat your password"
                    />
                    {!passwordsMatch && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Passwords do not match.
                      </p>
                    )}
                  </label>
                )}
              </>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                {message}
              </p>
            )}
            <button
              disabled={
                busy ||
                isNavigating ||
                (mode === "signup" &&
                  (usernameStatus === "taken" || usernameStatus === "checking"))
              }
              className="w-full rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isNavigating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Signing in...</span>
                </>
              ) : busy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Working...</span>
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : mode === "signup" ? (
                "Create account"
              ) : mode === "forgot" ? (
                "Send reset link"
              ) : (
                "Update password"
              )}
            </button>
            {mode === "signup" && (
              <p className="text-center text-xs text-[#89968d] dark:text-zinc-500">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="underline text-zinc-600 dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline text-zinc-600 dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-200">
                  Privacy Policy
                </Link>
                .
              </p>
            )}
          </form>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#66766d] dark:text-zinc-400">
            {mode === "login" && (
              <>
                <Link href="/signup" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                  Create account
                </Link>
                <Link
                  href="/forgot-password"
                  className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </>
            )}
            {mode === "signup" && (
              <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                Already have an account?
              </Link>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                Back to sign in
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

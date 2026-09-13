"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, RefreshCw, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
  try {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-1", bytes);
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`
    );
    if (!response.ok) return false;
    const suffix = hash.slice(5);
    return (await response.text())
      .split("\n")
      .some((line) => line.startsWith(suffix));
  } catch {
    return false;
  }
}

export default function GoogleAuthSetupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const score = passwordScore(password);
  const passwordsMatch = !confirmation || password === confirmation;

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.assign("/login");
          return;
        }

        // If already completed profile and password, go straight to dashboard
        const providers = user.app_metadata?.providers || [];
        const hasEmailProvider = providers.includes("email");
        if (hasEmailProvider || (user.user_metadata?.profile_completed && user.user_metadata?.has_password)) {
          window.location.assign("/dashboard");
          return;
        }

        setEmail(user.email || "");
        const gName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          "";
        setName(gName);

        const gAvatar =
          (user.user_metadata?.avatar_url as string) ||
          (user.user_metadata?.picture as string) ||
          "";
        setAvatarUrl(gAvatar);

        // Pre-fill a suggestion from email prefix
        const prefix = (user.email ? user.email.split("@")[0] : "")
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, "");
        if (prefix) {
          setUsername(prefix);
        }
      } catch (err) {
        console.error("Init setup error:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    init();
  }, []);

  // Exact same username checking authentication as create account
  useEffect(() => {
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
  }, [username]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session found. Please sign in again.");

      const cleanUsername = username.trim().toLowerCase();
      if (usernameStatus === "taken") {
        throw new Error("This username is already taken. Please choose another username.");
      }
      if (usernameStatus === "checking") {
        throw new Error("Checking username availability. Please wait a moment.");
      }
      if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
        throw new Error("Username must be 3 to 24 characters using letters, numbers, periods, or underscores.");
      }
      if (
        password.toLowerCase().includes(cleanUsername) ||
        (email && password.toLowerCase().includes(email.split("@")[0]))
      ) {
        throw new Error("Password cannot contain your username or email address.");
      }
      if (score < 5) {
        throw new Error("Password needs 9+ characters, upper and lowercase letters, a number, and a symbol.");
      }
      if (password !== confirmation) {
        throw new Error("Passwords do not match.");
      }
      if (await isBreached(password)) {
        throw new Error("That password has appeared in a breach. Choose a different one.");
      }

      // Final verification before persisting
      const availabilityRes = await fetch(
        `/api/auth/username?username=${encodeURIComponent(cleanUsername)}`
      );
      if (availabilityRes.ok) {
        const availabilityData = await availabilityRes.json();
        if (!availabilityData.available) {
          setUsernameStatus("taken");
          setUsernameSuggestions(availabilityData.suggestions || []);
          throw new Error("This username is already used. Please choose another username.");
        }
      }

      // Update Supabase Auth user with password and metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          username: cleanUsername,
          name: name.trim(),
          has_password: true,
          profile_completed: true,
          avatar_url: avatarUrl,
        },
      });
      if (updateError) throw updateError;

      // Upsert profile record
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          username: cleanUsername,
          name: name.trim(),
          email: user.email || email,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );
      if (profileError) throw profileError;

      if (typeof window !== "undefined") {
        localStorage.setItem("daydraft_is_first_session", "true");
      }

      window.location.assign("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to finish account setup.");
      setBusy(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f2] dark:bg-zinc-950 px-4">
        <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading account details...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f2] dark:bg-zinc-950 px-4 py-4 sm:px-6 sm:py-8 text-[#15211c] dark:text-zinc-100 transition-colors">
      <div className="mx-auto grid w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-none lg:grid-cols-[0.8fr_1.2fr] overflow-hidden transition-colors">
        <aside className="bg-[#15211c] dark:bg-zinc-950/90 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800/40">
          <div>
            <div className="inline-flex items-center gap-2.5">
              <Image
                src="/logo.jpg"
                alt="Daydraft logo"
                width={32}
                height={32}
                className="rounded-lg shadow-xs"
              />
              <span className="text-base font-semibold tracking-tight">Daydraft</span>
            </div>

            <div className="mt-6 lg:mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Step 2 of 2
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight tracking-[-0.03em]">
                Complete your account
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/60">
                We received your email and name from Google. Choose your personal handle and set a password to finalize your workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
              <span>Profile Preview</span>
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
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  name ? name.charAt(0).toUpperCase() : "U"
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
        </aside>

        <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-9">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
              <span className="truncate max-w-[200px] sm:max-w-[260px]">{email}</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="mt-3.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#15211c] dark:text-zinc-100">
              Set username & password
            </h2>
            <p className="mt-0.5 text-xs text-[#66766d] dark:text-zinc-400">
              Set a password so you can also log in directly without Google, and enable Multi-Factor Authentication.
            </p>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#15211c] dark:text-zinc-200">
                  Full Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input !mt-1 !py-2 !px-3 text-xs sm:text-sm"
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
                  className="auth-input !mt-1 !py-2 !px-3 text-xs sm:text-sm"
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
                  className="auth-input !mt-1 !py-2 !px-3 text-xs sm:text-sm"
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

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 p-2.5 text-xs text-red-700 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                busy ||
                usernameStatus === "taken" ||
                usernameStatus === "checking" ||
                score < 5 ||
                !passwordsMatch
              }
              className="w-full rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-xs hover:shadow"
            >
              {busy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Saving account details...</span>
                </>
              ) : (
                <>
                  <span>Complete setup & continue</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                document.cookie = "daydraft_setup_later=true; max-age=86400; path=/";
                window.location.assign("/dashboard");
              }}
              disabled={busy}
              className="w-full rounded-xl bg-transparent border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              Set up later
            </button>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>You can log in anytime with Google OR your username/password.</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

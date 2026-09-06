"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Clock3, ListChecks, Moon, Sun } from "lucide-react";
import { PRESET_BRAIN_DUMPS } from "@/lib/sample-data";
import { createClient } from "@/lib/supabase/client";
import { useAppContext } from "@/components/app-provider";
import { useTheme } from "@/components/theme-provider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface LandingPageProps {
  onLaunchApp: () => void;
  onRunDemoOrganize: (text: string) => void;
}

const demoTasks = [
  { label: "Finish React assignment", meta: "Friday, 5 PM", tone: "dark" },
  { label: "Buy groceries", meta: "Today, 2 PM", tone: "soft" },
  { label: "Call a friend", meta: "Tonight", tone: "soft" },
];

const demoSchedule = [
  { time: "09:00", label: "Finish React assignment", detail: "Deep work" },
  { time: "14:00", label: "Buy groceries", detail: "Quick reset" },
  { time: "19:00", label: "Call a friend", detail: "Wind down" },
];

export function LandingPage({
  onLaunchApp,
  onRunDemoOrganize,
}: LandingPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [sandboxInput, setSandboxInput] = useState("");
  const [isSandboxProcessing, setIsSandboxProcessing] = useState(false);
  const [isSandboxComplete, setIsSandboxComplete] = useState(false);
  const [isContactSent, setIsContactSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { user, isHydrated } = useAppContext();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  useGSAP(
    () => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".landing-kicker", { opacity: 0, y: 14, duration: 0.55 })
        .from(
          ".landing-title-line",
          { opacity: 0, y: 42, stagger: 0.1, duration: 0.8 },
          "-=0.2",
        )
        .from(".landing-copy", { opacity: 0, y: 18, duration: 0.6 }, "-=0.35")
        .from(
          ".landing-actions",
          { opacity: 0, y: 14, duration: 0.5 },
          "-=0.25",
        )
        .from(
          ".landing-hero-visual",
          { opacity: 0, y: 40, scale: 0.97, duration: 0.9 },
          "-=0.25",
        );

      gsap.utils.toArray<HTMLElement>(".story-reveal").forEach((element) => {
        gsap.from(element, {
          scrollTrigger: { trigger: element, start: "top 82%" },
          opacity: 0,
          y: 34,
          duration: 0.8,
          ease: "power3.out",
        });
      });

      gsap.to(".story-line-fill", {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: ".story-track",
          start: "top 70%",
          end: "bottom 68%",
          scrub: true,
        },
      });

      gsap.to(".hero-orbit", {
        y: -14,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.from(".hero-note-card", {
        rotation: -10,
        x: -24,
        duration: 1.1,
        ease: "back.out(1.4)",
        delay: 0.35,
      });

      gsap.from(".hero-focus-card", {
        rotation: 7,
        x: 24,
        y: 28,
        duration: 1,
        ease: "back.out(1.35)",
        delay: 0.55,
      });

      gsap.to(".hero-note-card", {
        yPercent: -5,
        rotation: -3,
        ease: "none",
        scrollTrigger: {
          trigger: ".landing-hero-visual",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(".hero-focus-card", {
        yPercent: 7,
        ease: "none",
        scrollTrigger: {
          trigger: ".landing-hero-visual",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    },
    { scope: pageRef },
  );

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (!isSandboxComplete) return;
    const timeout = window.setTimeout(() => setIsSandboxComplete(false), 6000);
    return () => window.clearTimeout(timeout);
  }, [isSandboxComplete]);

  const handleRunSandbox = () => {
    if (!sandboxInput.trim() || isSandboxProcessing) return;
    setIsSandboxProcessing(true);
    window.setTimeout(() => {
      setIsSandboxProcessing(false);
      setIsSandboxComplete(true);
      onRunDemoOrganize(sandboxInput.trim());
    }, 1300);
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-clip bg-[#f5f6f2] dark:bg-zinc-950 text-[#15211c] dark:text-zinc-100 transition-colors duration-200"
    >
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src="/logo.jpg"
                alt="Daydraft logo"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-semibold text-[18px] tracking-tight text-zinc-900 dark:text-zinc-100">
              Daydraft
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7 label-small text-zinc-500 dark:text-zinc-400">
            <a
              href="#demo"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Interactive Sandbox
            </a>
            <a
              href="#features"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Pillars
            </a>
            <a
              href="#comparison"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Why Daydraft
            </a>
            <a
              href="#contact"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {isLoggedIn ? (
              <div
                onClick={onLaunchApp}
                className="cursor-pointer relative w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium text-xs overflow-hidden shrink-0 hover:ring-2 ring-emerald-500/50 transition-all"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name || "User"} className="w-full h-full object-cover" />
                ) : isHydrated ? (
                  (user?.name?.charAt(0) || user?.role?.charAt(0) || "U").toUpperCase()
                ) : (
                  ""
                )}
              </div>
            ) : (
              <button
                onClick={onLaunchApp}
                className="flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-medium shadow-xs transition-all active:scale-[0.98]"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 pb-24 pt-20 sm:pt-28">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[min(100%,1100px)] -translate-x-1/2 bg-[radial-gradient(circle_at_50%_12%,rgba(16,185,129,0.14),transparent_54%)]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-end gap-14 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="max-w-xl">
                <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#15211c] dark:text-zinc-100 sm:text-7xl">
                  <span className="landing-title-line block">
                    Your thoughts are
                  </span>
                  <span className="landing-title-line block text-emerald-700 dark:text-emerald-400">
                    not a to-do list.
                  </span>
                  <span className="landing-title-line mt-3 block text-[#718078] dark:text-zinc-400">
                    Let them arrive messy.
                  </span>
                </h1>
                <p className="landing-copy mt-7 max-w-md text-[16px] leading-7 text-[#607069] dark:text-zinc-400">
                  Daydraft takes the unedited stream in your head and gives it
                  a place to go: one clear priority, an ordered list, and a day
                  that can actually breathe.
                </p>
                <div className="landing-actions mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={onLaunchApp}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-sm"
                  >
                    Begin with a brain dump
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#story"
                    className="px-2 py-2 text-sm font-semibold text-[#607069] dark:text-zinc-400 hover:text-[#15211c] dark:hover:text-zinc-100 transition-colors"
                  >
                    See how it works
                  </a>
                </div>
              </div>

              <div className="landing-hero-visual relative min-h-[410px] sm:min-h-[470px]">
                <div className="hero-orbit absolute right-[5%] top-[3%] h-24 w-24 rounded-full border border-emerald-600/20" />
                <div className="absolute right-[11%] top-[9%] h-3 w-3 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                <div className="hero-note-card absolute left-[4%] top-[16%] h-[330px] w-[86%] rotate-[-5deg] rounded-[28px] border border-[#d8dfd8] dark:border-zinc-800 bg-[#e8eee7] dark:bg-zinc-900/90 p-5 shadow-[0_30px_70px_rgba(21,33,28,0.1)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.5)] sm:p-7">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[#89968d] dark:text-zinc-400">
                    <span>Unedited thoughts</span>
                    <span>09:14</span>
                  </div>
                  <p className="mt-9 max-w-[380px] text-2xl font-medium leading-tight tracking-[-0.035em] text-[#45554d] dark:text-zinc-200 sm:text-3xl">
                    Finish the assignment, call Mum, remember groceries, maybe
                    work out, and figure out what to do about Friday.
                  </p>
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 text-xs font-medium text-[#7d8c83] dark:text-zinc-400 sm:left-7">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Everything can start here
                  </div>
                </div>
                <div className="hero-focus-card absolute bottom-0 right-0 w-[76%] rounded-[26px] border border-[#d7dfd8] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-[0_28px_70px_rgba(21,33,28,0.14)] dark:shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between border-b border-[#e8ece8] dark:border-zinc-800 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
                        Focus first
                      </p>
                      <p className="mt-1 text-base font-semibold text-[#15211c] dark:text-zinc-100">
                        Finish the React assignment
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f4ec] dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      <ListChecks className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {demoTasks.map((task) => (
                      <div
                        key={task.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${task.tone === "dark" ? "bg-emerald-700 dark:bg-emerald-400" : "bg-[#c5d2c8] dark:bg-zinc-700"}`}
                          />
                          <span className="truncate text-xs font-medium text-[#526158] dark:text-zinc-300">
                            {task.label}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-[#9aa69e] dark:text-zinc-500">
                          {task.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="story"
          className="border-y border-[#dfe6df] dark:border-zinc-800 bg-[#eef3ed] dark:bg-zinc-900/40 px-6 py-24 sm:py-32 transition-colors"
        >
          <div className="mx-auto max-w-6xl">
            <div className="story-reveal max-w-xl">
              <p className="label-small uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                The Daydraft method
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#15211c] dark:text-zinc-100 sm:text-5xl">
                From mental weather to a navigable day.
              </h2>
            </div>
            <div className="story-track relative mt-20 grid gap-14 lg:grid-cols-[120px_1fr]">
              <div className="relative hidden lg:block">
                <div className="absolute left-[17px] top-3 h-[calc(100%-24px)] w-px bg-[#cbd8ce] dark:bg-zinc-800" />
                <div className="story-line-fill absolute left-[16px] top-3 h-0 w-[3px] rounded-full bg-emerald-600" />
                <div className="sticky top-32 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="space-y-28">
                <div className="story-reveal grid items-center gap-8 md:grid-cols-[0.7fr_1.3fr]">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      01 / Capture
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15211c] dark:text-zinc-100">
                      Start without sorting yourself first.
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                      Write naturally. No prompt engineering, no perfect
                      categories, no pressure to know where a thought belongs.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-[#fbfcfa] dark:bg-zinc-900 p-6 shadow-[0_18px_45px_rgba(21,33,28,0.06)] dark:shadow-none sm:p-8">
                    <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#718078] dark:text-zinc-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Brain dump
                    </div>
                    <p className="max-w-lg text-xl leading-8 tracking-[-0.02em] text-[#45554d] dark:text-zinc-200">
                      I need to send the proposal, prepare for the client call,
                      pick up a prescription, and stop forgetting to make time
                      for dinner.
                    </p>
                    <div className="mt-7 h-1.5 w-24 rounded-full bg-emerald-600" />
                  </div>
                </div>
                <div className="story-reveal grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
                  <div className="order-2 rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-[#15211c] dark:bg-zinc-950 p-6 text-white shadow-[0_18px_45px_rgba(21,33,28,0.12)] sm:p-8 md:order-1">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">
                        Single focus
                      </span>
                      <span className="text-xs text-white/45">25:00</span>
                    </div>
                    <h3 className="mt-8 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em]">
                      Send the proposal before the client call.
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                      It unlocks the next conversation and removes the largest
                      open loop from today.
                    </p>
                    <div className="mt-10 flex items-center gap-3 text-xs font-semibold text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Ready when you are
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      02 / Focus
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15211c] dark:text-zinc-100">
                      One next move, with a reason.
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                      Daydraft lowers the volume by choosing the task with the
                      most leverage right now.
                    </p>
                  </div>
                </div>
                <div className="story-reveal grid items-center gap-8 md:grid-cols-[0.7fr_1.3fr]">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      03 / Navigate
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15211c] dark:text-zinc-100">
                      A plan that leaves room for being human.
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                      See the shape of your day without turning it into another
                      system to maintain.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-[#fbfcfa] dark:bg-zinc-900 p-6 shadow-[0_18px_45px_rgba(21,33,28,0.06)] dark:shadow-none sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#15211c] dark:text-zinc-100">
                        Today, in order
                      </span>
                      <Clock3 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-4">
                      {demoSchedule.map((item) => (
                        <div
                          key={item.time}
                          className="flex items-center gap-4 border-b border-[#e8ece8] dark:border-zinc-800 pb-4 last:border-0 last:pb-0"
                        >
                          <span className="w-12 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {item.time}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#26362e] dark:text-zinc-200">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-[#89968d] dark:text-zinc-400">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="story-reveal grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
                  <div className="order-2 rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-[#15211c] dark:bg-zinc-950 p-6 text-white shadow-[0_18px_45px_rgba(21,33,28,0.12)] sm:p-8 md:order-1">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300">
                          Saved note
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          Questions worth returning to
                        </p>
                      </div>
                      <ListChecks className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="mt-6 text-sm leading-6 text-white">
                      What is the best way to structure the reading response?
                    </p>
                    <p className="mt-3 border-l-2 border-emerald-300 pl-3 text-xs leading-5 text-white/60">
                      Kept from your brain dump so the question stays visible
                      after the day is organized.
                    </p>
                  </div>
                  <div className="order-1 md:order-2">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      04 / Keep
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15211c] dark:text-zinc-100">
                      Do not lose the thought behind the task.
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                      Questions, calculations, and facts become notes you can
                      revisit when the immediate work is no longer in front of
                      you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="px-6 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="story-reveal">
              <p className="label-small uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Try the ritual
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#15211c] dark:text-zinc-100 sm:text-5xl">
                Give the noise somewhere useful to go.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                Use a real thought, or start with one of the prompts. The
                preview shows the shape of the result before you enter the full
                workspace.
              </p>
            </div>
            <div className="story-reveal rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-[#fbfcfa] dark:bg-zinc-900 p-5 shadow-[0_22px_60px_rgba(21,33,28,0.08)] dark:shadow-none sm:p-7">
              <div className="flex items-center justify-between border-b border-[#e7ece7] dark:border-zinc-800 pb-5">
                <div>
                  <p className="text-sm font-semibold text-[#15211c] dark:text-zinc-100">
                    A quiet starting point
                  </p>
                  <p className="mt-1 text-xs text-[#89968d] dark:text-zinc-400">
                    No rules for the first sentence.
                  </p>
                </div>
                <ListChecks className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <textarea
                value={sandboxInput}
                onChange={(event) => setSandboxInput(event.target.value)}
                rows={4}
                placeholder="What is taking up space today?"
                className="mt-5 w-full resize-none rounded-2xl border border-[#dfe7df] dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4 text-sm leading-6 text-[#26362e] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition focus:border-emerald-600 dark:focus:border-emerald-500"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESET_BRAIN_DUMPS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSandboxInput(preset.text)}
                    className="rounded-full border border-[#dfe7df] dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-[#66766d] dark:text-zinc-400 transition hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#e7ece7] dark:border-zinc-800 pt-5 sm:flex-row sm:items-center">
                <span className="text-xs text-[#89968d] dark:text-zinc-400">
                  {isSandboxComplete
                    ? "Your starting point is ready."
                    : "A clear day begins with an honest sentence."}
                </span>
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={!sandboxInput.trim() || isSandboxProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSandboxProcessing
                    ? "Finding the shape..."
                    : "Organize this thought"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="bg-[#15211c] px-6 py-24 text-white sm:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="story-reveal max-w-2xl">
              <p className="label-small uppercase tracking-[0.18em] text-emerald-300">
                Designed for less noise
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                More intention in the system. Less system in your life.
              </h2>
            </div>
            <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
              <div className="story-reveal bg-[#15211c] p-7 sm:p-9">
                <span className="text-sm font-semibold text-emerald-300">
                  01
                </span>
                <h3 className="mt-14 text-xl font-semibold">
                  No performance required
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  The input can be incomplete, repetitive, or out of order. That
                  is exactly what it is for.
                </p>
              </div>
              <div className="story-reveal bg-[#15211c] p-7 sm:p-9">
                <span className="text-sm font-semibold text-emerald-300">
                  02
                </span>
                <h3 className="mt-14 text-xl font-semibold">
                  A reason to begin
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Your first task is not just highlighted. It is given context,
                  so starting feels possible.
                </p>
              </div>
              <div className="story-reveal bg-[#15211c] p-7 sm:p-9">
                <span className="text-sm font-semibold text-emerald-300">
                  03
                </span>
                <h3 className="mt-14 text-xl font-semibold">
                  A plan with air in it
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Time blocks give your day a shape without pretending every
                  minute will behave.
                </p>
              </div>
              <div className="story-reveal bg-[#15211c] p-7 sm:p-9">
                <span className="text-sm font-semibold text-emerald-300">
                  04
                </span>
                <h3 className="mt-14 text-xl font-semibold">
                  Keep the questions that matter
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Questions, calculations, and facts pulled from a brain dump
                  become notes you can revisit instead of loose ends you have to
                  remember.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="border-b border-[#dfe6df] dark:border-zinc-800 bg-[#f5f6f2] dark:bg-zinc-950 px-6 py-24 sm:py-32 transition-colors"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="story-reveal max-w-md">
              <p className="label-small uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Contact Daydraft
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#15211c] dark:text-zinc-100 sm:text-5xl">
                Have a thought about the workspace?
              </h2>
              <p className="mt-5 text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                Share feedback, ask a question, or tell us what would make your
                day easier to organize.
              </p>
            </div>

            <form
              className="story-reveal rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-[0_22px_60px_rgba(21,33,28,0.07)] dark:shadow-none sm:p-8"
              onSubmit={(event) => {
                event.preventDefault();
                setIsContactSent(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[#26362e] dark:text-zinc-200">
                  Name
                  <input
                    required
                    name="name"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-[#dfe7df] dark:border-zinc-700 bg-[#fbfcfa] dark:bg-zinc-950 px-4 py-3 text-sm font-normal text-[#26362e] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition focus:border-emerald-600 dark:focus:border-emerald-500"
                    placeholder="Your name"
                  />
                </label>
                <label className="text-sm font-semibold text-[#26362e] dark:text-zinc-200">
                  Email
                  <input
                    required
                    name="email"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-[#dfe7df] dark:border-zinc-700 bg-[#fbfcfa] dark:bg-zinc-950 px-4 py-3 text-sm font-normal text-[#26362e] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition focus:border-emerald-600 dark:focus:border-emerald-500"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label className="mt-5 block text-sm font-semibold text-[#26362e] dark:text-zinc-200">
                Message
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-[#dfe7df] dark:border-zinc-700 bg-[#fbfcfa] dark:bg-zinc-950 px-4 py-3 text-sm font-normal leading-6 text-[#26362e] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition focus:border-emerald-600 dark:focus:border-emerald-500"
                  placeholder="What is on your mind?"
                />
              </label>
              <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#e7ece7] dark:border-zinc-800 pt-5 sm:flex-row sm:items-center">
                <span className="text-xs text-[#89968d] dark:text-zinc-400">
                  {isContactSent
                    ? "Nothing was sent. This form is not connected yet."
                    : "This form is not connected yet."}
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  Send message
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </section>

        <section id="comparison" className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="story-reveal">
              <p className="label-small uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                A different kind of productivity tool
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#15211c] dark:text-zinc-100 sm:text-5xl">
                Built for the moment before action.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#66766d] dark:text-zinc-400">
                Daydraft does not ask you to become a better project manager.
                It helps you make contact with the next meaningful thing.
              </p>
            </div>
            <div className="story-reveal mt-12 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-[24px] border border-[#dfe7df] dark:border-zinc-800 bg-[#eef3ed] dark:bg-zinc-900 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#89968d] dark:text-zinc-400">
                  The usual loop
                </p>
                <p className="mt-6 text-lg font-semibold leading-7 text-[#718078] dark:text-zinc-300">
                  More tabs, more sorting, more time spent preparing to begin.
                </p>
              </div>
              <div className="rounded-[24px] border border-emerald-700 bg-emerald-700 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  The Daydraft loop
                </p>
                <p className="mt-6 text-lg font-semibold leading-7 text-white">
                  Say what is on your mind. See what matters. Start there.
                </p>
              </div>
            </div>
            <button
              onClick={onLaunchApp}
              className="story-reveal mt-12 inline-flex items-center gap-2 rounded-xl bg-[#15211c] dark:bg-emerald-600 hover:bg-[#26362e] dark:hover:bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-sm"
            >
              Open your workspace <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dfe7df] dark:border-zinc-800 bg-[#eef3ed] dark:bg-zinc-950 px-6 py-8 text-center text-xs text-[#89968d] dark:text-zinc-500 transition-colors">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Daydraft logo"
              width={24}
              height={24}
              className="h-6 w-6 rounded-lg object-cover"
            />
            <span className="font-semibold text-[#15211c] dark:text-zinc-200">Daydraft</span>
          </div>
          <nav className="flex items-center gap-4" aria-label="Legal links">
            <a
              href="/terms"
              className="text-zinc-600 dark:text-zinc-400 transition-colors hover:text-[#15211c] dark:hover:text-zinc-100"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="text-zinc-600 dark:text-zinc-400 transition-colors hover:text-[#15211c] dark:hover:text-zinc-100"
            >
              Privacy
            </a>
            <a
              href="/legal"
              className="text-zinc-600 dark:text-zinc-400 transition-colors hover:text-[#15211c] dark:hover:text-zinc-100"
            >
              Legal
            </a>
          </nav>
          <span>(c) 2026 Praashon</span>
        </div>
      </footer>
    </div>
  );
}

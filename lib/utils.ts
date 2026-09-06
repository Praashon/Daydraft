import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrentDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getGreeting(name: string = ""): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  let greeting = "Good afternoon";
  
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const trimmed = name?.trim();

  return {
    greeting: trimmed ? `${greeting}, ${trimmed}` : greeting,
    subtext: "Let's bring clarity to your day.",
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daydraft - Clarity from Mental Chaos",
  description:
    "An AI-powered daily life organization app that quietly transforms messy thoughts into structured tasks, priorities, schedules, and actionable plans.",
  icons: {
    icon: "/logo.jpg",
  },
};

import { AppProvider } from "@/components/app-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { NepalReliefBanner } from "@/components/nepal-relief-banner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} font-sans antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var p = window.location.pathname;
    var isDash = p.startsWith('/dashboard') || p.startsWith('/tasks') || p.startsWith('/calendar') || p.startsWith('/notes') || p.startsWith('/trash') || p.startsWith('/profile');
    var theme = 'light';
    if (isDash) {
      theme = localStorage.getItem('daydraft_dashboard_theme') || 'light';
    } else {
      theme = localStorage.getItem('daydraft_landing_theme') || 'light';
    }
    var root = document.documentElement;
    root.classList.remove('light', 'dark', 'red', 'catppuccin', 'onedark');
    if (theme && theme !== 'light') {
      root.classList.add(theme);
    } else {
      root.classList.add('light');
    }
    var isDark = ['dark', 'catppuccin', 'onedark'].indexOf(theme) !== -1;
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-emerald-500/10 selection:text-emerald-500 transition-colors duration-300"
      >
        <ThemeProvider>
          <NepalReliefBanner />
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

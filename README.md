# Daydraft - AI-Powered Daily Life Organization

Daydraft is a modern, distraction-free productivity web application engineered to quietly turn messy mental thoughts ("brain dumps") into actionable tasks, single-focus priorities, chronological schedules, extracted knowledge notes, and strategic insights.

---

## Key Features

### 1. Centerpiece Brain Dump
- Unload chaotic, unstructured thoughts naturally (e.g. *"Finish React assignment by Friday, call Alex at 7pm, buy groceries, and calculate distance between NYC and London"*).
- Instant one-click preset templates (*Work & Study Mix*, *Busy Monday Sprint*, *Weekend Personal Reset*).
- Keyboard shortcut `Command + Enter` / `Ctrl + Enter` to organize instantly.

### 2. Dual AI Engine & Smart Local Fallback
- **Flexible AI Providers**: Seamlessly toggle between **Google Gemini** (Gemini 2.5 Flash) and **OpenRouter** (including free tiers and leading open models).
- **Custom API Key Support**: Configure and test your own API keys directly within user settings.
- **Offline NLP Heuristic Engine**: Zero-downtime offline fallback parsing tasks, priorities, categories, and deadlines locally when no API keys are set or network calls fail.

### 3. Focus First Hero Card & Deep Focus Timer
- Eliminates decision fatigue by surfacing the single highest-leverage task for today.
- Provides concise, contextual rationale explaining why it matters most right now.
- Integrated **25-minute Pomodoro/Deep Focus Timer** with start, pause, reset, and quick-completion controls.
- **Interactive AI Coach**: Launch an inline AI coaching chat for any task to break down complex goals, brainstorm strategies, or request tutoring.

### 4. Structured Today's Tasks
- Interactive checkboxes with spring animations.
- Subtle priority pills (*High*, *Medium*, *Low*) avoiding noisy visual clutter.
- Deadline badges, category tagging (*Academics*, *Work*, *Health*, *Errands*, *Finance*, *Personal*), and date sorting.
- Multi-select batch actions (batch delete, complete) and quick inline task addition.
- Tabbed status filtering: *All*, *Pending*, *Completed*.

### 5. Today's Plan & Interactive Calendar
- **Chronological Timeline**: Vertical time-blocked schedule (e.g. `09:00`, `14:00`, `19:00`) with deep work and errand categorization.
- **Full Calendar View**: Day and week schedule views with hour intervals and interactive time-blocking.

### 6. Notes & Knowledge Extraction
- Automatically extracts calculations, facts, questions, and musings from brain dumps into dedicated rich notes.
- Dedicated `/notes` dashboard view with full-detail inspection at `/notes/[id]`.
- Batch selection and deletion workflows.

### 7. Soft Delete & Trash Management
- Safe item deletion: delete tasks, calendar blocks, or notes to the Trash.
- Full restoration or permanent deletion.
- Configurable auto-expiration policies (*1 week*, *30 days*, *6 months*, *1 year*, *No expiration*).

### 8. Customization & Theming System
- Built-in theme presets: **Light**, **Dark**, **Red**, **Catppuccin**, and **One Dark**.
- Live custom CSS editor to write and apply personalized styling overrides on the fly.
- Configurable sidebar behavior (*Always show*, *Collapsed*, *Expand on hover*).

### 9. Minimalist Progress Stats
- Instant progress dashboard: *Total*, *Completed*, and *Remaining* counts.
- Subtle progress bar with confetti celebrations upon completing all high-priority tasks.

### 10. Product Landing Showcase & User Accounts
- GreenSock (`gsap` & `ScrollTrigger`) animated landing page with an interactive live sandbox.
- Complete Supabase authentication: email/password, signup verification, password recovery, avatar image uploads, and profile customization.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & `next-themes`
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP (GreenSock)](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI Integrations**:
  - `@google/genai` (Google Gemini 2.5 Flash)
  - OpenRouter API (dynamic model selection)
  - Local heuristic rule-based NLP fallback
- **State & Storage**: Local storage synchronization combined with Supabase database & storage buckets

---

## Getting Started

### Prerequisites
- Node.js 20+ installed
- A Supabase project (optional for guest mode, required for user accounts)
- A Gemini API Key or OpenRouter API Key (optional; local heuristic fallback operates without keys)

### Installation

```bash
# Clone repository and install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Configure Environment Variables

Edit your `.env` file:

```env
# Optional AI API keys (can also be provided by users in Settings)
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key

# Supabase Authentication & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database & Auth Setup (Supabase)

1. Navigate to your Supabase project's SQL Editor.
2. Run the SQL script located in [`supabase/schema.sql`](supabase/schema.sql). This sets up:
   - The `public.profiles` table with row-level security (RLS).
   - Case-insensitive unique username constraints.
   - Automatic user profile creation trigger (`handle_new_user`).
   - Public `avatars` storage bucket with upload & update security policies.
3. In **Supabase Authentication Settings**, enable email confirmation and configure redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
4. Configure matching recovery URLs for password reset emails.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch Daydraft.

### Production Build

```bash
npm run build
npm run start
```

---

## Application Structure

```text
├── app/
│   ├── (dashboard)/             # Protected dashboard views
│   │   ├── dashboard/           # Main brain dump & execution cockpit
│   │   ├── tasks/               # Priority matrix & task management
│   │   ├── calendar/            # Time-blocked schedule view
│   │   ├── notes/               # Extracted notes & calculation repository
│   │   ├── profile/             # Profile, avatar, password, & MFA settings
│   │   └── trash/               # Soft-deleted items & retention settings
│   ├── api/
│   │   ├── organize/            # AI brain dump processing endpoint
│   │   ├── coach/               # Real-time task coaching & tutoring endpoint
│   │   ├── models/              # OpenRouter models list & metadata
│   │   └── test-key/            # API key validation endpoint
│   ├── auth/                    # Supabase authentication callback handlers
│   ├── login/ / signup/         # Account authentication pages
│   └── page.tsx                 # GSAP-animated marketing landing & sandbox
├── components/                  # UI components, modals, and providers
├── lib/
│   ├── ai.ts                    # Gemini, OpenRouter, and local NLP fallback logic
│   └── supabase/                # Supabase SSR and browser clients
├── supabase/
│   └── schema.sql               # Database DDL, RLS, and storage rules
└── types/                       # Core TypeScript type definitions
```

---

## License

This project is private and proprietary.

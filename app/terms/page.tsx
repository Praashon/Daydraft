import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f2] dark:bg-zinc-950 px-6 py-16 text-[#15211c] dark:text-zinc-100 sm:py-24 transition-colors">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-[0_22px_60px_rgba(21,33,28,0.07)] dark:shadow-none sm:p-12 transition-colors">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            &larr; Back to Daydraft
          </Link>
          <ThemeToggle />
        </div>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          Terms of Service
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#15211c] dark:text-zinc-100">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-[#66766d] dark:text-zinc-400">
          Last updated: September 5, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#45554d] dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing, creating an account on, or using Daydraft (&quot;the Service&quot;),
              operated by Praashon in Kathmandu, Nepal (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree
              to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              2. Account Registration &amp; Eligibility
            </h2>
            <p className="mt-2">
              To use Daydraft&apos;s authenticated features, you must register for an account. By
              registering, you represent and warrant that:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>You are at least 13 years old (or the applicable age of digital consent in your jurisdiction).</li>
              <li>You provide an accurate, genuine email address and choose a unique username. Temporary or disposable email addresses are prohibited and rejected by our registration system.</li>
              <li>You verify your email address through our verification link or 6-digit one-time confirmation code (OTP) before initial sign-in.</li>
              <li>You choose a secure password meeting our complexity guidelines (including minimum length and diversity of characters). Passwords known to have appeared in third-party data breaches are checked via privacy-preserving k-anonymity verification and rejected for your protection.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              3. Account Security &amp; Multi-Factor Authentication (MFA)
            </h2>
            <p className="mt-2">
              You are responsible for maintaining the confidentiality of your account credentials,
              including passwords and any enrolled Multi-Factor Authentication (MFA) factors, such as
              Time-based One-Time Passwords (TOTP authenticator applications) or WebAuthn/Passkey credentials.
            </p>
            <p className="mt-2">
              You must notify us immediately at{" "}
              <a
                className="text-emerald-700 dark:text-emerald-400 underline"
                href="mailto:praashon.dev@gmail.com"
              >
                praashon.dev@gmail.com
              </a>{" "}
              if you suspect unauthorized access to your account. We are not liable for any loss or
              damage arising from your failure to safeguard your login information or enrolled devices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              4. User Content &amp; Cloud Data Ownership
            </h2>
            <p className="mt-2">
              You retain all ownership rights in any information, thoughts, brain dumps, tasks,
              notes, schedules, preferences, or profile imagery you input into Daydraft (&quot;User Content&quot;).
            </p>
            <p className="mt-2">
              Daydraft does not claim ownership over your User Content. Personal workspace items
              (including tasks, focus goals, daily schedule plan items, notes, trash history, user preferences,
              and profile identity) are persisted securely in our Supabase cloud database infrastructure,
              isolated per-user through PostgreSQL Row Level Security (RLS) policies (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">auth.uid() = user_id</code>).
              Workspace items are also cached locally in your browser for offline availability and performance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              5. Bring Your Own Key (BYOK), Vault Security &amp; Third-Party AI Services
            </h2>
            <p className="mt-2">
              Daydraft provides intelligent daily planning and organization tools powered by
              third-party Artificial Intelligence providers (Google Gemini and OpenRouter) alongside
              an offline NLP fallback parser.
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>API Key Vault &amp; Encryption:</strong> Personal Google Gemini or OpenRouter API keys
                you configure are stored in our Supabase database (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">public.user_api_keys</code>)
                using server-side AES-256-GCM envelope encryption. Decryption occurs strictly in-memory during active AI inference calls; plaintext keys are never returned to client applications or logged.
              </li>
              <li>
                <strong>Third-Party Terms:</strong> When using third-party AI features, data transmitted
                to Google or OpenRouter is governed by their respective terms of service and privacy
                policies. You are responsible for ensuring compliance with any API usage requirements and
                incurred billing on your personal provider accounts.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              6. AI Output &amp; No Professional Advice Disclaimer
            </h2>
            <p className="mt-2">
              Daydraft is designed solely as an executive productivity and daily planning aid.
              Artificial intelligence outputs may occasionally contain inaccuracies, hallucinations,
              or unsuitable recommendations.
            </p>
            <p className="mt-2">
              Daydraft does <strong>not</strong> provide medical, legal, mental health, financial,
              or professional advice. You must independently evaluate, review, and verify all
              AI-generated suggestions and task breakdowns before relying on them or taking action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              7. Acceptable Use Policy
            </h2>
            <p className="mt-2">When accessing or using Daydraft, you agree not to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Attempt to bypass, disable, or interfere with authentication, rate limits, or security controls.</li>
              <li>Register automated accounts or use automated scripts to access the Service without authorization.</li>
              <li>Use disposable, temporary, or deceptive email addresses to create multiple accounts or circumvent restrictions.</li>
              <li>Upload malicious code, viruses, or harmful payloads through profile avatars or input fields.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service infrastructure.</li>
              <li>Use the Service for any unlawful, harassing, infringing, or fraudulent purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              8. Account Suspension &amp; Termination
            </h2>
            <p className="mt-2">
              We reserve the right to suspend, restrict, or terminate your account and access to the
              Service at our sole discretion, without prior notice or liability, for conduct that violates
              these Terms, infringes upon intellectual property, threatens platform security, or abuses
              our infrastructure.
            </p>
            <p className="mt-2">
              You may stop using the Service at any time. You may also reset or clear your local
              workspace data via the app settings or by clearing your browser storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              9. Disclaimer of Warranties
            </h2>
            <p className="mt-2">
              DAYDRAFT IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED
              OPERATION. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR ACCURATE AT ALL TIMES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              10. Limitation of Liability
            </h2>
            <p className="mt-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PRAASHON AND DAYDRAFT SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF DATA, LOSS OF PROFITS, WORK INTERRUPTION, OR SYSTEM FAILURE ARISING OUT
              OF OR RELATING TO YOUR USE OR INABILITY TO USE THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              11. Governing Law &amp; Dispute Resolution
            </h2>
            <p className="mt-2">
              These Terms shall be governed by and construed in accordance with the laws of Nepal,
              without regard to conflict of law principles. Any dispute arising from these Terms or your
              use of Daydraft shall be submitted to the competent courts of Kathmandu, Nepal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              12. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these Terms from time to time to reflect modifications to our features,
              legal requirements, or operational changes. Your continued use of the Service after the
              effective date of any changes constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              13. Contact Information
            </h2>
            <p className="mt-2">
              If you have any questions or concerns regarding these Terms of Service, please contact:
            </p>
            <p className="mt-2 font-medium text-[#15211c] dark:text-zinc-200">
              Praashon<br />
              Kathmandu, Nepal<br />
              Email:{" "}
              <a
                className="text-emerald-700 dark:text-emerald-400 underline"
                href="mailto:praashon.dev@gmail.com"
              >
                praashon.dev@gmail.com
              </a>
            </p>
          </section>

          <div className="mt-12 flex flex-wrap gap-4 border-t border-[#dfe7df] dark:border-zinc-800 pt-6 text-xs text-[#89968d] dark:text-zinc-500">
            <span>Related Documents:</span>
            <Link
              href="/privacy"
              className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
            >
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link
              href="/legal"
              className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
            >
              Legal Information
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

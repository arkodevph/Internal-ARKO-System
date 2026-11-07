"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// Avatar renders client-side only (Effigy isn't SSR-safe); splash mounts post-login anyway.
const OpenPeepsAvatar = dynamic(
  () =>
    import("../../../components/open-peeps-avatar").then((m) => ({
      default: m.OpenPeepsAvatar,
    })),
  { ssr: false },
);

/* ─── Post-login splash: avatar + rotating fact + load bar ─── */

const LOADING_FACTS = [
  "Honey never spoils - archaeologists found 3,000-year-old honey still edible.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than its year.",
  "The first computer bug was a real moth, found in 1947.",
  "Bananas are berries, but strawberries are not.",
  "Sharks existed before trees did.",
  "There are more possible chess games than atoms in the observable universe.",
  "Wombats produce cube-shaped poop.",
  "The Eiffel Tower can grow taller by up to 15 cm in summer heat.",
  "A group of flamingos is called a “flamboyance.”",
];

function RedirectSplash({ email, name }: { email: string; name?: string }) {
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_FACTS.length),
  );
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const facts = setInterval(
      () => setFactIndex((i) => (i + 1) % LOADING_FACTS.length),
      2800,
    );
    // Ease toward ~92% so it feels like real loading without ever "finishing" early.
    const bar = setInterval(
      () =>
        setProgress((p) => (p < 92 ? p + Math.max(0.6, (92 - p) * 0.05) : p)),
      110,
    );
    return () => {
      clearInterval(facts);
      clearInterval(bar);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-acid text-ink"
      role="status"
      aria-live="polite"
      aria-label="Loading your dashboard"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,.18) 1px, transparent 1px)",
          backgroundSize: "clamp(3rem, 7vw, 7rem) clamp(3rem, 7vw, 7rem)",
        }}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-ink/25 px-5 py-4 sm:px-8 md:px-10">
        <span className="display text-2xl md:text-3xl">ARKO</span>
        <span className="eyebrow text-[0.55rem] text-ink/55 sm:text-xs">
          Secure workspace / System entry
        </span>
      </div>

      <div
        aria-hidden="true"
        className="display pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(8rem,31vw,32rem)] leading-none text-ink/[0.055]"
      >
        ARKO
      </div>

      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-5 py-28 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-between border-b-2 border-ink pb-3">
            <span className="eyebrow text-[0.6rem] text-ink/60 sm:text-xs">
              01 / Identity confirmed
            </span>
            <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
          </div>

          <div className="grid items-center gap-7 sm:grid-cols-[7rem_1fr] sm:gap-9">
            <div className="relative mx-auto h-28 w-28 sm:mx-0">
              <span className="absolute inset-0 translate-x-2 translate-y-2 bg-ink/20" />
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-4 border-ink bg-acid">
                <OpenPeepsAvatar
                  userId={email || "guest"}
                  userName={name}
                  size={112}
                />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <p className="eyebrow mb-3 text-[0.6rem] text-ink/55 sm:text-xs">
                Workspace access granted
              </p>
              <h1 className="display text-[clamp(3rem,9vw,6.5rem)] leading-[0.82]">
                Welcome
                <br />
                back{name ? `, ${name.split(" ")[0]}` : ""}.
              </h1>
            </div>
          </div>

          <div className="mt-9">
            <div className="mono mb-2 flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.14em]">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                Loading dashboard
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-4 border-2 border-ink p-[2px]">
              <div
                className="h-full bg-ink transition-[width] duration-200 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-7 flex min-h-[3.5rem] items-start gap-3 border-t border-ink/25 pt-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p
              key={factIndex}
              className="mono animate-[fade-in_0.5s_ease-out] text-[0.65rem] font-bold uppercase leading-relaxed tracking-[0.08em] text-ink/65 motion-reduce:animate-none"
            >
              <span className="text-ink">Did you know? </span>
              {LOADING_FACTS[factIndex]}
            </p>
          </div>
        </div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-ink/25">
        {["Authenticate", "Load workspace", "Enter system"].map(
          (label, index) => (
            <div
              key={label}
              className="eyebrow border-r border-ink/15 px-4 py-3 text-[0.5rem] text-ink/55 last:border-r-0 sm:px-8 sm:text-[0.6rem]"
            >
              <span className="mr-2 text-ink">0{index + 1}</span>
              {label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ─── Fallback quotes ─── */

const fallbackQuotes = [
  {
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    content: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
  },
  { content: "Make it simple, but significant.", author: "Don Draper" },
  {
    content:
      "Design is not just what it looks like and feels like. Design is how it works.",
    author: "Steve Jobs",
  },
  {
    content:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  { content: "Done is better than perfect.", author: "Sheryl Sandberg" },
  {
    content: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  { content: "Quality is not an act, it is a habit.", author: "Aristotle" },
];

interface Quote {
  content: string;
  author: string;
}

const CACHE_KEY = "arko-session-quote";

function useQuote(): { quote: Quote | null; loading: boolean } {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setQuote(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        /* fall through */
      }
    }

    // Pick a local quote for the session (the previous remote source,
    // api.quotable.io, has been shut down and no longer resolves).
    const q = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(q));
    setQuote(q);
    setLoading(false);
  }, []);

  return { quote, loading };
}

/* ─── Quote panel ─── */

function QuotePanel({
  quote,
  loading,
}: {
  quote: Quote | null;
  loading: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const updatePointerDepth = (event: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      panel.style.setProperty("--pointer-x", `${(x * 18).toFixed(2)}px`);
      panel.style.setProperty("--pointer-y", `${(y * 18).toFixed(2)}px`);
      panel.style.setProperty("--pointer-x-soft", `${(x * 10).toFixed(2)}px`);
      panel.style.setProperty("--pointer-y-soft", `${(y * 10).toFixed(2)}px`);
      panel.style.setProperty("--pointer-tilt", `${(x * 3).toFixed(2)}deg`);
    });
  };

  const resetPointerDepth = () => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.setProperty("--pointer-x", "0px");
    panel.style.setProperty("--pointer-y", "0px");
    panel.style.setProperty("--pointer-x-soft", "0px");
    panel.style.setProperty("--pointer-y-soft", "0px");
    panel.style.setProperty("--pointer-tilt", "0deg");
  };

  return (
    <div
      ref={panelRef}
      onPointerMove={updatePointerDepth}
      onPointerLeave={resetPointerDepth}
      className="auth-art-panel relative hidden select-none flex-col overflow-hidden border-r-4 border-ink bg-acid text-ink lg:flex lg:w-[55%]"
    >
      <div aria-hidden className="auth-art-grid absolute inset-0" />
      <div aria-hidden className="auth-logo-3d" />
      <div aria-hidden className="auth-float-card auth-float-card-one">
        <b>01</b>
        <span>DESIGN</span>
        <i />
      </div>
      <div aria-hidden className="auth-float-card auth-float-card-two">
        <b>02</b>
        <span>DEVELOP</span>
        <i />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-12 pt-8 pb-12">
        <span className="auth-brand display flex w-fit items-center gap-3 text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
          <img src="/icon.png" alt="" className="h-[0.8em] w-auto" /> ARKO
        </span>
        <span className="mono mt-3 w-fit border-2 border-ink bg-ink px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-acid">
          Secure workspace / 2026
        </span>

        <div className="flex flex-col justify-center flex-1 min-h-0 max-w-xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-16 rounded bg-card/5" />
              <div className="space-y-3">
                <div className="h-7 bg-card/5 rounded w-full" />
                <div className="h-7 bg-card/5 rounded w-5/6" />
                <div className="h-7 bg-card/5 rounded w-4/6" />
              </div>
              <div className="h-4 bg-card/5 rounded w-1/3" />
            </div>
          ) : quote ? (
            <div style={{ animation: "fade-in 0.8s ease-out" }}>
              <div className="mb-6">
                <span
                  className="display block select-none leading-none text-ink/25"
                  style={{
                    fontSize: "clamp(100px, 12vw, 180px)",
                    lineHeight: 0.6,
                  }}
                >
                  &ldquo;
                </span>
              </div>
              <blockquote className="-mt-4">
                <p className="display max-w-lg text-[clamp(1.75rem,3vw,3.6rem)] leading-[0.95] text-ink">
                  {quote.content}
                </p>
              </blockquote>
              <cite className="mono mt-6 block border-l-4 border-ink pl-3 text-xs not-italic uppercase tracking-widest text-ink/60">
                &mdash; {quote.author}
              </cite>
              <div className="mt-auto pt-12">
                <span className="mono text-[9px] uppercase tracking-[0.25em] text-ink/50">
                  Quote of the day
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Login form ─── */

function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [touchError, setTouchError] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTouchError(false);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setTouchError(true);
        setTimeout(() => setTouchError(false), 500);
        setSubmitting(false);
        return;
      }

      sessionStorage.removeItem(CACHE_KEY);
      // Start this session with an empty cache so no prior user's data shows.
      queryClient.clear();
      router.prefetch("/dashboard");
      setRedirecting(true);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("signIn error:", err);
      setError(err?.message || "Sign in failed. Check console for details.");
      setTouchError(true);
      setTimeout(() => setTouchError(false), 500);
      setSubmitting(false);
    }
  };

  if (redirecting) {
    return <RedirectSplash email={email} />;
  }

  return (
    <div className="auth-form-panel relative flex flex-1 items-center justify-center overflow-hidden bg-ink px-5 py-20 sm:px-8">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth/arko-map-enhanced.webp')" }}
      />
      <Link
        href="/"
        className="auth-back-link mono absolute left-5 top-5 z-10 border border-white/20 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-white/60 transition-colors hover:border-acid hover:text-acid sm:left-8 sm:top-8"
      >
        ← Back to ARKO
      </Link>
      <div
        aria-hidden
        className="auth-form-cross absolute right-8 top-8 z-10 text-acid/20"
      >
        +
      </div>
      <div
        aria-hidden
        className="auth-form-cross absolute bottom-10 left-10 z-10 text-acid/20"
      >
        +
      </div>

      <div
        className="relative z-10 w-full max-w-sm"
        style={{ animation: "fade-in-up 0.6s ease-out" }}
      >
        <div className="mb-8 text-center lg:hidden">
          <span className="display inline-flex items-center justify-center gap-2 text-4xl text-acid">
            <img src="/icon.png" alt="" className="h-[1em] w-auto" />A R K O
          </span>
        </div>

        <div className="auth-login-card relative border-2 border-white/15 bg-ink-soft p-6 shadow-[12px_12px_0_#b8ff2e] sm:p-8">
          <div
            className="text-center mb-7"
            style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
          >
            <p className="mono mb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-acid">
              Member access / 01
            </p>
            <h1 className="display text-4xl text-white">Welcome back</h1>
            <p
              className="text-sm text-zinc-500 mt-1.5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign in to your dashboard
            </p>
          </div>

          {error && (
            <div
              className={`mb-5 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2.5 ${touchError ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            style={{ animation: "fade-in-up 0.5s ease-out 0.2s both" }}
          >
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="block w-full rounded-xl border border-white/[0.08] bg-card/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/15 focus:bg-card/[0.05] transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-white/[0.08] bg-card/[0.03] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/15 focus:bg-card/[0.05] transition-all duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRemember((s) => !s)}
                  className={`h-4 w-4 rounded border transition-all duration-150 flex items-center justify-center ${
                    remember
                      ? "bg-accent-600 border-accent-600"
                      : "border-zinc-700 group-hover:border-zinc-500"
                  }`}
                >
                  {remember && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors select-none cursor-pointer"
                  onClick={() => setRemember((s) => !s)}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Remember me
                </span>
              </label>
              <a
                href="mailto:contact@arkodevph.com?subject=Password%20reset%20request"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mono w-full border-2 border-acid bg-acid px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-all duration-200 hover:bg-transparent hover:text-acid active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in&hellip;
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <Link
              href="/intern/login"
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
            >
              Intern sign in
            </Link>
            <p className="text-center text-xs leading-relaxed text-zinc-400">
              Learning logs, exercises, and your assigned tasks.
            </p>
            <Link
              href="/#contact"
              className="mono mt-3 flex w-full items-center justify-center border border-white/25 bg-ink/70 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-acid hover:text-acid"
            >
              Request a demo
            </Link>
          </form>
        </div>

        <div
          className="mx-auto mt-5 flex w-fit items-center justify-center gap-1.5 bg-ink/85 px-3 py-1.5"
          style={{ animation: "fade-in-up 0.5s ease-out 0.5s both" }}
        >
          <ShieldCheck className="h-3 w-3 text-acid" />
          <span
            className="text-[10px] text-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Encrypted &amp; secure
          </span>
        </div>

        <p
          className="mx-auto mt-3 w-fit bg-ink/85 px-3 py-1.5 text-center text-sm text-white"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            animation: "fade-in-up 0.5s ease-out 0.3s both",
          }}
        >
          Account creation is managed by your administrator
        </p>

        <div className="mt-5 border-t border-white/20" />

        <div
          className="mx-auto mt-4 flex w-fit items-center justify-center gap-4 bg-ink/85 px-4 py-2"
          style={{ animation: "fade-in-up 0.5s ease-out 0.6s both" }}
        >
          <a
            href="/privacy#terms"
            className="text-[11px] text-white/80 transition-colors hover:text-acid"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Terms
          </a>
          <span className="select-none text-[6px] text-acid">&#x25C9;</span>
          <a
            href="/privacy"
            className="text-[11px] text-white/80 transition-colors hover:text-acid"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Privacy
          </a>
          <span className="select-none text-[6px] text-acid">&#x25C9;</span>
          <a
            href="/privacy#cookies"
            className="text-[11px] text-white/80 transition-colors hover:text-acid"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Cookies
          </a>
        </div>

        <p
          className="mx-auto mt-2 w-fit bg-ink/85 px-3 py-1 text-center text-[10px] text-white/70"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          &copy; 2026 Arko. All rights reserved. &middot; v2.0.0
        </p>
      </div>
    </div>
  );
}

/* ─── Export for the page ─── */

export default function LoginClient() {
  const { quote, loading } = useQuote();

  return (
    <>
      <QuotePanel quote={quote} loading={loading} />
      <LoginForm />
    </>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { DashboardThemeToggle } from "../../app/dashboard/_components/dashboard-theme-toggle";
import "./intern-login.css";

export function InternLogin() {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!result || result.error || !result.ok) {
        showError(
          "We couldn’t sign you in. Check your email and password, or ask your Arko admin for help.",
        );
        submittingRef.current = false;
        setPending(false);
        return;
      }
      router.replace("/intern");
      router.refresh();
    } catch {
      showError(
        "We couldn’t connect. Your details are still here — please try again.",
      );
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <main className="dashboard-theme-root intern-signin">
      <section
        className="intern-signin-access"
        aria-labelledby="intern-signin-title"
      >
        <header className="intern-signin-brand-row">
          <Link href="/" aria-label="Arko home" className="intern-signin-brand">
            {/* The existing Arko mark is shared with the main sign-in page. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={32} height={32} />
            <span>
              ARKO
              <span className="intern-signin-brand-label">Intern portal</span>
            </span>
          </Link>
          <DashboardThemeToggle />
        </header>

        <div className="intern-signin-form-wrap">
          <div className="intern-signin-heading">
            <h1 id="intern-signin-title">
              Welcome to your
              <br />
              intern workspace.
            </h1>
            <p>
              Pick up where you left off. Sign in with the account your Arko
              admin provided.
            </p>
          </div>
          <form
            onSubmit={submit}
            className="intern-signin-form"
            aria-busy={pending}
          >
            <div className="intern-signin-field">
              <label htmlFor="intern-email">Email address</label>
              <input
                id="intern-email"
                type="email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? "intern-signin-error" : undefined}
              />
            </div>
            <div className="intern-signin-field">
              <label htmlFor="intern-password">Password</label>
              <div className="intern-signin-password">
                <input
                  id="intern-password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={error ? "intern-signin-error" : undefined}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  aria-controls="intern-password"
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div
                id="intern-signin-error"
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="intern-signin-error"
              >
                {error}
              </div>
            )}
            <button
              className="intern-signin-submit"
              type="submit"
              disabled={pending}
            >
              {pending && (
                <Loader2
                  size={18}
                  className="intern-signin-spinner"
                  aria-hidden="true"
                />
              )}
              {pending ? "Signing in…" : "Sign in to your portal"}
            </button>
          </form>
          <p className="intern-signin-help">
            Need access or a password reset?
            <br />
            <a href="mailto:contact@arkodevph.com?subject=Intern%20portal%20access">
              Contact your Arko admin
            </a>
          </p>
        </div>

        <footer className="intern-signin-footer">
          <span>Here for the main workspace?</span>
          <Link href="/auth/login">Admin & member sign in</Link>
        </footer>
      </section>
      <aside
        className="intern-signin-story"
        aria-labelledby="intern-story-title"
      >
        <div className="intern-signin-story-top">
          <span>Your internship at Arko</span>
          <Link href="/auth/login">Main sign in</Link>
        </div>
        <div className="intern-signin-story-content">
          <span className="intern-signin-story-mark" aria-hidden="true">
            “
          </span>
          <h2 id="intern-story-title">
            Good work starts
            <br />
            with a little learning.
            <br />
            <span>Make today count.</span>
          </h2>
          <p>
            A place for your daily discoveries, hands-on practice, and the work
            you’re building toward.
          </p>
          <ul className="intern-signin-features">
            <li>
              <strong>Reflect on your day</strong>
              <span>Keep your learning log and track your hours.</span>
            </li>
            <li>
              <strong>Put it into practice</strong>
              <span>Work through your assigned studies and exercises.</span>
            </li>
            <li>
              <strong>Keep moving forward</strong>
              <span>Stay on top of tasks and learn from admin feedback.</span>
            </li>
          </ul>
        </div>
        <p className="intern-signin-story-footer">
          Learn with intention. Build with Arko.
        </p>
      </aside>
    </main>
  );
}

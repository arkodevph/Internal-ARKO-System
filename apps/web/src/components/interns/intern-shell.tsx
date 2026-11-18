"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { DashboardThemeToggle } from "../../app/dashboard/_components/dashboard-theme-toggle";
import "./intern-portal.css";
export function InternShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  return (
    <div className="dashboard-theme-root ip-standalone">
      <a className="ip-skip-link" href="#intern-content">
        Skip to content
      </a>
      <header className="ip-standalone-header">
        <div>
          <GraduationCap size={22} />
          <strong>ARKO</strong>
          <span>Intern portal</span>
        </div>
        <div>
          <span className="ip-shell-name">{name}</span>
          <DashboardThemeToggle />
          <button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError("");
              try {
                await signOut({ redirect: false });
                queryClient.clear();
                window.location.assign("/intern/login");
              } catch {
                setError("Could not sign out. Try again.");
                setPending(false);
              }
            }}
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <main id="intern-content" className="ip-standalone-main">
        {children}
      </main>
    </div>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export function DashboardThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.systemTheme === "light"
        ? "light"
        : "dark",
    );
  }, []);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const radius = Math.hypot(
      Math.max(event.clientX, window.innerWidth - event.clientX),
      Math.max(event.clientY, window.innerHeight - event.clientY),
    );

    root.style.setProperty("--theme-iris-x", `${event.clientX}px`);
    root.style.setProperty("--theme-iris-y", `${event.clientY}px`);
    root.style.setProperty("--theme-iris-radius", `${radius}px`);

    const applyTheme = () => {
      root.dataset.systemTheme = nextTheme;
      localStorage.setItem("arko-system-theme", nextTheme);
      setTheme(nextTheme);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme();
      return;
    }

    const transition = (
      document as ViewTransitionDocument
    ).startViewTransition?.(applyTheme);
    if (!transition) {
      applyTheme();
      return;
    }

    root.classList.add("system-theme-iris-transition");
    void transition.finished.finally(() =>
      root.classList.remove("system-theme-iris-transition"),
    );
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-tertiary transition-colors hover:border-primary-500/40 hover:text-text-primary"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import type { LandingTheme } from "@/lib/landing/theme";
import { changeLandingTheme } from "../../actions/theme";
import styles from "./ink.module.css";

function ThemeButtons({ current }: { current: LandingTheme }) {
  const { pending } = useFormStatus();
  return (
    <fieldset className={styles.themeOptions} disabled={pending}>
      <legend className={styles.srOnly}>Website theme</legend>
      <span aria-hidden="true">Edition</span>
      <button name="theme" value="ink" aria-pressed={current === "ink"}>
        Ink
      </button>
      <button name="theme" value="studio" aria-pressed={current === "studio"}>
        Original
      </button>
      <span className={styles.srOnly} role="status">
        {pending ? "Changing theme…" : ""}
      </span>
    </fieldset>
  );
}

export default function ThemeSwitcher({
  current,
  floating = false,
}: {
  current: LandingTheme;
  floating?: boolean;
}) {
  return (
    <form
      action={changeLandingTheme}
      className={floating ? styles.floatingTheme : undefined}
    >
      <ThemeButtons current={current} />
    </form>
  );
}

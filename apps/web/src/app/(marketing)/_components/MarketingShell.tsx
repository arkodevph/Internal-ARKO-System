"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LandingTheme } from "@/lib/landing/theme";
import SiteHeader from "./SiteHeader";
import SmoothScrollProvider from "./SmoothScrollProvider";
import Preloader from "./Preloader";
import StickyMobileCta from "./StickyMobileCta";
import MarketingPageTransition from "./MarketingPageTransition";
import FloatingAssistant from "./FloatingAssistant";
import ThemeSwitcher from "./ink/ThemeSwitcher";
import styles from "./ink/ink.module.css";

export default function MarketingShell({
  children,
  theme,
}: {
  children: ReactNode;
  theme: LandingTheme;
}) {
  const pathname = usePathname();
  if (pathname === "/" && theme === "ink") {
    return (
      <div className={styles.root} data-landing-theme="ink">
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>
        <header className={styles.header}>
          <a className={styles.wordmark} href="#top" aria-label="Arko home">
            arkō<span>®</span>
          </a>
          <span className={styles.headerDescriptor}>
            Independent software studio
            <br />
            Philippines / Working everywhere
          </span>
          <nav aria-label="Main navigation" className={styles.nav}>
            <a href="#work">
              Work <sup>01</sup>
            </a>
            <a href="#studio">
              Studio <sup>02</sup>
            </a>
            <a href="#contact">
              Let’s talk <span aria-hidden="true">↗</span>
            </a>
          </nav>
          <ThemeSwitcher current="ink" />
        </header>
        <main id="main-content">{children}</main>
      </div>
    );
  }

  return (
    <div className="landing-root">
      <Preloader />
      <a
        href="#main-content"
        className="sr-only z-[200] bg-ink px-4 py-3 text-acid focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <MarketingPageTransition>
        <SmoothScrollProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
        </SmoothScrollProvider>
        <FloatingAssistant />
        <StickyMobileCta />
        {pathname === "/" && <ThemeSwitcher current="studio" floating />}
      </MarketingPageTransition>
    </div>
  );
}

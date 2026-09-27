"use client";

import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SmoothScrollProvider from "./SmoothScrollProvider";
import Preloader from "./Preloader";
import StickyMobileCta from "./StickyMobileCta";
import MarketingPageTransition from "./MarketingPageTransition";
import FloatingAssistant from "./FloatingAssistant";

export default function MarketingShell({ children }: { children: ReactNode }) {
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
      </MarketingPageTransition>
    </div>
  );
}

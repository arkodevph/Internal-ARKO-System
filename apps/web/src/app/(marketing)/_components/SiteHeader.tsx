"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FolderKanban,
  Home,
  LogIn,
  MessageCircle,
} from "lucide-react";
import StarBorder from "./StarBorder";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "Projects", href: "/projects" },
  { label: "Blogs", href: "/blogs" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [onGreen, setOnGreen] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sections = document.querySelectorAll('[data-bg="light"]');
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries.some((e) => e.isIntersecting);
        setOnGreen(active);
      },
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  // Green background → dark header (ink bg, white text)
  // Dark background (video, etc.) → acid header (green bg, black text)
  const greenBgHeader = onGreen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 max-md:border-b max-md:border-white/10 max-md:bg-ink/95 max-md:backdrop-blur-md ${
        greenBgHeader
          ? "border-b border-white/10 bg-ink/90 backdrop-blur-md"
          : "bg-acid/90 backdrop-blur-sm"
      }`}
    >
      <div className="flex h-14 items-center justify-between px-4 md:h-20 md:px-10">
        <Link href="/" aria-label="ARKO Software Studio home">
          <Image
            src="/icon.png"
            alt=""
            width={512}
            height={512}
            priority
            className="h-10 w-10 object-contain md:h-14 md:w-14"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`eyebrow transition-colors hover:opacity-60 ${
                greenBgHeader ? "text-white" : "text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex md:gap-6">
          <a
            href="/auth/login"
            className={`eyebrow transition-colors hover:opacity-60 ${
              greenBgHeader ? "text-white" : "text-ink"
            }`}
          >
            Login
          </a>
          <StarBorder
            as="a"
            href="/#contact"
            color={greenBgHeader ? "#b8ff2e" : "#0a0a0a"}
            className="scale-90 md:scale-100"
          >
            Start a project
          </StarBorder>
        </div>
        <Link
          href="/#contact"
          className="mono inline-flex min-h-10 items-center border border-acid px-3 text-[0.58rem] font-bold uppercase tracking-wider text-acid md:hidden"
        >
          Start project
        </Link>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {[
          { label: "Home", href: "/", icon: Home },
          { label: "Projects", href: "/projects", icon: FolderKanban },
          { label: "Blogs", href: "/blogs", icon: BookOpen },
          { label: "Contact", href: "/#contact", icon: MessageCircle },
          { label: "Login", href: "/auth/login", icon: LogIn },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            aria-current={
              (label === "Home" && pathname === "/") ||
              (label === "Projects" && pathname.startsWith("/projects")) ||
              (label === "Blogs" && pathname.startsWith("/blogs"))
                ? "page"
                : undefined
            }
            className={`flex min-h-16 flex-col items-center justify-center gap-1 transition-colors active:bg-white/5 ${(label === "Home" && pathname === "/") || (label === "Projects" && pathname.startsWith("/projects")) || (label === "Blogs" && pathname.startsWith("/blogs")) ? "text-acid" : "text-white/45 active:text-acid"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="mono text-[0.5rem] uppercase tracking-wider">
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared client document — Arko",
  robots: { index: false, follow: false, nocache: true },
};

export default function SharedDocumentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

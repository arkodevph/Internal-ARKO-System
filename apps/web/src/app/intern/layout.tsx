import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intern Workspace | ARKO",
  robots: { index: false, follow: false },
};

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

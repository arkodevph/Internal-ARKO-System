import type { Metadata } from "next";

// Auth screens are app UI, not indexable content - keep them out of search.
export const metadata: Metadata = {
  title: "Arko Member Sign In | Secure Workspace Access",
  description:
    "Sign in securely to the private Arko workspace for project management, documents, tasks, finance, messages, and team operations.",
  alternates: { canonical: "/auth/login" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    url: "/auth/login",
    title: "Arko Member Sign In | Secure Workspace Access",
    description: "Secure member access to the private Arko workspace.",
    images: [
      {
        url: "/social-card?v=2",
        width: 1200,
        height: 630,
        alt: "Arko member access",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arko Member Sign In | Secure Workspace Access",
    description: "Secure member access to the private Arko workspace.",
    images: ["/social-card?v=2"],
  },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

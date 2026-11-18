import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { InternShell } from "./_components/shell";

export const metadata: Metadata = {
  title: "Intern Workspace | ARKO",
  robots: { index: false, follow: false },
};

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (!["INTERN", "ADMIN"].includes(session.user.role ?? ""))
    redirect("/dashboard");
  return <InternShell>{children}</InternShell>;
}

import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import { EmailMarketingDashboard } from "./_components/email-marketing-dashboard";

const sections = [
  "overview",
  "audience",
  "templates",
  "campaigns",
  "automations",
  "inbox",
  "delivery",
  "settings",
] as const;
export type EmailMarketingSection = (typeof sections)[number];

export default async function EmailMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (!["ADMIN", "MEMBER"].includes(session.user.role ?? ""))
    redirect("/dashboard");
  const requested = (await searchParams).section;
  const initialSection = sections.includes(requested as EmailMarketingSection)
    ? (requested as EmailMarketingSection)
    : "overview";

  return (
    <EmailMarketingDashboard
      initialSection={initialSection}
      role={session.user.role ?? "USER"}
    />
  );
}

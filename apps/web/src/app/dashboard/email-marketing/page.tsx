import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import { EmailMarketingDashboard } from "./_components/email-marketing-dashboard";
import { hasPermission } from "../../../lib/rbac";

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
  if (!hasPermission(session.user.role, "email-marketing:read", session.user.permissions))
    redirect("/dashboard");
  const requested = (await searchParams).section;
  const initialSection = sections.includes(requested as EmailMarketingSection)
    ? (requested as EmailMarketingSection)
    : "overview";

  return (
    <EmailMarketingDashboard
      initialSection={initialSection}
      canManage={hasPermission(
        session.user.role,
        "email-marketing:manage",
        session.user.permissions,
      )}
    />
  );
}

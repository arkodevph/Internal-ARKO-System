import DashboardContent from "./_components/dashboard-content";
import { DemoDashboard } from "./_components/demo-dashboard";
import { auth } from "../../lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (session?.user?.role === "CLIENT") redirect("/dashboard/client-portal");
  if (session?.user?.role === "DEMO") return <DemoDashboard />;
  return <DashboardContent />;
}

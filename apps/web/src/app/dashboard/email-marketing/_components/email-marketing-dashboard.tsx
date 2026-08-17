"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  ContactRound,
  FileCode2,
  Inbox,
  Mail,
  Settings,
} from "lucide-react";
import type { EmailMarketingSection } from "../page";
import { OverviewSection } from "./overview-section";
import { AudienceSection } from "./audience-section";
import { TemplatesSection } from "./templates-section";
import { CampaignsSection } from "./campaigns-section";
import { AutomationsSection } from "./automations-section";
import { InboxSection } from "./inbox-section";
import { DeliverySection } from "./delivery-section";
import { SettingsSection } from "./settings-section";

const sections: Array<{
  id: EmailMarketingSection;
  label: string;
  icon: typeof Mail;
}> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "audience", label: "Audience", icon: ContactRound },
  { id: "templates", label: "Templates", icon: FileCode2 },
  { id: "campaigns", label: "Campaigns", icon: Mail },
  { id: "automations", label: "Automations", icon: Bot },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "delivery", label: "Delivery", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export function EmailMarketingDashboard({
  initialSection,
  canManage,
}: {
  initialSection: EmailMarketingSection;
  canManage: boolean;
}) {
  const [section, setSection] = useState(initialSection);
  const router = useRouter();
  const isAdmin = canManage;

  function choose(next: EmailMarketingSection) {
    setSection(next);
    router.replace(`/dashboard/email-marketing?section=${next}`, {
      scroll: false,
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            <Mail className="h-4 w-4" /> ARKO Communications
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Email Marketing
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Audience, campaigns, automations, replies, and delivery health in
            one workspace.
          </p>
        </div>
        <span className="w-fit rounded-full border border-border-subtle bg-card px-3 py-1.5 text-xs text-text-tertiary">
          {isAdmin ? "Administrator access" : "Member access"}
        </span>
      </header>

      <nav
        className="flex gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-card p-1.5"
        aria-label="Email marketing sections"
      >
        {sections.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${active ? "bg-primary-600 text-white shadow-sm" : "text-text-tertiary hover:bg-card/[0.04] hover:text-text-primary"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          );
        })}
      </nav>

      {section === "overview" && <OverviewSection onNavigate={choose} />}
      {section === "audience" && <AudienceSection isAdmin={isAdmin} />}
      {section === "templates" && <TemplatesSection />}
      {section === "campaigns" && <CampaignsSection isAdmin={isAdmin} />}
      {section === "automations" && <AutomationsSection isAdmin={isAdmin} />}
      {section === "inbox" && <InboxSection />}
      {section === "delivery" && <DeliverySection />}
      {section === "settings" && <SettingsSection isAdmin={isAdmin} />}
    </div>
  );
}

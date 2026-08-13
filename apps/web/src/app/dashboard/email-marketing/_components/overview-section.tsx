"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  AlertTriangle,
  ArrowRight,
  ContactRound,
  FileCode2,
  Mail,
  Plus,
} from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import type { EmailMarketingSection } from "../page";
import { EmptyState, formatDate, StatCard, StatusBadge } from "./shared";

export function OverviewSection({
  onNavigate,
}: {
  onNavigate: (section: EmailMarketingSection) => void;
}) {
  const { data, isLoading } = api.emailMarketing.overview.useQuery();
  const settings = api.emailMarketing.settings.get.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  const deliveryRate = data.totals.sent
    ? Math.round((data.totals.delivered / data.totals.sent) * 100)
    : 0;
  const openRate = data.totals.delivered
    ? Math.round((data.totals.opened / data.totals.delivered) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {(!settings.data?.providerConfigured ||
        !settings.data?.webhookConfigured) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Email delivery setup is incomplete</p>
            <p className="mt-0.5 text-xs opacity-80">
              Draft work is available, but sending and delivery tracking require
              the Resend API and webhook secrets.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Contacts"
          value={data.contacts}
          detail={`${data.subscribers} subscribed`}
        />
        <StatCard
          label="Campaigns"
          value={data.campaigns}
          detail={`${data.scheduled} scheduled or sending`}
        />
        <StatCard
          label="Delivery rate"
          value={`${deliveryRate}%`}
          detail={`${data.totals.delivered} delivered`}
        />
        <StatCard
          label="Open rate"
          value={`${openRate}%`}
          detail={`${data.totals.clicked} clicked`}
        />
        <StatCard
          label="Templates"
          value={data.templates}
          detail="Active templates"
        />
        <StatCard
          label="Automations"
          value={data.automations}
          detail="Active workflows"
        />
        <StatCard label="Inbox" value={data.unread} detail="Unread replies" />
        <StatCard
          label="Suppressions"
          value={data.suppressions}
          detail={`${data.totals.failed} recent failures`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="hover:translate-y-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm">Recent campaigns</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("campaigns")}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentCampaigns.length ? (
              <div className="divide-y divide-border-subtle">
                {data.recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="rounded-lg bg-primary-500/10 p-2 text-primary-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {campaign.recipientCount} recipients ·{" "}
                        {formatDate(campaign.scheduledAt || campaign.createdAt)}
                      </p>
                    </div>
                    <StatusBadge value={campaign.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No campaigns yet"
                detail="Create your first draft to start building an audience."
              />
            )}
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <button
              onClick={() => onNavigate("audience")}
              className="flex items-center gap-3 rounded-xl border border-border-subtle p-3 text-left transition hover:border-primary-500/30 hover:bg-primary-500/5"
            >
              <ContactRound className="h-4 w-4 text-primary-500" />
              <span className="flex-1 text-sm text-text-primary">
                Add or import contacts
              </span>
              <Plus className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
            <button
              onClick={() => onNavigate("templates")}
              className="flex items-center gap-3 rounded-xl border border-border-subtle p-3 text-left transition hover:border-primary-500/30 hover:bg-primary-500/5"
            >
              <FileCode2 className="h-4 w-4 text-primary-500" />
              <span className="flex-1 text-sm text-text-primary">
                Build an email template
              </span>
              <Plus className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
            <button
              onClick={() => onNavigate("campaigns")}
              className="flex items-center gap-3 rounded-xl border border-border-subtle p-3 text-left transition hover:border-primary-500/30 hover:bg-primary-500/5"
            >
              <Mail className="h-4 w-4 text-primary-500" />
              <span className="flex-1 text-sm text-text-primary">
                Create a campaign
              </span>
              <Plus className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

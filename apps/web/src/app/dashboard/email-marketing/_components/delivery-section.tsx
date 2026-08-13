"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import { Activity, Ban } from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { EmptyState, fieldClass, formatDate, StatusBadge } from "./shared";

const statuses = [
  "",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "DEFERRED",
  "BOUNCED",
  "COMPLAINED",
  "FAILED",
  "SUPPRESSED",
  "OPENED",
  "CLICKED",
  "CANCELLED",
] as const;

export function DeliverySection() {
  const [status, setStatus] = useState<(typeof statuses)[number]>("");
  const [view, setView] = useState<"activity" | "suppressions">("activity");
  const delivery = api.emailMarketing.delivery.useQuery(
    status ? { status } : {},
  );
  const suppressions = api.emailMarketing.suppressions.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Delivery activity
          </h2>
          <p className="text-xs text-text-tertiary">
            Provider acceptance, delivery, engagement, and failures by
            recipient.
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView("activity")}
            className={`rounded-lg px-3 py-2 text-xs ${view === "activity" ? "bg-primary-500/10 text-primary-500" : "text-text-tertiary"}`}
          >
            Activity
          </button>
          <button
            onClick={() => setView("suppressions")}
            className={`rounded-lg px-3 py-2 text-xs ${view === "suppressions" ? "bg-primary-500/10 text-primary-500" : "text-text-tertiary"}`}
          >
            Suppressions
          </button>
        </div>
      </div>
      {view === "activity" ? (
        <Card className="hover:translate-y-0">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" /> Recipient ledger
            </CardTitle>
            <select
              className={`${fieldClass} w-44`}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              {statuses.map((item) => (
                <option key={item || "ALL"} value={item}>
                  {item || "All statuses"}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {!delivery.data?.length ? (
              <EmptyState
                title="No delivery activity"
                detail="Recipient events appear after a campaign is launched."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="border-b border-border-subtle text-text-tertiary">
                    <tr>
                      <th className="px-2 py-2 font-medium">Recipient</th>
                      <th className="px-2 py-2 font-medium">Campaign</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Last update</th>
                      <th className="px-2 py-2 font-medium">Provider ID</th>
                      <th className="px-2 py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {delivery.data.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-3 font-medium text-text-primary">
                          {item.email}
                        </td>
                        <td className="px-2 py-3 text-text-secondary">
                          {item.campaign.name}
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge value={item.status} />
                        </td>
                        <td className="px-2 py-3 text-text-tertiary">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="max-w-48 truncate px-2 py-3 font-mono text-[10px] text-text-tertiary">
                          {item.providerEmailId || "—"}
                        </td>
                        <td className="max-w-56 truncate px-2 py-3 text-red-500">
                          {item.errorMessage || item.events[0]?.type || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ban className="h-4 w-4" /> Suppression list
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!suppressions.data?.length ? (
              <EmptyState
                title="No suppressed addresses"
                detail="Unsubscribes, bounces, complaints, and manual suppressions appear here."
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {suppressions.data.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                      {item.email}
                    </p>
                    <StatusBadge value={item.reason} />
                    <p className="text-xs text-text-tertiary">
                      {item.source} · {formatDate(item.suppressedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent } from "@arko/ui";
import { Clock3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparkline } from "./sparkline";

export function MetricCard({
  label,
  value,
  detail,
  icon,
  delta,
  trend = [],
  positive = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  delta?: number | null;
  trend?: number[];
  positive?: boolean;
}) {
  return (
    <Card className="dashboard-panel">
      <CardContent className="p-5 xl:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">{label}</p>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${positive ? "bg-primary-500/10 text-primary-400" : "bg-red-500/10 text-red-400"}`}
          >
            {icon}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 xl:mt-2">
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tabular-nums text-text-primary">
              {value}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
              {delta == null ? (
                <Clock3 className="h-3 w-3" />
              ) : delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-primary-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-400" />
              )}
              {delta == null
                ? detail
                : `${Math.abs(delta).toFixed(1)}% ${detail}`}
            </p>
          </div>
          <Sparkline
            data={trend}
            color={positive ? "#22c55e" : "#f87171"}
            className="h-8 w-20 shrink-0 opacity-80"
          />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isRefreshing}
      className="mono mt-8 inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw
        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
      />
      {isRefreshing ? "Refreshing" : "Refresh posts"}
    </button>
  );
}

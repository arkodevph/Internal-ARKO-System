"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  CheckCircle2,
  Loader2,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import { Field, fieldClass } from "./shared";

const defaults = {
  fromName: "ARKO",
  fromEmail: "marketing@arkodevph.com",
  replyTo: "",
  inboundAddress: "",
  trackOpens: true,
  trackClicks: true,
  companyName: "ARKO",
  companyAddress: "",
};

export function SettingsSection({ isAdmin }: { isAdmin: boolean }) {
  const settings = api.emailMarketing.settings.get.useQuery();
  const [form, setForm] = useState(defaults);
  useEffect(() => {
    if (settings.data)
      setForm({
        fromName: settings.data.fromName,
        fromEmail: settings.data.fromEmail,
        replyTo: settings.data.replyTo ?? "",
        inboundAddress: settings.data.inboundAddress ?? "",
        trackOpens: settings.data.trackOpens,
        trackClicks: settings.data.trackClicks,
        companyName: settings.data.companyName,
        companyAddress: settings.data.companyAddress,
      });
  }, [settings.data]);
  const update = api.emailMarketing.settings.update.useMutation({
    onSuccess: async () => {
      await settings.refetch();
      toast("Email marketing settings saved");
    },
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="hover:translate-y-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" /> Sender and compliance defaults
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              update.mutate(form);
            }}
          >
            <fieldset
              disabled={!isAdmin || update.isPending}
              className="grid gap-3 md:grid-cols-2 disabled:opacity-70"
            >
              <Field label="From name">
                <input
                  required
                  className={fieldClass}
                  value={form.fromName}
                  onChange={(event) =>
                    setForm({ ...form, fromName: event.target.value })
                  }
                />
              </Field>
              <Field label="From email">
                <input
                  required
                  type="email"
                  className={fieldClass}
                  value={form.fromEmail}
                  onChange={(event) =>
                    setForm({ ...form, fromEmail: event.target.value })
                  }
                />
              </Field>
              <Field label="Reply-to address">
                <input
                  type="email"
                  className={fieldClass}
                  value={form.replyTo}
                  onChange={(event) =>
                    setForm({ ...form, replyTo: event.target.value })
                  }
                />
              </Field>
              <Field label="Inbound address">
                <input
                  type="email"
                  className={fieldClass}
                  value={form.inboundAddress}
                  onChange={(event) =>
                    setForm({ ...form, inboundAddress: event.target.value })
                  }
                />
              </Field>
              <Field label="Company name">
                <input
                  required
                  className={fieldClass}
                  value={form.companyName}
                  onChange={(event) =>
                    setForm({ ...form, companyName: event.target.value })
                  }
                />
              </Field>
              <Field label="Company postal address">
                <input
                  className={fieldClass}
                  value={form.companyAddress}
                  onChange={(event) =>
                    setForm({ ...form, companyAddress: event.target.value })
                  }
                />
              </Field>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.trackOpens}
                  onChange={(event) =>
                    setForm({ ...form, trackOpens: event.target.checked })
                  }
                />{" "}
                Enable open tracking
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.trackClicks}
                  onChange={(event) =>
                    setForm({ ...form, trackClicks: event.target.checked })
                  }
                />{" "}
                Enable click tracking
              </label>
            </fieldset>
            {isAdmin ? (
              <Button
                type="submit"
                className="mt-4"
                disabled={update.isPending}
              >
                {update.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{" "}
                Save settings
              </Button>
            ) : (
              <p className="mt-4 text-xs text-amber-500">
                Only administrators can change delivery and compliance settings.
              </p>
            )}
            {update.error && (
              <p className="mt-2 text-xs text-red-500">
                {update.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">Connection health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Health
              label="Resend API"
              healthy={Boolean(settings.data?.providerConfigured)}
            />
            <Health
              label="Signed webhooks"
              healthy={Boolean(settings.data?.webhookConfigured)}
            />
            <Health
              label="Provider"
              healthy
              detail={settings.data?.provider ?? "RESEND"}
            />
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Compliance guardrails
                </p>
                <p className="mt-1 text-xs leading-5 text-text-tertiary">
                  Every campaign checks subscription and suppression state,
                  freezes its eligible audience, and includes an unsubscribe
                  link. Bounce and complaint events automatically suppress
                  future sends.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Health({
  label,
  healthy,
  detail,
}: {
  label: string;
  healthy: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-subtle p-3">
      {healthy ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="flex-1 text-xs font-medium text-text-secondary">
        {label}
      </span>
      <span className="text-[10px] text-text-tertiary">
        {detail ?? (healthy ? "Configured" : "Missing")}
      </span>
    </div>
  );
}

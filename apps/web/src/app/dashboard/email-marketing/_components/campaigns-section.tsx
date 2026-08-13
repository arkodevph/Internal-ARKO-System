"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  CalendarClock,
  Copy,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Send,
} from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import {
  EmptyState,
  Field,
  fieldClass,
  formatDate,
  StatusBadge,
} from "./shared";

const emptyAudience = {
  includeContactIds: [] as string[],
  excludeContactIds: [] as string[],
  includeTagIds: [] as string[],
  excludeTagIds: [] as string[],
  includeSegmentIds: [] as string[],
  excludeSegmentIds: [] as string[],
};

const emptyCampaign = {
  name: "",
  description: "",
  templateId: null as string | null,
  clientId: null as string | null,
  projectId: null as string | null,
  fromName: "ARKO",
  fromEmail: "marketing@arkodevph.com",
  replyTo: null as string | null,
  subject: "",
  previewText: "",
  htmlBody: "",
  textBody: "",
  timezone: "Asia/Manila",
  audience: emptyAudience,
};

export function CampaignsSection({ isAdmin }: { isAdmin: boolean }) {
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyCampaign);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const campaigns = api.emailMarketing.campaigns.list.useQuery();
  const lookups = api.emailMarketing.lookups.useQuery();
  const settings = api.emailMarketing.settings.get.useQuery();
  const preview = api.emailMarketing.campaigns.audiencePreview.useQuery(
    { id: reviewId ?? "" },
    { enabled: Boolean(reviewId) },
  );
  const utils = api.useUtils();

  useEffect(() => {
    if (
      settings.data &&
      !form.name &&
      form.fromEmail === emptyCampaign.fromEmail
    ) {
      setForm((current) => ({
        ...current,
        fromName: settings.data.fromName,
        fromEmail: settings.data.fromEmail,
        replyTo: settings.data.replyTo,
      }));
    }
  }, [settings.data, form.name, form.fromEmail]);

  const invalidate = () =>
    Promise.all([
      campaigns.refetch(),
      utils.emailMarketing.overview.invalidate(),
    ]);
  const create = api.emailMarketing.campaigns.create.useMutation({
    onSuccess: async (campaign) => {
      await invalidate();
      setReviewId(campaign.id);
      setStep(5);
      toast("Campaign draft saved");
    },
  });
  const duplicate = api.emailMarketing.campaigns.duplicate.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast("Campaign duplicated");
    },
  });
  const launch = api.emailMarketing.campaigns.launch.useMutation({
    onSuccess: async (campaign) => {
      await invalidate();
      await preview.refetch();
      toast(
        campaign?.status === "SCHEDULED"
          ? "Campaign scheduled"
          : "Campaign processing started",
      );
      setShowWizard(false);
      setReviewId(null);
      setStep(1);
      setForm(emptyCampaign);
      setScheduledAt("");
    },
  });
  const retry = api.emailMarketing.campaigns.retryFailed.useMutation({
    onSuccess: async (result) => {
      await invalidate();
      toast(`${result.count} failed recipients queued for retry`);
    },
  });

  function chooseTemplate(id: string) {
    const template = lookups.data?.templates.find((item) => item.id === id);
    setForm({
      ...form,
      templateId: id || null,
      ...(template && {
        subject: template.subject,
        previewText: template.previewText ?? "",
        htmlBody: template.htmlBody,
        textBody: template.textBody ?? "",
      }),
    });
  }

  function toggleAudience(field: keyof typeof emptyAudience, id: string) {
    const values = form.audience[field];
    setForm({
      ...form,
      audience: {
        ...form.audience,
        [field]: values.includes(id)
          ? values.filter((value) => value !== id)
          : [...values, id],
      },
    });
  }

  const steps = ["Details", "Content", "Audience", "Delivery", "Review"];
  const selectedClientProjects =
    lookups.data?.projects.filter(
      (project) => !form.clientId || project.clientId === form.clientId,
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Campaigns
          </h2>
          <p className="text-xs text-text-tertiary">
            Create, review, schedule, and track marketing sends.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowWizard(true);
            setStep(1);
            setReviewId(null);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Campaign
        </Button>
      </div>

      {showWizard && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${step === index + 1 ? "bg-primary-600 text-white" : step > index + 1 ? "bg-emerald-500/10 text-emerald-500" : "bg-card text-text-tertiary"}`}
                >
                  {index + 1}. {label}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Campaign name">
                  <input
                    autoFocus
                    required
                    className={fieldClass}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Internal description">
                  <input
                    className={fieldClass}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </Field>
                <Field label="ARKO client (optional)">
                  <select
                    className={fieldClass}
                    value={form.clientId ?? ""}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        clientId: event.target.value || null,
                        projectId: null,
                      })
                    }
                  >
                    <option value="">No client</option>
                    {lookups.data?.clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name || client.email}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Client project (optional)">
                  <select
                    className={fieldClass}
                    value={form.projectId ?? ""}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        projectId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">No project</option>
                    {selectedClientProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Template">
                    <select
                      className={fieldClass}
                      value={form.templateId ?? ""}
                      onChange={(event) => chooseTemplate(event.target.value)}
                    >
                      <option value="">Custom content</option>
                      {lookups.data?.templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Subject">
                    <input
                      required
                      className={fieldClass}
                      value={form.subject}
                      onChange={(event) =>
                        setForm({ ...form, subject: event.target.value })
                      }
                    />
                  </Field>
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
                  <Field label="Reply-to">
                    <input
                      type="email"
                      className={fieldClass}
                      value={form.replyTo ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          replyTo: event.target.value || null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Preview text">
                    <input
                      className={fieldClass}
                      value={form.previewText}
                      onChange={(event) =>
                        setForm({ ...form, previewText: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  <Field label="HTML content">
                    <textarea
                      required
                      className={`${fieldClass} min-h-64 font-mono text-xs`}
                      value={form.htmlBody}
                      onChange={(event) =>
                        setForm({ ...form, htmlBody: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Plain-text fallback">
                    <textarea
                      className={`${fieldClass} min-h-64 font-mono text-xs`}
                      value={form.textBody}
                      onChange={(event) =>
                        setForm({ ...form, textBody: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 xl:grid-cols-2">
                <AudiencePicker
                  title="Include audience"
                  contacts={lookups.data?.contacts ?? []}
                  tags={lookups.data?.tags ?? []}
                  segments={lookups.data?.segments ?? []}
                  values={{
                    contacts: form.audience.includeContactIds,
                    tags: form.audience.includeTagIds,
                    segments: form.audience.includeSegmentIds,
                  }}
                  toggle={(kind, id) =>
                    toggleAudience(
                      kind === "contacts"
                        ? "includeContactIds"
                        : kind === "tags"
                          ? "includeTagIds"
                          : "includeSegmentIds",
                      id,
                    )
                  }
                />
                <AudiencePicker
                  title="Exclude audience"
                  contacts={lookups.data?.contacts ?? []}
                  tags={lookups.data?.tags ?? []}
                  segments={lookups.data?.segments ?? []}
                  values={{
                    contacts: form.audience.excludeContactIds,
                    tags: form.audience.excludeTagIds,
                    segments: form.audience.excludeSegmentIds,
                  }}
                  toggle={(kind, id) =>
                    toggleAudience(
                      kind === "contacts"
                        ? "excludeContactIds"
                        : kind === "tags"
                          ? "excludeTagIds"
                          : "excludeSegmentIds",
                      id,
                    )
                  }
                />
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Schedule date and time (leave blank to send now)">
                  <input
                    type="datetime-local"
                    className={fieldClass}
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    className={fieldClass}
                    value={form.timezone}
                    onChange={(event) =>
                      setForm({ ...form, timezone: event.target.value })
                    }
                  >
                    <option>Asia/Manila</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                  </select>
                </Field>
                <div className="rounded-xl bg-card p-4 text-xs text-text-tertiary md:col-span-2">
                  <CalendarClock className="mb-2 h-4 w-4 text-primary-500" />
                  The campaign remains a draft until an administrator confirms
                  it on the review step. Recipient eligibility is recalculated
                  and frozen at launch.
                </div>
              </div>
            )}

            {step === 5 && reviewId && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <ReviewMetric
                    label="Selected"
                    value={preview.data?.counts.selected ?? "…"}
                  />
                  <ReviewMetric
                    label="Excluded"
                    value={preview.data?.counts.excluded ?? "…"}
                  />
                  <ReviewMetric
                    label="Suppressed"
                    value={preview.data?.counts.suppressed ?? "…"}
                  />
                  <ReviewMetric
                    label="Eligible"
                    value={preview.data?.counts.eligible ?? "…"}
                  />
                </div>
                <div className="rounded-xl border border-border-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    Final confirmation
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {scheduledAt
                      ? `Schedule for ${formatDate(new Date(scheduledAt))}.`
                      : "Start sending now."}{" "}
                    Content and the recipient snapshot become immutable when
                    confirmed.
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    disabled={
                      launch.isPending || !preview.data?.counts.eligible
                    }
                    onClick={() =>
                      confirm(
                        `Confirm delivery to ${preview.data?.counts.eligible ?? 0} eligible recipients?`,
                      ) &&
                      launch.mutate({
                        id: reviewId,
                        ...(scheduledAt && {
                          scheduledAt: new Date(scheduledAt),
                        }),
                      })
                    }
                  >
                    {launch.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : scheduledAt ? (
                      <CalendarClock className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {scheduledAt ? "Confirm schedule" : "Confirm and send"}
                  </Button>
                ) : (
                  <p className="text-xs text-amber-500">
                    An administrator must launch or schedule this campaign.
                  </p>
                )}
                {launch.error && (
                  <p className="text-xs text-red-500">{launch.error.message}</p>
                )}
              </div>
            )}

            {step < 5 && (
              <div className="mt-5 flex justify-between border-t border-border-subtle pt-4">
                <Button
                  variant="ghost"
                  disabled={step === 1}
                  onClick={() => setStep((value) => Math.max(1, value - 1))}
                >
                  Back
                </Button>
                {step < 4 ? (
                  <Button
                    disabled={
                      (step === 1 && !form.name) ||
                      (step === 2 && (!form.subject || !form.htmlBody))
                    }
                    onClick={() => setStep((value) => value + 1)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    disabled={
                      create.isPending ||
                      !(
                        form.audience.includeContactIds.length ||
                        form.audience.includeTagIds.length ||
                        form.audience.includeSegmentIds.length
                      )
                    }
                    onClick={() => create.mutate(form)}
                  >
                    {create.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}{" "}
                    Save and review
                  </Button>
                )}
              </div>
            )}
            {create.error && (
              <p className="mt-3 text-xs text-red-500">
                {create.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!campaigns.data?.length ? (
        <EmptyState
          title="No campaigns yet"
          detail="Create a draft and choose an eligible audience."
        />
      ) : (
        <div className="space-y-2">
          {campaigns.data.map((campaign) => (
            <Card key={campaign.id} className="hover:translate-y-0">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="rounded-lg bg-primary-500/10 p-2 text-primary-500">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary">
                      {campaign.name}
                    </p>
                    <StatusBadge value={campaign.status} />
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {campaign.subject} · {campaign.recipientCount} recipients ·{" "}
                    {campaign.project?.name ||
                      campaign.client?.name ||
                      "ARKO company campaign"}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-[10px] text-text-tertiary">
                  <span>
                    <b className="block text-sm text-text-primary">
                      {campaign.sentCount}
                    </b>
                    Sent
                  </span>
                  <span>
                    <b className="block text-sm text-text-primary">
                      {campaign.deliveredCount}
                    </b>
                    Delivered
                  </span>
                  <span>
                    <b className="block text-sm text-text-primary">
                      {campaign.openedCount}
                    </b>
                    Opened
                  </span>
                  <span>
                    <b className="block text-sm text-text-primary">
                      {campaign.failedCount}
                    </b>
                    Failed
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicate.mutate({ id: campaign.id })}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {campaign.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReviewId(campaign.id);
                        setShowWizard(true);
                        setStep(5);
                      }}
                    >
                      Review
                    </Button>
                  )}
                  {isAdmin && campaign.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retry.mutate({ id: campaign.id })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-card p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

function AudiencePicker({
  title,
  contacts,
  tags,
  segments,
  values,
  toggle,
}: {
  title: string;
  contacts: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  tags: Array<{ id: string; name: string }>;
  segments: Array<{ id: string; name: string }>;
  values: { contacts: string[]; tags: string[]; segments: string[] };
  toggle: (kind: "contacts" | "tags" | "segments", id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border-subtle p-4">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <PickerGroup
        label="Segments"
        items={segments}
        values={values.segments}
        toggle={(id) => toggle("segments", id)}
      />
      <PickerGroup
        label="Tags"
        items={tags}
        values={values.tags}
        toggle={(id) => toggle("tags", id)}
      />
      <PickerGroup
        label="Individual contacts"
        items={contacts
          .slice(0, 100)
          .map((contact) => ({
            id: contact.id,
            name:
              [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
              contact.email,
          }))}
        values={values.contacts}
        toggle={(id) => toggle("contacts", id)}
      />
    </div>
  );
}

function PickerGroup({
  label,
  items,
  values,
  toggle,
}: {
  label: string;
  items: Array<{ id: string; name: string }>;
  values: string[];
  toggle: (id: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <div className="max-h-32 space-y-1 overflow-y-auto">
        {items.length ? (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:bg-card"
            >
              <input
                type="checkbox"
                checked={values.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              {item.name}
            </label>
          ))
        ) : (
          <p className="text-xs text-text-tertiary">None available</p>
        )}
      </div>
    </div>
  );
}

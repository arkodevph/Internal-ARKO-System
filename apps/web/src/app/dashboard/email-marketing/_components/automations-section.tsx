"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import { Bot, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import { EmptyState, Field, fieldClass, StatusBadge } from "./shared";

type Trigger =
  | "CONTACT_ADDED"
  | "TAG_ADDED"
  | "BIRTHDAY"
  | "DATE_BASED"
  | "SUBSCRIPTION_CONFIRMED";
type Action = "SEND_EMAIL" | "WAIT" | "ADD_TAG" | "REMOVE_TAG" | "END";
type Step = {
  action: Action;
  delayMinutes: number;
  templateId?: string;
  tagId?: string;
};

export function AutomationsSection({ isAdmin }: { isAdmin: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("CONTACT_ADDED");
  const [triggerTagId, setTriggerTagId] = useState("");
  const [triggerDate, setTriggerDate] = useState("");
  const [triggerSegmentId, setTriggerSegmentId] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { action: "SEND_EMAIL", delayMinutes: 0 },
    { action: "END", delayMinutes: 0 },
  ]);
  const automations = api.emailMarketing.automations.list.useQuery();
  const lookups = api.emailMarketing.lookups.useQuery();
  const utils = api.useUtils();
  const create = api.emailMarketing.automations.create.useMutation({
    onSuccess: async () => {
      await automations.refetch();
      await utils.emailMarketing.overview.invalidate();
      setShowForm(false);
      setName("");
      toast("Automation created as draft");
    },
  });
  const toggle = api.emailMarketing.automations.toggle.useMutation({
    onSuccess: async () => {
      await automations.refetch();
      await utils.emailMarketing.overview.invalidate();
    },
  });

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  }

  function save() {
    const triggerConfig = {
      ...(trigger === "TAG_ADDED" && triggerTagId && { tagId: triggerTagId }),
      ...(trigger === "DATE_BASED" && triggerDate && { date: triggerDate }),
      ...((trigger === "DATE_BASED" || trigger === "BIRTHDAY") &&
        triggerSegmentId && { segmentId: triggerSegmentId }),
    };
    create.mutate({ name, description, trigger, triggerConfig, steps });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Automations
          </h2>
          <p className="text-xs text-text-tertiary">
            Durable contact-level sequences with execution history.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-3.5 w-3.5" /> Automation
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">New automation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input
                  required
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field label="Description">
                <input
                  className={fieldClass}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
              <Field label="Trigger">
                <select
                  className={fieldClass}
                  value={trigger}
                  onChange={(event) =>
                    setTrigger(event.target.value as Trigger)
                  }
                >
                  <option value="CONTACT_ADDED">Contact added</option>
                  <option value="TAG_ADDED">Tag added</option>
                  <option value="BIRTHDAY">Birthday</option>
                  <option value="DATE_BASED">Specific date</option>
                  <option value="SUBSCRIPTION_CONFIRMED">
                    Subscription confirmed
                  </option>
                </select>
              </Field>
              {trigger === "TAG_ADDED" && (
                <Field label="Trigger tag">
                  <select
                    required
                    className={fieldClass}
                    value={triggerTagId}
                    onChange={(event) => setTriggerTagId(event.target.value)}
                  >
                    <option value="">Select tag</option>
                    {lookups.data?.tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {trigger === "DATE_BASED" && (
                <Field label="Trigger date">
                  <input
                    required
                    type="date"
                    className={fieldClass}
                    value={triggerDate}
                    onChange={(event) => setTriggerDate(event.target.value)}
                  />
                </Field>
              )}
              {(trigger === "DATE_BASED" || trigger === "BIRTHDAY") && (
                <Field label="Limit to segment (optional)">
                  <select
                    className={fieldClass}
                    value={triggerSegmentId}
                    onChange={(event) =>
                      setTriggerSegmentId(event.target.value)
                    }
                  >
                    <option value="">All subscribed contacts</option>
                    {lookups.data?.segments.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-text-secondary">
                  Sequence steps
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSteps((current) => [
                      ...current,
                      { action: "WAIT", delayMinutes: 0 },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Step
                </Button>
              </div>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="grid items-end gap-2 rounded-xl border border-border-subtle p-3 md:grid-cols-[70px_1fr_140px_1fr_auto]"
                  >
                    <div className="pb-2 text-xs font-semibold text-text-tertiary">
                      Step {index + 1}
                    </div>
                    <Field label="Action">
                      <select
                        className={fieldClass}
                        value={step.action}
                        onChange={(event) =>
                          updateStep(index, {
                            action: event.target.value as Action,
                            templateId: undefined,
                            tagId: undefined,
                          })
                        }
                      >
                        <option value="SEND_EMAIL">Send email</option>
                        <option value="WAIT">Wait</option>
                        <option value="ADD_TAG">Add tag</option>
                        <option value="REMOVE_TAG">Remove tag</option>
                        <option value="END">End sequence</option>
                      </select>
                    </Field>
                    <Field label="Delay (minutes)">
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={step.delayMinutes}
                        onChange={(event) =>
                          updateStep(index, {
                            delayMinutes: Number(event.target.value),
                          })
                        }
                      />
                    </Field>
                    <div>
                      {step.action === "SEND_EMAIL" && (
                        <Field label="Template">
                          <select
                            required
                            className={fieldClass}
                            value={step.templateId ?? ""}
                            onChange={(event) =>
                              updateStep(index, {
                                templateId: event.target.value,
                              })
                            }
                          >
                            <option value="">Select template</option>
                            {lookups.data?.templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      {(step.action === "ADD_TAG" ||
                        step.action === "REMOVE_TAG") && (
                        <Field label="Tag">
                          <select
                            required
                            className={fieldClass}
                            value={step.tagId ?? ""}
                            onChange={(event) =>
                              updateStep(index, { tagId: event.target.value })
                            }
                          >
                            <option value="">Select tag</option>
                            {lookups.data?.tags.map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                    </div>
                    <button
                      title="Remove step"
                      disabled={steps.length === 1}
                      onClick={() =>
                        setSteps((current) =>
                          current.filter((_, stepIndex) => stepIndex !== index),
                        )
                      }
                      className="mb-1 rounded-lg p-2 text-text-tertiary hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={!name || create.isPending} onClick={save}>
                {create.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{" "}
                Save automation
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
            {create.error && (
              <p className="text-xs text-red-500">{create.error.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {!automations.data?.length ? (
        <EmptyState
          title="No automations"
          detail="Create a contact-triggered or date-based email sequence."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {automations.data.map((automation) => (
            <Card key={automation.id} className="hover:translate-y-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2 text-violet-500">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">
                        {automation.name}
                      </p>
                      <StatusBadge value={automation.status} />
                    </div>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {automation.trigger.replaceAll("_", " ")} ·{" "}
                      {automation.steps.length} steps ·{" "}
                      {automation._count.enrollments} enrollments
                    </p>
                    {automation.description && (
                      <p className="mt-2 text-xs text-text-secondary">
                        {automation.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggle.mutate({
                          id: automation.id,
                          active: automation.status !== "ACTIVE",
                        })
                      }
                    >
                      {automation.status === "ACTIVE" ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      {automation.status === "ACTIVE" ? "Pause" : "Activate"}
                    </Button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-1 border-t border-border-subtle pt-3">
                  {automation.steps.map((step) => (
                    <span
                      key={step.id}
                      className="rounded-full bg-card px-2 py-1 text-[10px] text-text-tertiary"
                    >
                      {step.delayMinutes ? `${step.delayMinutes}m → ` : ""}
                      {step.action.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

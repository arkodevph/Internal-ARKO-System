"use client";

import { Plus, Trash2 } from "lucide-react";
import type {
  BillingStatement,
  DocumentLineItem,
} from "../../lib/documents/schema";
import { formatDocumentAmount } from "../../lib/documents/schema";
import {
  calculateBillingAmounts,
  createBillingStatement,
} from "../../lib/documents/billing";

type TextField = Exclude<
  keyof BillingStatement,
  "milestones" | "currentMilestone"
>;

export default function BillingStatementEditor({
  value,
  onChange,
  disabled,
  lineItems,
  currency,
}: {
  value: BillingStatement;
  onChange: (value: BillingStatement) => void;
  disabled: boolean;
  lineItems: DocumentLineItem[];
  currency?: string;
}) {
  const amounts = calculateBillingAmounts(value, lineItems);
  const percentageTotal = value.milestones.reduce(
    (sum, milestone) => sum + milestone.percentage,
    0,
  );
  const field = (
    name: TextField,
    label: string,
    multiline = false,
    placeholder?: string,
  ) => (
    <label key={name} className="block text-xs">
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value[name]}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, [name]: event.target.value })
          }
          className="mt-1 w-full rounded border bg-background p-2"
        />
      ) : (
        <input
          value={value[name]}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, [name]: event.target.value })
          }
          className="mt-1 w-full rounded border bg-background p-2"
        />
      )}
    </label>
  );

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">
          Billing statement details
        </legend>
        {field("projectName", "Project name on statement")}
        {field("developmentTeam", "Development team")}
        <div className="grid gap-3 sm:grid-cols-2">
          {field("status", "Statement status")}
          {field("contactPerson", "Client contact person")}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">Payment schedule</legend>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const defaults = createBillingStatement(value.projectName);
            onChange({
              ...value,
              milestones: defaults.milestones,
              currentMilestone: 0,
              milestoneDescription:
                value.milestoneDescription || defaults.milestoneDescription,
              allocationNotes:
                value.allocationNotes || defaults.allocationNotes,
            });
          }}
          className="rounded border px-2 py-1.5 text-xs disabled:opacity-30"
        >
          Use 40% / 30% / 30% schedule
        </button>
        <p className="text-xs text-muted-foreground">
          Line items below make up the total project fee. Each payment is
          calculated from its percentage.
        </p>
        <label className="block text-xs">
          Payment requested in this statement
          <select
            value={value.currentMilestone}
            disabled={disabled || !value.milestones.length}
            onChange={(event) => {
              const currentMilestone = Number(event.target.value);
              onChange({
                ...value,
                currentMilestone,
                milestones: value.milestones.map((milestone, index) => ({
                  ...milestone,
                  status:
                    milestone.status === "Paid"
                      ? "Paid"
                      : index === currentMilestone
                        ? "Due"
                        : "Upcoming",
                })),
              });
            }}
            className="mt-1 w-full rounded border bg-background p-2"
          >
            {value.milestones.map((milestone, index) => (
              <option
                key={index}
                value={index}
                disabled={milestone.status === "Paid"}
              >
                {milestone.title || `Milestone ${index + 1}`} —{" "}
                {milestone.percentage}%
              </option>
            ))}
          </select>
        </label>
        {value.milestones.map((milestone, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_5rem_2rem] gap-2 rounded border bg-muted/20 p-2"
          >
            <label className="min-w-0 text-xs">
              Milestone
              <input
                value={milestone.title}
                aria-label={`Payment milestone ${index + 1} name`}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...value,
                    milestones: value.milestones.map((item, i) =>
                      i === index
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  })
                }
                className="mt-1 w-full rounded border bg-background p-2"
              />
            </label>
            <label className="text-xs">
              Percent
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                aria-label={`Payment milestone ${index + 1} percentage`}
                value={milestone.percentage}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...value,
                    milestones: value.milestones.map((item, i) =>
                      i === index
                        ? { ...item, percentage: Number(event.target.value) }
                        : item,
                    ),
                  })
                }
                className="mt-1 w-full rounded border bg-background p-2"
              />
            </label>
            <button
              type="button"
              aria-label={`Remove payment milestone ${index + 1}`}
              disabled={disabled || value.milestones.length <= 1}
              onClick={() => {
                const currentMilestone =
                  value.currentMilestone > index
                    ? value.currentMilestone - 1
                    : value.currentMilestone === index
                      ? 0
                      : value.currentMilestone;
                const milestones = value.milestones
                  .filter((_, i) => i !== index)
                  .map((item, i) => ({
                    ...item,
                    status:
                      item.status === "Paid"
                        ? ("Paid" as const)
                        : i === currentMilestone
                          ? ("Due" as const)
                          : ("Upcoming" as const),
                  }));
                onChange({ ...value, currentMilestone, milestones });
              }}
              className="self-center text-muted-foreground disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <label className="text-xs">
              Status
              <select
                value={milestone.status}
                aria-label={`Payment milestone ${index + 1} status`}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...value,
                    milestones: value.milestones.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            status: event.target
                              .value as typeof milestone.status,
                          }
                        : item,
                    ),
                  })
                }
                className="mt-1 w-full rounded border bg-background p-2"
              >
                <option value="Due">Due</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Paid">Paid</option>
              </select>
            </label>
            <span className="col-span-2 self-end pb-2 text-right text-xs font-semibold">
              {formatDocumentAmount(amounts.amounts[index], currency)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs ${Math.abs(percentageTotal - 100) > 0.000001 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {percentageTotal}% of 100% allocated
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                milestones: [
                  ...value.milestones,
                  { title: "", percentage: 0, status: "Upcoming" },
                ],
              })
            }
            className="flex items-center gap-1 rounded border px-2 py-1.5 text-xs disabled:opacity-30"
          >
            <Plus className="h-3 w-3" />
            Add milestone
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
          <dt>Total project fee</dt>
          <dd className="text-right font-semibold">
            {formatDocumentAmount(amounts.total, currency)}
          </dd>
          <dt>Current amount due</dt>
          <dd className="text-right font-semibold text-primary">
            {formatDocumentAmount(amounts.amountDue, currency)}
          </dd>
          <dt>Balance after payment</dt>
          <dd className="text-right font-semibold">
            {formatDocumentAmount(amounts.remaining, currency)}
          </dd>
        </dl>
        {field("milestoneDescription", "Payment milestone explanation", true)}
        {field(
          "allocationNotes",
          "What this payment covers (one item per line)",
          true,
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">Payment details</legend>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const defaults = createBillingStatement(value.projectName);
            onChange({
              ...value,
              paymentMethod: defaults.paymentMethod,
              accountName: defaults.accountName,
              accountNumber: defaults.accountNumber,
              confirmationEmail: defaults.confirmationEmail,
            });
          }}
          className="rounded border px-2 py-1.5 text-xs disabled:opacity-30"
        >
          Use ARKO payment details
        </button>
        {field("paymentMethod", "Payment method / bank")}
        {field("accountName", "Account name")}
        {field("accountNumber", "Account number")}
        {field(
          "paymentReference",
          "Payment reference",
          false,
          "Generated from project and selected milestone",
        )}
        {field("confirmationEmail", "Payment confirmation email")}
      </fieldset>
      {field("billingNotes", "Billing notes (one item per line)", true)}
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">Issued by</legend>
        {field("issuerName", "Issuer / team name")}
        {field("issuerDescription", "Team description")}
        {field("issuerRepresentative", "Representative")}
        {field("issuerContact", "Contact details")}
      </fieldset>
    </div>
  );
}

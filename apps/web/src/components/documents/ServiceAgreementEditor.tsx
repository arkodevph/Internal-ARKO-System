"use client";

import type { ServiceAgreement } from "../../lib/documents/schema";

export default function ServiceAgreementEditor({
  value,
  onChange,
  disabled,
}: {
  value: ServiceAgreement;
  onChange: (value: ServiceAgreement) => void;
  disabled: boolean;
}) {
  const field = (
    name: keyof ServiceAgreement,
    label: string,
    type = "text",
  ) => (
    <label key={name} className="block text-xs">
      {label}
      <input
        type={type}
        value={value[name]}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, [name]: event.target.value })}
        className="mt-1 w-full rounded border bg-background p-2"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">
          Agreement details
        </legend>
        {field("projectName", "Project name on agreement")}
        {field("developmentTeam", "Development team")}
      </fieldset>
      <fieldset className="space-y-3 rounded border p-3">
        <legend className="px-1 text-xs font-semibold">Signatures</legend>
        {field("clientSignature", "Client signature / name")}
        {field("clientSignedDate", "Client signature date", "date")}
        {field("representativeName", "Arko Dev representative")}
        {field(
          "representativeSignedDate",
          "Representative signature date",
          "date",
        )}
      </fieldset>
    </div>
  );
}

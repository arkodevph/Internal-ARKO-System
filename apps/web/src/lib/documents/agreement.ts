import type { DocumentContent, ServiceAgreement } from "./schema";

export function createServiceAgreement(projectName: string): ServiceAgreement {
  return {
    projectName,
    developmentTeam: "ARKO Team",
    representativeName: "Rovic James P. Somontina",
    clientSignature: "",
    clientSignedDate: "",
    representativeSignedDate: "",
  };
}

// Older agreements keep their authored clauses; only missing metadata is filled.
export function getServiceAgreement(
  content: DocumentContent,
  projectName?: string | null,
): ServiceAgreement {
  return content.serviceAgreement ?? createServiceAgreement(projectName || "");
}

export function formatAgreementDate(value?: Date | string | null): string {
  if (!value) return "";
  // Date-only fields should not move to the previous day in western time zones.
  const date =
    value instanceof Date
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
        );
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

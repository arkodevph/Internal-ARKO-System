import type {
  BillingStatement,
  DocumentContent,
  DocumentLineItem,
} from "./schema";

export const BILLING_NOTICE =
  "This document serves as a billing statement/payment request for agreed software development services and is not represented as an official tax invoice or official receipt.";

export function createBillingStatement(projectName: string): BillingStatement {
  return {
    projectName,
    developmentTeam: "ARKO Team — Independent Development Team",
    status: "Payment Request",
    contactPerson: "",
    currentMilestone: 0,
    milestones: [
      { title: "Upfront Deposit", percentage: 40, status: "Due" },
      { title: "Development Milestone", percentage: 30, status: "Upcoming" },
      { title: "Final Payment", percentage: 30, status: "Upcoming" },
    ],
    milestoneDescription:
      "This payment is required before official development begins and allows ARKO Team to allocate:",
    allocationNotes:
      "Development time\nTeam resources\nProject capacity\nDevelopment tools\nTechnical setup",
    paymentMethod: "Bank Transfer / Mari Bank",
    accountName: "JUSTINE CANE BACURIN",
    accountNumber: "12999729704",
    paymentReference: "",
    confirmationEmail: "hello@arkodevph.com",
    billingNotes:
      "The project fee applies strictly to approved scope, features, integrations, and deliverables.\nThird-party expenses such as hosting, domain fees, payment gateways, APIs, SMS, email services, AI usage, subscriptions, and licenses are not included.\nAdditional development outside the approved scope will be quoted separately.",
    issuerName: "ARKO Dev Team",
    issuerDescription: "Independent Development Team",
    issuerRepresentative: "Rovic James P. Somontina",
    issuerContact: "Rovicsom@gmail.com / hello@arkodevph.com",
  };
}

// Preserve the full amount of older invoices until their payment split is edited.
export function getBillingStatement(
  content: DocumentContent,
  projectName?: string | null,
): BillingStatement {
  if (content.billingStatement) return content.billingStatement;
  const project =
    content.sections?.find(
      (section) => section.title.toLowerCase() === "project reference",
    )?.body ||
    projectName ||
    "";
  return {
    ...createBillingStatement(project),
    contactPerson: content.billTo?.name || "",
    milestones: [{ title: "Project Payment", percentage: 100, status: "Due" }],
    milestoneDescription: "",
    allocationNotes: "",
    issuerName:
      content.from?.name && !/\[ADD/i.test(content.from.name)
        ? content.from.name
        : "ARKO Dev Team",
    issuerContact: content.from?.email || "hello@arkodevph.com",
    issuerRepresentative: "",
    paymentMethod: "",
    accountName: "",
    accountNumber: "",
  };
}

export function calculateBillingAmounts(
  billing: BillingStatement,
  lineItems: DocumentLineItem[],
) {
  const total =
    Math.round(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) *
        100,
    ) / 100;
  // Round cumulative installments so the split equals the fee, even for tiny
  // amounts where rounding each installment separately could overcharge.
  let percentage = 0;
  let allocatedCents = 0;
  const amounts = billing.milestones.map((item) => {
    percentage += item.percentage;
    const cumulativeCents = Math.round(total * percentage);
    const amount = (cumulativeCents - allocatedCents) / 100;
    allocatedCents = cumulativeCents;
    return amount;
  });
  const paid = billing.milestones.reduce(
    (sum, item, index) => sum + (item.status === "Paid" ? amounts[index] : 0),
    0,
  );
  const current = billing.milestones[billing.currentMilestone];
  const amountDue =
    current?.status === "Paid" ? 0 : amounts[billing.currentMilestone] || 0;
  return {
    total,
    amounts,
    paid,
    amountDue,
    remaining: Math.max(0, Math.round((total - paid - amountDue) * 100) / 100),
  };
}

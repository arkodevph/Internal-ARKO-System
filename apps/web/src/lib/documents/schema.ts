import { z } from "zod";

const partySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

const documentSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const timelineEventSchema = z.object({
  title: z.string(),
  date: z.string().nullable().optional(),
  status: z.string(),
  description: z.string().nullable().optional(),
  dependency: z.string().optional(),
  approval: z.string().optional(),
});

export const documentContentSchema = z.object({
  currency: z.string().trim().toUpperCase().optional(),
  from: partySchema.optional(),
  billTo: partySchema.optional(),
  summary: z.string().optional(),
  terms: z.string().optional(),
  legalNotice: z.string().optional(),
  sections: z.array(documentSectionSchema).optional(),
  timelineEvents: z.array(timelineEventSchema).optional(),
});

export type DocumentContent = z.infer<typeof documentContentSchema>;
export type DocumentType = "INVOICE" | "AGREEMENT" | "PROPOSAL" | "TIMELINE";

export type DocumentLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
};

export function parseDocumentContent(value: unknown): DocumentContent {
  const result = documentContentSchema.safeParse(value);
  return result.success ? result.data : {};
}

export function formatDocumentAmount(
  amount: number,
  currency?: string,
): string {
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [currency not set]`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function validateDocumentForPublish(input: {
  type: DocumentType;
  title: string;
  content: DocumentContent;
  lineItems: DocumentLineItem[];
  issueDate?: Date | string | null;
  dueDate?: Date | string | null;
}): string[] {
  const errors: string[] = [];
  const { type, title, content, lineItems } = input;

  if (!title.trim()) errors.push("Add a document title.");
  if (!content.from?.name?.trim())
    errors.push("Add the provider or business name.");
  if (!content.billTo?.name?.trim() && !content.billTo?.email?.trim()) {
    errors.push("Add the client name or email.");
  }
  if (!content.summary?.trim()) errors.push("Add a document summary.");

  const unresolvedText = JSON.stringify(content);
  if (/\[ADD(?: [^\]]+)?\]/i.test(unresolvedText)) {
    errors.push("Replace every [ADD …] placeholder before publishing.");
  }

  if (type === "INVOICE" || type === "PROPOSAL") {
    if (!content.currency || !/^[A-Z]{3}$/.test(content.currency)) {
      errors.push("Set a three-letter currency code, such as PHP or USD.");
    }
    if (lineItems.length === 0) errors.push("Add at least one line item.");
    if (
      lineItems.some(
        (item) =>
          !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0,
      )
    ) {
      errors.push(
        "Each line item needs a description, a quantity above zero, and a non-negative price.",
      );
    }
  }

  if (type === "INVOICE") {
    if (!input.issueDate) errors.push("Set the invoice issue date.");
    if (!input.dueDate) errors.push("Set the invoice due date.");
  }

  if (
    type === "AGREEMENT" &&
    (!content.sections || content.sections.length === 0)
  ) {
    errors.push("Add the agreement sections.");
  }

  if (
    type === "TIMELINE" &&
    (!content.timelineEvents || content.timelineEvents.length === 0)
  ) {
    errors.push("Add at least one timeline milestone.");
  }

  return errors;
}

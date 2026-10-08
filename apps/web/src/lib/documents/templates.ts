import type { DocumentContent, DocumentLineItem, DocumentType } from "./schema";
import { BILLING_NOTICE, createBillingStatement } from "./billing";

export interface DocumentTemplateInput {
  type: DocumentType;
  project: {
    id: string;
    name: string;
    summary?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    milestones?: Array<{
      id: string;
      title: string;
      description?: string | null;
      completed: boolean;
      dueDate?: Date | null;
    }>;
    deliverables?: Array<{
      id: string;
      title: string;
      description?: string | null;
      status: string;
    }>;
  };
  client?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  now?: Date;
}

export interface GeneratedDocumentTemplate {
  title: string;
  content: DocumentContent;
  lineItems: DocumentLineItem[];
  dueDate?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function buildLineItems(
  input: DocumentTemplateInput,
  preferDeliverables = false,
): DocumentLineItem[] {
  const { project } = input;
  const source =
    preferDeliverables && project.deliverables?.length
      ? project.deliverables.map((item) => ({
          title: `Deliverable: ${item.title}`,
          description: item.description,
        }))
      : project.milestones?.length
        ? project.milestones.map((item) => ({
            title: `Milestone: ${item.title}`,
            description: item.description,
          }))
        : (project.deliverables?.map((item) => ({
            title: `Deliverable: ${item.title}`,
            description: item.description,
          })) ?? []);

  if (source.length === 0) {
    return [
      {
        description: `Services for ${project.name}`,
        quantity: 1,
        unitPrice: 0,
        sortOrder: 0,
      },
    ];
  }

  return source.map((item, sortOrder) => ({
    description: `${item.title}${item.description ? ` - ${item.description}` : ""}`,
    quantity: 1,
    unitPrice: 0,
    sortOrder,
  }));
}

export function generateDocumentTemplate(
  input: DocumentTemplateInput,
): GeneratedDocumentTemplate {
  const { type, project, client, now = new Date() } = input;
  const clientName = client?.name?.trim() || "[ADD CLIENT NAME]";
  const clientEmail = client?.email || "";
  const defaultDueDate = new Date(now.getTime() + 30 * DAY_MS);
  const parties = {
    from: { name: "[ADD PROVIDER LEGAL NAME]", email: "", address: "" },
    billTo: { name: clientName, email: clientEmail, address: "" },
  };

  if (type === "INVOICE") {
    return {
      title: `${project.name} Billing Statement`,
      dueDate: defaultDueDate,
      content: {
        ...parties,
        from: {
          name: "ARKO Dev Team",
          email: "hello@arkodevph.com",
          address: "",
        },
        currency: "PHP",
        summary:
          project.summary ||
          `Software development services for ${project.name}.`,
        terms: "",
        legalNotice: BILLING_NOTICE,
        billingStatement: {
          ...createBillingStatement(project.name),
          contactPerson: client?.name || "",
        },
      },
      lineItems: [
        {
          description: `${project.name} — Total Agreed Development Fee`,
          quantity: 1,
          unitPrice: 0,
          sortOrder: 0,
        },
      ],
    };
  }

  if (type === "AGREEMENT") {
    const deliverables = project.deliverables?.length
      ? project.deliverables.map((item) => `• ${item.title}`).join("\n")
      : "[ADD AGREED DELIVERABLES]";

    return {
      title: `Service Agreement - ${project.name}`,
      dueDate: defaultDueDate,
      content: {
        ...parties,
        summary:
          project.summary ||
          `Services for ${project.name}. [ADD AGREEMENT CONTEXT]`,
        legalNotice:
          "Boilerplate only - this document is not legal advice. Have qualified counsel review it before signing.",
        sections: [
          {
            title: "1. Parties and effective date",
            body: `[ADD EFFECTIVE DATE]\nProvider: [ADD PROVIDER LEGAL DETAILS]\nClient: ${clientName}`,
          },
          {
            title: "2. Scope of services",
            body: project.summary || "[ADD AGREED SCOPE OF SERVICES]",
          },
          { title: "3. Deliverables and milestones", body: deliverables },
          {
            title: "4. Responsibilities and approvals",
            body: "[ADD EACH PARTY’S RESPONSIBILITIES, REVIEW WINDOWS, AND APPROVAL PROCESS]",
          },
          {
            title: "5. Fees and payment schedule",
            body: "[ADD FEES, CURRENCY, TAX TREATMENT, PAYMENT SCHEDULE, AND LATE-PAYMENT TERMS]",
          },
          {
            title: "6. Revisions and change requests",
            body: "[ADD INCLUDED REVISION ROUNDS AND CHANGE-CONTROL PROCESS]",
          },
          {
            title: "7. Intellectual property",
            body: "[ADD OWNERSHIP, LICENSING, AND TRANSFER TERMS AFTER LEGAL REVIEW]",
          },
          {
            title: "8. Confidentiality and data handling",
            body: "[ADD CONFIDENTIALITY AND DATA-HANDLING TERMS AFTER LEGAL REVIEW]",
          },
          {
            title: "9. Termination and liability",
            body: "[ADD TERMINATION, WARRANTY, LIABILITY, AND GOVERNING-LAW TERMS AFTER LEGAL REVIEW]",
          },
          {
            title: "10. Signatures",
            body: "Provider name / signature / date: [ADD]\nClient name / signature / date: [ADD]",
          },
        ],
      },
      lineItems: [],
    };
  }

  if (type === "PROPOSAL") {
    const deliverables = project.deliverables?.length
      ? project.deliverables
          .map(
            (item) =>
              `• ${item.title}${item.description ? ` - ${item.description}` : ""}`,
          )
          .join("\n")
      : "[ADD PROPOSED DELIVERABLES]";

    return {
      title: `Proposal - ${project.name}`,
      dueDate: defaultDueDate,
      content: {
        ...parties,
        currency: "",
        summary:
          project.summary ||
          `Proposal for ${project.name}. [ADD PROJECT CONTEXT AND OBJECTIVES]`,
        terms:
          "[ADD PROPOSAL VALIDITY, PAYMENT SCHEDULE, ASSUMPTIONS, AND EXCLUSIONS]",
        sections: [
          {
            title: "Context and objectives",
            body:
              project.summary ||
              "[ADD PROJECT CONTEXT AND MEASURABLE OBJECTIVES]",
          },
          { title: "Proposed deliverables", body: deliverables },
          {
            title: "Approach and schedule",
            body: "[ADD DELIVERY APPROACH, KEY DATES, AND CLIENT REVIEW WINDOWS]",
          },
          {
            title: "Assumptions and exclusions",
            body: "[ADD ASSUMPTIONS, DEPENDENCIES, AND OUT-OF-SCOPE ITEMS]",
          },
          { title: "Approval", body: "Client name / signature / date: [ADD]" },
        ],
      },
      lineItems: buildLineItems(input, true),
    };
  }

  const timelineEvents = (project.milestones || []).map((milestone) => ({
    title: milestone.title,
    date: milestone.dueDate
      ? new Date(milestone.dueDate).toISOString().split("T")[0]
      : null,
    status: milestone.completed ? "COMPLETED" : "NOT_STARTED",
    description: milestone.description,
    dependency: "",
    approval: "[ADD CLIENT APPROVAL / SIGN-OFF REQUIREMENT]",
  }));

  return {
    title: `Project Timeline - ${project.name}`,
    dueDate: project.dueDate ? new Date(project.dueDate) : defaultDueDate,
    content: {
      ...parties,
      summary:
        project.summary ||
        `Milestone schedule for ${project.name}. [ADD TIMELINE SUMMARY]`,
      terms:
        "[ADD SCHEDULING ASSUMPTIONS, CLIENT FEEDBACK WINDOWS, AND CHANGE PROCESS]",
      timelineEvents,
      sections: [
        {
          title: "Schedule window",
          body: `Start: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : "[ADD START DATE]"}\nTarget completion: ${project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "[ADD TARGET DATE]"}`,
        },
      ],
    },
    lineItems: [],
  };
}

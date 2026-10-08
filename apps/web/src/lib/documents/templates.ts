import type { DocumentContent, DocumentLineItem, DocumentType } from "./schema";
import { BILLING_NOTICE, createBillingStatement } from "./billing";
import { createServiceAgreement, formatAgreementDate } from "./agreement";

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
      ? project.deliverables
          .map(
            (item) =>
              `${item.title}${item.description ? ` (${item.description})` : ""}`,
          )
          .join("\n\n")
      : "";

    return {
      title: `Service Agreement - ${project.name}`,
      dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
      content: {
        ...parties,
        from: { name: "Arko Dev", email: "hello@arkodevph.com", address: "" },
        summary: `Arko Dev agrees to provide the services described below to ${clientName}.`,
        serviceAgreement: createServiceAgreement(project.name),
        legalNotice: `This Agreement is a plain-language working record for ${project.name} based on Arko Dev’s standard client agreement format.`,
        sections: [
          {
            title: "1. Scope of work",
            body: [
              project.summary || "[ADD AGREED SCOPE OF WORK]",
              deliverables,
              "Full scope details are outlined in the accompanying Project Brief, which forms part of this Agreement.",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
          {
            title: "2. Timeline",
            body: `Target delivery: ${formatAgreementDate(project.dueDate) || "[ADD TARGET DELIVERY DATE]"}, subject to prompt payment, Client inputs, credentials, feedback, stable scope, and no blocking third-party event. Client-caused or external delays may extend the schedule by a reasonable corresponding period.`,
          },
          {
            title: "3. Payment terms",
            body: "Total project cost: PHP [ADD TOTAL PROJECT COST] (fixed for the approved project scope).\n\nPayment schedule: 40% upfront deposit (before development begins) / 30% development milestone (major systems/workflows implemented for review) / 30% final payment (project completed and delivered).\n\nAccepted payment methods: Bank Transfer (Mari Bank).\n\nThird-party expenses such as hosting, domains, databases, payment-provider fees, SMS, email, authentication, AI/LLM usage, APIs, and CRM/Trello subscriptions are not included in the project fee.",
          },
          {
            title: "4. Revisions",
            body: "Minor text, layout, and behavior corrections to agreed functionality are treated as normal revisions during the development phase. New modules, roles, dashboards, major pages, integrations, automations, reports, workflows, redesigns, or other significant changes are additional scope and will be quoted separately via a Change Request, with the timeline adjusted after Client approval.\n\nRecurring maintenance is not included in the fixed fee. Post-delivery assistance is available through a separately approved pay-per-fix quotation or hourly arrangement — there is no required in-scope warranty period beyond correction of confirmed in-scope defects identified during the agreed development process.",
          },
          {
            title: "5. Intellectual property",
            body: `Upon full and final payment, ownership of custom software developed specifically for ${project.name} transfers to the Client, subject to third-party licenses. Prior to full payment, all work remains the property of Arko Dev.\n\nArko Team retains pre-existing software, reusable components, internal tools, methods, general techniques, non-client-specific utilities, and open-source material under its original licenses.\n\nHandover, once all agreed payments are completed, may include source code, repository access, deployment information, environment-variable references, database structure/migrations, setup documentation, and integration configuration. Arko Dev retains the right to showcase the completed work in its portfolio, case studies, and marketing materials, unless otherwise agreed in writing.`,
          },
          {
            title: "6. Confidentiality",
            body: "Both parties agree to keep confidential all shared business information, credentials (including but not limited to logins, API keys, hosting/domain access, and admin panel access), and materials exchanged during the course of this project (including project files, business processes, pricing, and customer data), and shall not disclose them to third parties without prior written consent.\n\nThis obligation shall remain in effect for the duration of this Agreement and shall continue for 6 months after the Agreement is terminated, whether through project cancellation or transfer to another developer/team.\n\nThis confidentiality obligation shall not apply to information that is publicly available, already known to the receiving party prior to disclosure, or independently developed without reference to the disclosing party’s confidential information.\n\nIn the event of a breach of this confidentiality clause, the breaching party shall be liable for any damages, losses, or legal costs incurred as a result of the unauthorized disclosure, and the non-breaching party reserves the right to pursue appropriate legal remedies.",
          },
          {
            title: "7. Responsibilities",
            body: `Client: pay agreed milestones and third-party expenses; provide branding, content, service/pricing information, onboarding requirements, documents, provider accounts, credentials, and domain/DNS access; give timely feedback, approvals, and decisions; determine applicable privacy, consent, and data-handling legal requirements; maintain security for Client-controlled accounts.\n\nArko Team: build ${project.name} per approved scope using reasonable development practices; implement the agreed workflow, communicate reasonably, test major functions, and correct confirmed in-scope defects; protect supplied credentials and customer information with reasonable care; notify the Client when a request materially exceeds approved scope. Arko Team promises software functionality, not employment, revenue, customer acquisition, or other business outcomes.`,
          },
          {
            title: "8. External-platform and business limitations",
            body: "Arko Team is not responsible for outages, API changes, rate limits, pricing changes, account delays or suspensions, geographic restrictions, or other problems outside its reasonable control. Substantial replacement or adaptation work required by third-party changes may require additional payment. The platform does not guarantee employment, interview placement, customer acquisition, revenue, or profitability.",
          },
          {
            title: "9. Pause and uncontrollable events",
            body: "Arko Team may pause work when payment is overdue, required information or access is missing, a necessary Client decision is unresolved, or progress would require unapproved additional scope; the delivery date may move accordingly. Neither party is in breach for delays caused by major outages, natural disasters, government restrictions, infrastructure failures, or other events reasonably outside its control, provided material delays are communicated where practical.",
          },
          {
            title: "10. Cancellation",
            body: "Either party may terminate this agreement with 7–14 days written notice. Billing and refund eligibility upon termination will be handled according to Arko Dev’s Refund Policy, based on the project stage at the time of termination. Work already completed or substantially performed remains payable; the deposit covers reserved capacity and commenced work. Any outstanding fees for work completed are due within 7–14 days of the termination date.",
          },
          {
            title: "11. Signatures",
            body: "This document serves as a service agreement between Arko Dev and the Client for the project described above.",
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

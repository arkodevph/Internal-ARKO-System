import { describe, it, expect } from "@jest/globals";
import { generateDocumentTemplate } from "../documents/templates";
import { validateDocumentForPublish } from "../documents/schema";

describe("generateDocumentTemplate", () => {
  const sampleProject = {
    id: "proj-1",
    name: "Mobile App Redesign",
    summary: "Complete iOS and Android app overhaul",
    startDate: new Date("2026-08-01"),
    dueDate: new Date("2026-10-01"),
    milestones: [
      {
        id: "m1",
        title: "Design System",
        description: "Figma components",
        completed: true,
        dueDate: new Date("2026-08-15"),
      },
      {
        id: "m2",
        title: "API Integration",
        description: "tRPC backend endpoints",
        completed: false,
        dueDate: new Date("2026-09-01"),
      },
    ],
    deliverables: [
      {
        id: "d1",
        title: "Figma UI Kit",
        description: "Design tokens & components",
        status: "APPROVED",
      },
    ],
  };

  const sampleClient = {
    id: "client-1",
    name: "Acme Corp",
    email: "client@acme.com",
  };

  it("generates a valid Invoice template from milestones", () => {
    const doc = generateDocumentTemplate({
      type: "INVOICE",
      project: sampleProject,
      client: sampleClient,
    });

    expect(doc.title).toBe("Invoice - Mobile App Redesign");
    expect(doc.content.billTo?.name).toBe("Acme Corp");
    expect(doc.content.billTo?.email).toBe("client@acme.com");
    expect(doc.lineItems).toHaveLength(2);
    expect(doc.lineItems[0].description).toContain("Milestone: Design System");
    expect(doc.lineItems.every((item) => item.unitPrice === 0)).toBe(true);
    expect(doc.content.currency).toBe("");
    expect(doc.content.terms).toContain("[ADD");
  });

  it("generates a valid Agreement template with legal sections", () => {
    const doc = generateDocumentTemplate({
      type: "AGREEMENT",
      project: sampleProject,
      client: sampleClient,
    });

    expect(doc.title).toBe("Service Agreement - Mobile App Redesign");
    expect(doc.content.sections).toBeDefined();
    expect(doc.content.sections!.length).toBeGreaterThan(0);
    expect(doc.content.legalNotice).toContain("not legal advice");
    expect(doc.lineItems).toHaveLength(0);
  });

  it("generates a valid Proposal template with pricing deliverables", () => {
    const doc = generateDocumentTemplate({
      type: "PROPOSAL",
      project: sampleProject,
      client: sampleClient,
    });

    expect(doc.title).toBe("Proposal - Mobile App Redesign");
    expect(doc.lineItems).toHaveLength(1);
    expect(doc.lineItems[0].description).toContain("Deliverable: Figma UI Kit");
  });

  it("generates a valid Timeline template with milestone schedule", () => {
    const doc = generateDocumentTemplate({
      type: "TIMELINE",
      project: sampleProject,
      client: sampleClient,
    });

    expect(doc.title).toBe("Project Timeline - Mobile App Redesign");
    expect(doc.content.timelineEvents).toHaveLength(2);
    expect(doc.content.timelineEvents![0].status).toBe("COMPLETED");
    expect(doc.content.timelineEvents![1].status).toBe("NOT_STARTED");
    expect(doc.content.timelineEvents![1].approval).toContain("[ADD");
  });

  it("blocks publishing while required placeholders and currency remain unresolved", () => {
    const doc = generateDocumentTemplate({
      type: "INVOICE",
      project: sampleProject,
      client: sampleClient,
      now: new Date("2026-08-01"),
    });

    const errors = validateDocumentForPublish({
      type: "INVOICE",
      title: doc.title,
      content: doc.content,
      lineItems: doc.lineItems,
      issueDate: new Date("2026-08-01"),
      dueDate: doc.dueDate,
    });

    expect(errors).toContain(
      "Replace every [ADD …] placeholder before publishing.",
    );
    expect(errors).toContain(
      "Set a three-letter currency code, such as PHP or USD.",
    );
  });
});

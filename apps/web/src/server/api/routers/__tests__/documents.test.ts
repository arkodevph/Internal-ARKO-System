import { describe, it, expect, jest } from "@jest/globals";
import { documentsRouter } from "../documents";
import { createBillingStatement } from "../../../../lib/documents/billing";

const mockDate = new Date("2026-08-07");

const ctx = (over: any = {}) => {
  const docs: any[] = over._docs ?? [];
  const projects: any[] = over._projects ?? [
    {
      id: "proj-1",
      name: "Client Portal Redesign",
      ownerId: "u1",
      clientId: "c1",
      client: { id: "c1", name: "Client Corp", email: "client@corp.com" },
      milestones: [
        {
          id: "m1",
          title: "Phase 1",
          description: "Wireframes",
          completed: true,
          dueDate: mockDate,
        },
      ],
      deliverables: [
        {
          id: "d1",
          title: "Figma Specs",
          description: "Design tokens",
          status: "DONE",
        },
      ],
    },
  ];

  return {
    user: { id: over.userId ?? "u1" },
    session: { user: { id: over.userId ?? "u1" } },
    userRole: "USER",
    prisma: {
      clientProject: {
        findFirst: jest
          .fn()
          .mockImplementation(({ where }: any) =>
            Promise.resolve(
              projects.find(
                (p: any) =>
                  p.id === where.id &&
                  (!where.ownerId || p.ownerId === where.ownerId),
              ) ?? null,
            ),
          ),
      },
      document: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }: any) =>
            Promise.resolve(
              docs.filter((d: any) => d.createdById === where.createdById),
            ),
          ),
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.invoiceNumber)
            return Promise.resolve(
              docs.find((d: any) => d.invoiceNumber === where.invoiceNumber) ??
                null,
            );
          if (where?.id)
            return Promise.resolve(
              docs.find((d: any) => d.id === where.id) ?? null,
            );
          if (where?.shareToken)
            return Promise.resolve(
              docs.find((d: any) => d.shareToken === where.shareToken) ?? null,
            );
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          const found = docs.find(
            (d: any) =>
              d.shareToken === where.shareToken && d.status === where.status,
          );
          if (!found) return Promise.resolve(null);
          const { createdById: _createdById, ...safeDocument } = found;
          return Promise.resolve(safeDocument);
        }),
        count: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve(
              docs.filter(
                (d) => d.type === "INVOICE" && d.status === "PUBLISHED",
              ).length,
            ),
          ),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const row = {
            id: "doc-new",
            ...data,
            lineItems: data.lineItems?.create ?? [],
            createdAt: mockDate,
            updatedAt: mockDate,
          };
          docs.push(row);
          return Promise.resolve(row);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const idx = docs.findIndex((d: any) => d.id === where.id);
          if (idx === -1) return Promise.resolve(null);
          const { lineItems, ...fields } = data;
          docs[idx] = {
            ...docs[idx],
            ...fields,
            ...(lineItems ? { lineItems: lineItems.create } : {}),
            updatedAt: mockDate,
          };
          return Promise.resolve(docs[idx]);
        }),
        delete: jest.fn().mockImplementation(({ where }: any) => {
          const idx = docs.findIndex((d: any) => d.id === where.id);
          if (idx === -1) return Promise.resolve(null);
          const [deleted] = docs.splice(idx, 1);
          return Promise.resolve(deleted);
        }),
      },
    },
  } as any;
};

describe("documents router", () => {
  describe("list", () => {
    it("returns documents owned by the caller", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Invoice #1",
            createdById: "u1",
            type: "INVOICE",
            status: "DRAFT",
            lineItems: [],
          },
          {
            id: "doc-2",
            title: "Agreement #1",
            createdById: "u2",
            type: "AGREEMENT",
            status: "PUBLISHED",
            lineItems: [],
          },
        ],
      });

      const res = await documentsRouter.createCaller(c).list();
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe("doc-1");
    });
  });

  describe("create", () => {
    it("auto-fills document from project milestones", async () => {
      const c = ctx();
      const doc = await documentsRouter.createCaller(c).create({
        projectId: "proj-1",
        type: "INVOICE",
      });

      expect(doc.title).toBe("Client Portal Redesign Billing Statement");
      expect(doc.type).toBe("INVOICE");
      expect(doc.status).toBe("DRAFT");
    });

    it("does not create a document for a project owned by another user", async () => {
      const c = ctx({ userId: "u2" });
      await expect(
        documentsRouter
          .createCaller(c)
          .create({ projectId: "proj-1", type: "INVOICE" }),
      ).rejects.toThrow("Client project not found");
    });
  });

  describe("update", () => {
    it("rejects a custom statement number already used by another document", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            type: "INVOICE",
            status: "DRAFT",
            createdById: "u1",
            title: "Draft",
            content: {},
            lineItems: [],
          },
          { id: "doc-2", invoiceNumber: "ARKO-HUNTLY-001", createdById: "u2" },
        ],
      });
      await expect(
        documentsRouter
          .createCaller(c)
          .update({ id: "doc-1", invoiceNumber: "ARKO-HUNTLY-001" }),
      ).rejects.toThrow("This billing statement number is already in use.");
      expect(c.prisma.document.update).not.toHaveBeenCalled();
    });

    it("validates billing edits to published statements even when the status is omitted", async () => {
      const billingStatement = createBillingStatement("Huntly");
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Huntly",
            type: "INVOICE",
            status: "PUBLISHED",
            createdById: "u1",
            issueDate: mockDate,
            dueDate: mockDate,
            content: {
              currency: "PHP",
              summary: "Project development",
              from: { name: "ARKO" },
              billTo: { name: "Huntly" },
              billingStatement,
            },
            lineItems: [
              {
                description: "Development fee",
                quantity: 1,
                unitPrice: 30000,
                sortOrder: 0,
              },
            ],
          },
        ],
      });
      await expect(
        documentsRouter.createCaller(c).update({
          id: "doc-1",
          content: {
            currency: "PHP",
            summary: "Project development",
            from: { name: "ARKO" },
            billTo: { name: "Huntly" },
            billingStatement: {
              ...billingStatement,
              milestones: billingStatement.milestones.map((milestone, index) =>
                index === 0 ? { ...milestone, percentage: 50 } : milestone,
              ),
            },
          },
        }),
      ).rejects.toThrow("Payment milestone percentages must total 100%.");
      expect(c.prisma.document.update).not.toHaveBeenCalled();
    });

    it("saves billing fields and a custom statement number and reloads them", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Huntly",
            type: "INVOICE",
            status: "DRAFT",
            createdById: "u1",
            content: {},
            lineItems: [],
          },
        ],
      });
      const billingStatement = createBillingStatement(
        "Huntly SaaS Initial MVP",
      );
      await documentsRouter.createCaller(c).update({
        id: "doc-1",
        invoiceNumber: "ARKO-HUNTLY-001",
        content: { currency: "PHP", billingStatement },
        lineItems: [
          {
            description: "Total Development Fee",
            quantity: 1,
            unitPrice: 30000,
            sortOrder: 0,
          },
        ],
      });
      const saved = await documentsRouter.createCaller(c).get({ id: "doc-1" });
      expect(saved.invoiceNumber).toBe("ARKO-HUNTLY-001");
      expect((saved.content as any).billingStatement).toEqual(billingStatement);
      expect(saved.lineItems[0].unitPrice).toBe(30000);
    });

    it("saves agreement metadata and its number for the published client view", async () => {
      const content = {
        from: { name: "Arko Dev" },
        billTo: { name: "Client Corp" },
        summary: "Agreed project scope",
        sections: [
          { title: "1. Scope of work", body: "Keep the agreed scope." },
        ],
        serviceAgreement: {
          projectName: "Client Portal Redesign",
          developmentTeam: "ARKO Team",
          representativeName: "Rovic James P. Somontina",
          clientSignature: "Client Representative",
          clientSignedDate: "2026-08-21",
          representativeSignedDate: "2026-08-22",
        },
      };
      const c = ctx({
        _docs: [
          {
            id: "agreement-1",
            title: "Service Agreement",
            type: "AGREEMENT",
            status: "DRAFT",
            createdById: "u1",
            content: {},
            lineItems: [],
            shareToken: "agreement-share-token-1234567890",
          },
        ],
      });
      const caller = documentsRouter.createCaller(c);
      await caller.update({
        id: "agreement-1",
        invoiceNumber: "AGREEMENT-TEST-001",
        content,
        status: "PUBLISHED",
      });
      const shared = await caller.publicGet({
        token: "agreement-share-token-1234567890",
      });
      expect(shared.invoiceNumber).toBe("AGREEMENT-TEST-001");
      expect(shared.content).toEqual(content);
      expect(shared).not.toHaveProperty("createdById");
    });

    it("updates title and assigns invoice number on publish", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Draft Invoice",
            type: "INVOICE",
            status: "DRAFT",
            createdById: "u1",
            issueDate: new Date("2026-08-01"),
            dueDate: new Date("2026-09-01"),
            content: {
              currency: "PHP",
              from: { name: "Arko Studio" },
              billTo: { name: "Client Corp", email: "client@corp.com" },
              summary: "August project work",
              terms: "Due on the stated date.",
            },
            lineItems: [
              {
                description: "Design work",
                quantity: 1,
                unitPrice: 1000,
                sortOrder: 0,
              },
            ],
          },
        ],
      });

      const updated = await documentsRouter.createCaller(c).update({
        id: "doc-1",
        title: "Updated Invoice Title",
        status: "PUBLISHED",
      });

      expect(updated.title).toBe("Updated Invoice Title");
      expect(updated.status).toBe("PUBLISHED");
      expect(updated.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it("persists edited content and line items", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Draft proposal",
            type: "PROPOSAL",
            status: "DRAFT",
            createdById: "u1",
            content: { summary: "Old summary" },
            lineItems: [],
          },
        ],
      });

      await documentsRouter.createCaller(c).update({
        id: "doc-1",
        content: { summary: "New summary", currency: "PHP" },
        lineItems: [
          {
            description: "Prototype",
            quantity: 1,
            unitPrice: 2500,
            sortOrder: 0,
          },
        ],
      });
      const reloaded = await documentsRouter
        .createCaller(c)
        .get({ id: "doc-1" });

      expect(reloaded.content).toEqual({
        summary: "New summary",
        currency: "PHP",
      });
      expect(reloaded.lineItems).toEqual([
        {
          description: "Prototype",
          quantity: 1,
          unitPrice: 2500,
          sortOrder: 0,
        },
      ]);
    });
  });

  describe("delete", () => {
    it("deletes draft document", async () => {
      const c = ctx({
        _docs: [
          { id: "doc-1", title: "Draft", status: "DRAFT", createdById: "u1" },
        ],
      });

      const res = await documentsRouter.createCaller(c).delete({ id: "doc-1" });
      expect(res.success).toBe(true);
    });

    it("rejects deleting published document for normal users", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Published",
            status: "PUBLISHED",
            createdById: "u1",
          },
        ],
      });

      await expect(
        documentsRouter.createCaller(c).delete({ id: "doc-1" }),
      ).rejects.toThrow();
    });
  });

  describe("publicGet", () => {
    it("returns published document by share token without createdById", async () => {
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Shared Proposal",
            status: "PUBLISHED",
            shareToken: "valid-token-123456789012",
            createdById: "u1",
            lineItems: [],
          },
        ],
      });

      const doc = await documentsRouter
        .createCaller(c)
        .publicGet({ token: "valid-token-123456789012" });
      expect(doc.title).toBe("Shared Proposal");
      expect((doc as any).createdById).toBeUndefined();
    });

    it.each(["DRAFT", "ARCHIVED"])(
      "does not expose %s documents",
      async (status) => {
        const c = ctx({
          _docs: [
            {
              id: "doc-draft",
              title: "Private draft",
              status,
              shareToken: "private-token-12345678901",
              createdById: "u1",
              lineItems: [],
            },
          ],
        });

        await expect(
          documentsRouter
            .createCaller(c)
            .publicGet({ token: "private-token-12345678901" }),
        ).rejects.toThrow("Document not found");
      },
    );

    it("invalidates the previous URL when the share token is rotated", async () => {
      const oldToken = "old-share-token-123456789";
      const c = ctx({
        _docs: [
          {
            id: "doc-1",
            title: "Published timeline",
            status: "PUBLISHED",
            shareToken: oldToken,
            createdById: "u1",
            lineItems: [],
          },
        ],
      });

      const result = await documentsRouter
        .createCaller(c)
        .generateShareToken({ id: "doc-1" });
      expect(result.shareToken).not.toBe(oldToken);
      await expect(
        documentsRouter.createCaller(c).publicGet({ token: oldToken }),
      ).rejects.toThrow("Document not found");
    });
  });
});

import { describe, expect, it } from "@jest/globals";
import {
  calculateBillingAmounts,
  createBillingStatement,
  getBillingStatement,
} from "../documents/billing";
import {
  documentContentSchema,
  formatDocumentAmount,
  parseDocumentContent,
  validateDocumentForPublish,
} from "../documents/schema";
import { generateDocumentTemplate } from "../documents/templates";

const fee = [
  {
    description: "Development fee",
    quantity: 1,
    unitPrice: 30000,
    sortOrder: 0,
  },
];

describe("billing statement calculations", () => {
  it("calculates the reference 40/30/30 deposit and balance without counting the project fee twice", () => {
    const amounts = calculateBillingAmounts(
      createBillingStatement("Huntly SaaS Initial MVP"),
      fee,
    );
    expect(amounts).toEqual({
      total: 30000,
      amounts: [12000, 9000, 9000],
      paid: 0,
      amountDue: 12000,
      remaining: 18000,
    });
    expect(formatDocumentAmount(amounts.amountDue, "PHP")).toBe("₱12,000.00");
  });

  it("deducts previously paid installments for the next payment request", () => {
    const billing = createBillingStatement("Huntly");
    billing.milestones[0].status = "Paid";
    billing.currentMilestone = 1;
    billing.milestones[1].status = "Due";
    expect(calculateBillingAmounts(billing, fee)).toMatchObject({
      paid: 12000,
      amountDue: 9000,
      remaining: 9000,
    });
  });

  it("allocates rounding residue so all installments sum to the project fee", () => {
    const amounts = calculateBillingAmounts(createBillingStatement("Project"), [
      { ...fee[0], unitPrice: 100.01 },
    ]);
    expect(amounts.amounts).toEqual([40, 30.01, 30]);
    expect(
      amounts.amounts.reduce((sum, amount) => sum + amount, 0),
    ).toBeCloseTo(amounts.total);
  });

  it("never creates a negative final installment when splitting a small fee", () => {
    const billing = createBillingStatement("Project");
    billing.milestones = Array.from({ length: 4 }, (_, index) => ({
      title: `Payment ${index + 1}`,
      percentage: 25,
      status: "Upcoming" as const,
    }));
    const { amounts } = calculateBillingAmounts(billing, [
      { ...fee[0], unitPrice: 0.02 },
    ]);
    expect(amounts.every((amount) => amount >= 0)).toBe(true);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(0.02);
  });

  it("preserves the full amount and original project of legacy invoices", () => {
    const content = parseDocumentContent({
      summary: "Original work",
      terms: "Original terms",
      sections: [{ title: "Project reference", body: "Original project" }],
    });
    const billing = getBillingStatement(content, "Renamed project");
    expect(billing.projectName).toBe("Original project");
    expect(calculateBillingAmounts(billing, fee).amountDue).toBe(30000);
    expect(content.terms).toBe("Original terms");
  });

  it("never charges a milestone already marked paid", () => {
    const billing = createBillingStatement("Project");
    billing.milestones[0].status = "Paid";
    expect(calculateBillingAmounts(billing, fee).amountDue).toBe(0);
  });
});

describe("billing statement persistence and publication", () => {
  const generated = () =>
    generateDocumentTemplate({
      type: "INVOICE",
      project: { id: "p1", name: "Huntly" },
      client: { id: "c1", name: "Huntly", email: "client@example.com" },
    });
  const input = () => ({
    type: "INVOICE" as const,
    title: "Huntly Billing Statement",
    content: generated().content,
    lineItems: fee,
    issueDate: "2026-08-22",
    dueDate: "2026-09-22",
  });

  it("round-trips all billing fields through the stored document content", () => {
    const content = generated().content;
    expect(
      documentContentSchema.parse(JSON.parse(JSON.stringify(content))),
    ).toEqual(content);
    expect(validateDocumentForPublish(input())).toEqual([]);
  });

  it("rejects splits that do not total 100%", () => {
    const data = input();
    data.content.billingStatement!.milestones[0].percentage = 50;
    expect(validateDocumentForPublish(data)).toContain(
      "Payment milestone percentages must total 100%.",
    );
  });

  it.each([3, 100])("rejects missing requested milestone %s", (index) => {
    const data = input();
    data.content.billingStatement!.currentMilestone = index;
    expect(validateDocumentForPublish(data)).toContain(
      "Select an unpaid milestone for this payment request.",
    );
  });

  it("rejects publication until payment details are completed", () => {
    const data = input();
    data.content.billingStatement!.accountNumber = "";
    expect(validateDocumentForPublish(data)).toContain(
      "Complete the payment method, account name, and account number.",
    );
  });

  it("rejects invalid payment percentages at the API schema boundary", () => {
    const content = generated().content;
    content.billingStatement!.milestones[0].percentage = 101;
    expect(documentContentSchema.safeParse(content).success).toBe(false);
  });
});

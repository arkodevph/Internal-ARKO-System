import { describe, expect, it } from "@jest/globals";
import {
  normalizeMarketingEmail,
  renderMarketingTemplate,
  resolveCampaignAudience,
} from "../email-marketing";

describe("email marketing service", () => {
  it("normalizes addresses and renders supported contact variables", () => {
    const contact = {
      email: "person@example.com",
      firstName: "Ari",
      lastName: "Santos",
      company: "ARKO",
      unsubscribeToken: "token",
    };

    expect(normalizeMarketingEmail("  Person@Example.COM ")).toBe(
      "person@example.com",
    );
    expect(
      renderMarketingTemplate(
        "Hi {{ first_name }} {{last_name}} from {{ company }} ({{email}} / {{unknown}})",
        contact,
      ),
    ).toBe("Hi Ari Santos from ARKO (person@example.com / )");
  });

  it("applies include/exclude rules and suppresses ineligible recipients", async () => {
    const db = {
      emailCampaignContact: {
        findMany: async ({ where }: { where: { ruleType: string } }) =>
          where.ruleType === "INCLUDE"
            ? [
                { contactId: "included" },
                { contactId: "excluded" },
                { contactId: "unsubscribed" },
              ]
            : [{ contactId: "excluded" }],
      },
      emailCampaignTag: { findMany: async () => [] },
      emailCampaignSegment: { findMany: async () => [] },
      marketingContact: {
        findMany: async () => [
          {
            id: "included",
            email: "included@example.com",
            firstName: null,
            lastName: null,
            company: null,
            status: "SUBSCRIBED",
            unsubscribeToken: "one",
          },
          {
            id: "unsubscribed",
            email: "unsubscribed@example.com",
            firstName: null,
            lastName: null,
            company: null,
            status: "UNSUBSCRIBED",
            unsubscribeToken: "two",
          },
        ],
      },
      emailSuppression: { findMany: async () => [] },
    };

    const audience = await resolveCampaignAudience(db as never, "campaign");

    expect(audience.contacts.map((contact) => contact.id)).toEqual([
      "included",
    ]);
    expect(audience.counts).toEqual({
      selected: 3,
      excluded: 1,
      suppressed: 1,
      eligible: 1,
    });
  });
});

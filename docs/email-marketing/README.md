# ARKO Email Marketing

Status: Product planning  
Last updated: 2026-08-13

## Purpose

ARKO Email Marketing will rebuild the complete SendFlow product concept as a native module inside the ARKO Internal System.

It will not embed, iframe, or run the existing Laravel SendFlow application beside ARKO. The useful SendFlow concepts and workflows will be redesigned for ARKO's Next.js, Prisma, PostgreSQL, authentication, authorization, notification, and deployment architecture.

## Approved Decisions

- Email Marketing is one company-wide workspace shared by authorized ARKO staff.
- Campaigns can optionally link to an ARKO client or client project.
- Separate workspaces per client are not part of the initial implementation.
- ARKO's existing authentication, users, profiles, and notifications will be reused.
- The module will appear as **Email Marketing** in the ARKO dashboard.
- Administrators have complete control, including sending, scheduling, settings, and deletion.
- Members can manage contacts, templates, campaign drafts, and analytics.
- Only administrators can launch or schedule campaigns initially.
- Implementation will begin only after the product and technical plans are approved.

## Planning Documents

- [Product Scope](./PRODUCT-SCOPE.md)
- [User Experience and Flows](./USER-EXPERIENCE.md)

## Planning Status

| Area                                    | Status   |
| --------------------------------------- | -------- |
| Product ownership                       | Approved |
| Product scope                           | Approved |
| Roles and initial permissions           | Approved |
| Navigation and user experience          | Approved |
| Data model                              | Pending  |
| Email provider architecture             | Pending  |
| Scheduling and background processing    | Pending  |
| Webhook and inbound-email architecture  | Pending  |
| Delivery phases and acceptance criteria | Pending  |

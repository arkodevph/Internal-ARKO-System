# Email Marketing Product Scope

Status: Approved  
Last updated: 2026-08-13

## Product Goal

Create a complete email-marketing workspace inside ARKO using SendFlow's product concept as the foundation. The module should feel and behave like part of ARKO rather than like a separate application.

## Workspace Model

Email Marketing is company-wide. Authorized team members work with the same contacts, templates, campaigns, automations, inbox, and analytics.

A campaign may optionally reference an existing ARKO client or client project. This relationship supports project-specific reporting and organization without creating isolated marketing workspaces.

## Included Capabilities

### Overview

- Total contacts and active subscribers
- Draft, scheduled, sending, and completed campaign counts
- Delivery, bounce, unsubscribe, open, and click rates
- Recent campaigns and replies
- Automation activity
- Delivery failures and configuration warnings
- Quick actions for common workflows

### Audience

- Contact creation, editing, search, filtering, and bulk actions
- Tags and reusable audience segments
- Contact sources
- Subscription and consent tracking
- Contact-level campaign and delivery history
- CSV and XLSX import with mapping and preview
- Duplicate handling through skip, update, or merge behavior
- Filtered export
- Suppression management for unsubscribes, bounces, complaints, and invalid addresses

### Templates

- Template name and internal description
- Email subject and preview text
- HTML email content
- Plain-text fallback
- Personalization variables
- Desktop and mobile preview
- Test sending
- Duplication and archiving
- Template usage history

### Campaigns

- Draft creation and editing
- Optional ARKO client or project association
- Contact, tag, and segment targeting
- Recipient exclusions
- Deduplicated recipient calculation
- Email preview and test send
- Immediate or scheduled delivery
- Final recipient and suppression review
- Administrative send confirmation
- Campaign duplication
- Per-recipient delivery tracking
- Campaign-level analytics

### Automations

- Contact-added trigger
- Tag-added trigger
- Birthday trigger
- Specific-date trigger
- Subscription-confirmed trigger
- Send-email action
- Wait action
- Add-tag action
- Remove-tag action
- End-sequence action
- Contact-level enrollment and execution history
- Pause, resume, retry, and failure visibility

### Inbox

- Marketing replies kept separate from ARKO's internal messages
- Association with a marketing contact
- Campaign association when it can be determined safely
- Unread, done, trash, and all views
- Assignment to an ARKO team member
- Reply, archive, and internal notes
- ARKO notification for new replies

### Delivery Activity

- Queued, sent, delivered, deferred, bounced, complained, failed, opened, and clicked events
- Provider message identifiers
- Failure details suitable for operational troubleshooting
- Idempotent event processing
- Contact suppression updates

### Settings

- Sender identities
- Reply-to addresses
- Sending-domain status
- Provider connection health
- Default campaign settings
- Tracking preferences
- Compliance and footer defaults
- Inbound-email configuration

## Reused ARKO Capabilities

The module will use ARKO's existing:

- Authentication and sessions
- User accounts and profiles
- Role-based authorization
- Notifications
- PostgreSQL database and Prisma data layer
- Next.js dashboard shell and visual system
- Client and client-project records
- Deployment pipeline

SendFlow's separate login, registration, password reset, profile, and notification implementations will not be duplicated.

## Roles and Permissions

### Administrator

- Full read and write access
- Import and export contacts
- Manage suppressions
- Create and activate automations
- Send and schedule campaigns
- Cancel or pause eligible campaign jobs
- Manage sender, provider, domain, webhook, and compliance settings
- Delete records where deletion is safe

### Member

- View overview and analytics
- Manage contacts, tags, segments, and sources
- Manage templates
- Create and edit campaign drafts
- Send test emails
- View campaigns, delivery activity, automations, and inbox
- Cannot launch or schedule a campaign initially
- Cannot change provider or compliance settings

### Other Roles

`USER`, `ACCOUNTANT`, and `CLIENT` receive no Email Marketing access by default. Granular access can be introduced later without changing the company-wide ownership model.

## Safety Requirements

- A campaign must never send to an unsubscribed or suppressed address.
- Recipient addresses must be deduplicated before sending.
- The final eligible-recipient count must be shown before administrative confirmation.
- Starting a send freezes the campaign content and recipient snapshot.
- Provider calls and webhook processing must be idempotent.
- Webhook authenticity must be verified.
- Bounce and complaint events must update suppression state.
- Consent source and timestamp must remain auditable.
- Campaign failures must not incorrectly mark all recipients as sent.
- Retry behavior must not duplicate successful deliveries.

## Initial Non-Goals

- Separate marketing workspaces for every client
- Reusing the Laravel runtime inside ARKO
- Embedding SendFlow through an iframe
- Giving ARKO clients direct campaign-management access
- A fully general-purpose visual workflow engine
- Replacing ARKO's internal team messaging system

# Email Marketing User Experience

Status: Approved  
Last updated: 2026-08-13

## Navigation

The ARKO dashboard sidebar receives one primary item named **Email Marketing**.

The module contains these internal sections:

1. Overview
2. Audience
3. Templates
4. Campaigns
5. Automations
6. Inbox
7. Delivery Activity
8. Settings

The internal navigation should work well on desktop and mobile without adding every subsection to ARKO's main sidebar.

## Overview

The landing view should answer three operational questions immediately:

1. What is scheduled or currently sending?
2. How are recent campaigns performing?
3. Is anything blocked or failing?

The page includes:

- Contact and subscriber totals
- Campaign status summaries
- Delivery and engagement charts
- Recent campaign list
- Recent inbound replies
- Recent automation activity
- Domain, provider, suppression, and delivery warnings
- Quick actions for adding a contact, creating a template, and starting a campaign

## Campaign Creation Flow

Campaign creation uses a five-step guided workflow.

### Step 1: Details

- Campaign name
- Internal description
- Optional ARKO client
- Optional ARKO client project

The client-project selector is constrained by the selected client when both are used.

### Step 2: Content

- Select or create a template
- Sender identity
- Reply-to address
- Subject
- Preview text
- HTML and plain-text content
- Personalization-variable validation
- Desktop and mobile previews

### Step 3: Audience

- Select individual contacts
- Include tags or segments
- Exclude contacts, tags, or segments
- Show total selected, duplicate, unsubscribed, suppressed, invalid, and eligible counts
- Allow inspection of the final eligible audience before continuing

### Step 4: Delivery

- Send now
- Schedule for a date, time, and timezone
- Configure approved tracking preferences
- Send a test email without changing campaign status

### Step 5: Review

- Show sender and reply-to details
- Show content and personalization warnings
- Show audience breakdown and final eligible count
- Show delivery time and timezone
- Require an administrator confirmation before launch or scheduling

## Campaign Lifecycle

Primary progression:

```text
DRAFT -> SCHEDULED -> SENDING -> SENT
```

Additional states:

- `PAUSED`
- `CANCELLED`
- `FAILED`

Once sending begins, the campaign content and recipient snapshot are immutable. Editing after that point requires duplicating the campaign into a new draft.

## Audience Experience

### Contacts List

- Search by email, name, company, or phone
- Filter by status, tag, segment, source, consent, and activity
- Sort and paginate
- Select contacts for bulk tagging, segment membership, subscription changes, export, or safe deletion
- Preserve suppression and delivery history even when a contact is removed from active audience views

### Contact Detail

- Identity and contact information
- Tags, segments, and source
- Subscription status
- Consent source and timestamp
- Suppression reason
- Campaign and automation history
- Delivery and engagement timeline
- Inbound replies and internal notes

### Import

1. Upload CSV or XLSX.
2. Preview detected columns.
3. Map file columns to ARKO contact fields.
4. Choose duplicate behavior: skip, update, or merge.
5. Assign tags, segments, source, and consent metadata.
6. Validate rows before import.
7. Show created, updated, skipped, and failed results.

## Template Experience

- List active and archived templates
- Search and filter by usage
- Create or edit using a focused content workspace
- Preview desktop and mobile rendering
- Validate required personalization variables
- Send a test to one or more authorized addresses
- Duplicate an existing template
- Archive templates without breaking historical campaigns

## Automation Experience

Automation creation uses a guided builder:

1. Name and describe the automation.
2. Select one trigger.
3. Add and order actions and delays.
4. Review eligible contacts and exclusions.
5. Activate after administrative confirmation.

Each enrolled contact receives an independent run. The run shows its current step, next execution time, completed actions, failures, and retries.

Pausing an automation prevents new execution while preserving current enrollment history. The technical plan will decide whether already-due steps pause immediately or finish their current atomic operation.

## Inbox Experience

- Inbox is visually and functionally separate from ARKO internal messages.
- Views include unread, done, trash, and all.
- Messages show sender, subject, received time, linked contact, and linked campaign when available.
- Staff can assign a message, reply, mark done, move to trash, or add an internal note.
- A new inbound reply creates an ARKO notification for the appropriate authorized staff rather than every user.

## Delivery Activity Experience

Delivery activity supports both campaign-level and recipient-level investigation.

Filters include:

- Campaign
- Recipient
- Provider state
- Event type
- Date range
- Failure or suppression reason

The interface must distinguish provider acceptance from actual delivery. A campaign being marked sent must not imply that every recipient received it successfully.

## Empty, Loading, and Failure States

- Every section includes a useful empty state with a relevant next action.
- Long imports and sends show persistent progress rather than relying on one request spinner.
- Provider or domain misconfiguration blocks sending but does not block draft work.
- Partial delivery failures identify affected recipients and safe retry options.
- Destructive actions explain their effect on history and suppressions before confirmation.

## Naming

The user-facing module name is **Email Marketing**. SendFlow is the conceptual source and does not appear as a separate product inside the ARKO interface.

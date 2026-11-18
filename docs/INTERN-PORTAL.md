# Intern portal

The intern workspace is available at `/intern` in the existing `apps/web`
application. It shares ARKO's Auth.js login, database records and messaging
service. It includes Dashboard, My Tasks, Documents, Resources, Messages, Calendar,
Learning Log, Exercises & Studies and Profile.

## Merged learning and admin tools

The remote `feat/intern-portal` implementation is integrated with the existing
project workspace. `/intern` remains the dashboard, and the existing task,
document, resource, message and calendar pages remain available. The shared admin
shell now also links to `/intern/log`, `/intern/studies` and `/intern/profile`.
Learning logs include hours, daily reflections and CSV export; assigned studies
and exercises support drafts, submission and administrator feedback. Profile
fields include school, course, start date and required hours.

The dedicated `/intern/login` page is public. Workspace pages share one protected
route-group layout, allowing INTERN accounts and administrator preview. Both
sign-in forms load a fresh document at `/dashboard`, where the current role
chooses its home. The learning pages use the existing `interns` router; work and
shared services keep the `intern` router. Interns receive only explicitly listed
learning procedures and no staff task permission grants.

Administrators open **Intern Management** at `/dashboard/interns` to inspect
intern records, assign studies/exercises and review logs/submissions. Creating,
changing or deleting intern accounts and assigning intern work remain restricted
to administrators, including when staff have delegated user-management rights.
Staff task-status responses retain their existing assignee/project fields.

Migration `20261107140000_intern_portal` adds the five learning/profile tables.
It precedes the existing sharing migration. For the local database that already
had the INTERN enum and sharing columns applied manually, only the new tables
were created, and both exact migration checksums were recorded after verifying
the existing columns. The incoming migration file was preserved unchanged. No
remote migration was applied.

## Stored documents

Open **Documents** at `/intern/documents` to upload PDF and DOCX files (10 MB
per file, up to 10 files in one selection). Files persist across reloads and
sign-ins. The page supports filename search, file-type filtering, download and
deletion with confirmation. Each account sees its own documents, including when
an administrator previews the intern workspace. Sharing documents with staff or
other interns is not part of this feature.

The upload route streams and caps the request body, verifies PDF/DOCX content,
then stores bytes in the configured S3-compatible bucket. The existing
`FileAttachment` table stores private owner metadata with resource type
`INTERN_DOCUMENT`; no additional database migration is needed. Downloads stream
through an authenticated route and recheck current role/status and ownership.
Write requests require the portal's origin. Interns do not gain access to the
staff Documents generator or general storage API.

Configure the existing `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
`S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` variables. The bucket must exist and
stay private. The repository's Docker Compose MinIO service persists its data
in `miniodata`; its `createbucket` service provisions `arko-attachments` for
local development. The implementation session provisioned only the configured
loopback bucket after verifying it was missing. No remote bucket or hosting was
changed. Uploads use the same origin, so no browser-to-storage CORS setting or
new CSP exception is needed.

Server format checks are basic structural validation, not antivirus scanning.
Failed storage writes do not create file-list entries; a failed metadata save
triggers deletion of the just-uploaded object. The upload throttle allows 20
requests per account per minute in each server process, using the existing
in-memory rate limiter.

Local verification on 2026-11-17 passed all 449 tests / 59 suites and the
production build. Optimized-browser checks cover actual PDF/DOCX uploads,
reload/new-sign-in persistence, byte-identical downloads, owner isolation,
anonymous/cross-origin rejection, invalid-file handling, failed-upload retry,
search/type filtering and confirmed deletion. Both themes and 1440/390/320px
views were checked. Synthetic verification documents and storage objects were
removed; zero test files remain. Screenshots and check metadata are in
`docs/design/intern-portal/documents/`. No remote storage or deployment changed.

## Set up an intern

1. As an administrator, open **Users**, create an account and choose **Intern**.
   An existing account can also be changed to that role. Role changes revoke its
   current session. Intern accounts have a fixed portal access policy; staff
   permission checklists cannot expand it.
2. Assign tasks to the intern through **Tasks & PM**. The intern can see only
   their assignments, add progress comments/work links and submit for review.
   Completion remains with staff through the existing review workflow.
3. In **Resources**, create or edit a resource and enable **Share with interns**.
   Its title, description, URL and category then appear in the intern library.
   Company attachments on that resource are downloadable; personal attachments
   remain private. Resource sharing is checked again before issuing a download
   URL. Issued URLs expire after five minutes and cannot be revoked individually.
4. In **Calendar**, enable **Share with interns** when creating an event, or open
   an existing event and change that checkbox. Shared events and the intern's
   own task deadlines appear in their calendar. Shared resources/events are
   available to all active interns; per-intern resource/event sharing is outside
   this first version.

Intern sign-in redirects from `/dashboard` to `/intern`. Administrators can
preview the portal using **Intern Portal** in the main navigation; the preview
shows the administrator's own task assignments. Intern messages use existing
participant-scoped conversations; new direct conversations can be started with
active ARKO staff. Staff manage group creation. Learning logs record hours; attendance clocks
and DTR forms are not included.

Sign-in always starts a fresh browser document at `/dashboard`, where the server
chooses the account's home: interns go to `/intern`, clients to their client
portal, and administrators/staff to the main dashboard. Sign-out explicitly
returns to `/auth/login` with a fresh document after clearing the session and
pending queries. This prevents a prior account's cached portal redirect from
being reused when another account signs in. The administrator's manual intern
preview remains available.

## Schema and deployment

Migration `20261116000000_intern_portal` adds the `INTERN` enum value and the
`Resource.internShared` / `Event.internShared` booleans. Both sharing flags default
to false, so existing content is not automatically disclosed to interns. Generate
the Prisma client after applying the migration. Deployment follows the existing
manual database migration gate in `DEPLOY-INFRA.md`; the implementation session
applied the additive SQL only to the existing localhost development database.

For an optimized localhost preview, use
`AUTH_TRUST_HOST=true pnpm --filter @arko/web start --hostname 127.0.0.1` after
building. The host-trust setting is scoped to that loopback preview process;
production hosting follows the existing deployment environment configuration.

## Access boundaries

- A central tRPC procedure allowlist limits INTERN accounts to the intern router,
  selected messaging endpoints and self-service profile/session operations.
- Intern task reads and writes enforce the signed-in assignee, including a
  conditional write within the same transaction as a submission comment.
- Interns can move work to TODO, IN_PROGRESS or REVIEW; DONE is rejected.
- Resource, attachment and calendar endpoints apply their own query scopes.
- Main staff dashboards, legacy app bearer sessions, assistant endpoints and
  finance/user-management APIs are unavailable to interns.

## Design and checks

The intern surface uses the same `DashboardShell` and MetricCard components as
the main admin dashboard, with scoped navigation and intern work content. The
shared shell's intern variant disables staff settings, notifications and the
assistant widget/queries. Current screenshots and browser results are under
`docs/design/intern-portal/admin-aligned/`; the parent directory retains the
earlier separate design as history.

Canonical living notebook:
`/home/jaycee/Documents/Obsidian Vault/Projects/ARKO Intern Portal Design Notebook.md`.
It records the accepted scope, research comparison, theme/flow rationale and
actual verification. Captures under `docs/design/intern-portal/` use temporary
local test records; they are not production content or user acceptance evidence.

Run `pnpm --filter @arko/web test -- --runInBand` and
`pnpm --filter @arko/web build`. The intern router suite tests role, API, task,
resource, calendar, messaging and attachment boundaries. Application-session
tests cover exclusion from legacy staff/client sessions.

## Merge verification — 2026-11-18

Integrated remote commit `da5e676` with the saved local project workspace and
Documents implementation. All 487 tests in 62 suites and the final production
build pass. Optimized-browser checks cover all nine intern destinations, the
public intern login, real log save/reload/CSV export, assigned exercise draft /
submission / admin review, both themes, 390/320px layouts, drawer links/Escape,
retained local sign-in, role boundaries and same-browser intern/admin switches.
No browser exceptions or unexpected failed API reads in the completed paced run.
The existing 100 requests/IP/minute guard remains unchanged; an earlier
accelerated run exceeded it, so the final harness paced its requests.

Incoming table wrappers now establish a containing block so screen-reader labels
inside wide tables do not expand the phone page. Tables retain their own
horizontal scroll. The shared five-item phone bar is preserved; learning pages
are available in the drawer and desktop sidebar. All synthetic test records were
removed. Screenshots and the returned check summary are under
`docs/design/intern-portal/merge-20261118/`. Local preview runs independently as
`arko-intern-preview.service` (transient user service; not enabled for boot).
No push, hosted deployment or remote database change was performed.

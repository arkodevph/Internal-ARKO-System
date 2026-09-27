# ARKO architecture (transition state)

The deployed target is six Render web services from one pnpm monorepo, backed by the **same existing Supabase PostgreSQL database**. Separate services do not imply separate databases or code repositories.

| Browser origin | Authentication | Backend |
| --- | --- | --- |
| `finance.arkodevph.com` | Finance-scoped opaque session | Same-origin BFF → `api.arkodevph.com` → Prisma |
| `portal.arkodevph.com` | Client-scoped opaque session | Same-origin BFF → `api.arkodevph.com` → Prisma |
| `pm.arkodevph.com` | PM-scoped opaque session | Same-origin BFF → `api.arkodevph.com` → Prisma |
| `app.arkodevph.com` | Existing Auth.js session | Existing web tRPC/custom routes → Prisma directly |
| `arkodevph.com` | Public | Landing content, views, and chat → API; contact form → Resend |

The central API exposes `/api/identity/login`, `/session`, `/refresh`, `/logout` and bearer-only `/api/trpc`. Login verifies the existing bcrypt password and active account status. Portal sessions require `CLIENT`; finance sessions require `transactions:read`; PM and internal sessions require staff roles. Access tokens expire after 15 minutes, refresh tokens after seven days. Only SHA-256 hashes are stored in `AppSession`. Refresh uses a conditional database update to prevent replay. Password/account revocation increments `User.authVersion`, which invalidates app sessions. Each app's cookies are host-only, HTTP-only, `Secure` in production, and `SameSite=Lax`. Each BFF rejects cross-origin writes. The API enforces a per-app procedure allowlist and the existing per-procedure authorization/ownership checks.

This is **app-specific login, not SSO**. No cross-subdomain cookie is set. The legacy internal Auth.js login is still separate from the central identity sessions; logging out of it no longer globally invalidates the new app sessions. Password changes/account restriction still invalidate all via `authVersion` or status checks.

## Remaining migration seams

- `apps/web` is still one codebase serving both site and internal via `ARKO_SURFACE`. The site middleware exposes only public marketing API routes; its active database operations go through the API, and it does not receive a DB credential on Render. The build still contains legacy internal routes, so this is not hard artifact-level isolation.
- Internal dashboard pages and custom API routes still use Prisma directly. Moving them behind the API requires migrating those route contracts and Auth.js usage, not merely removing `DATABASE_URL`.
- Finance, portal, and PM import existing web UI and the tRPC router **types** from `apps/web`; they do not need database secrets at runtime. Extracting stable UI/contracts into shared packages would remove this build-time coupling.
- The API currently uses in-memory login throttles. They are not shared across replicas. Add a shared rate-limit store/WAF before scaling out or exposing high login traffic. BFF refresh single-flight handles concurrent requests within one process; cross-instance refresh races still need a distributed solution.
- Password reset, external identity providers, MFA, and account-management self-service are not implemented by this change.

The historic Vite/Django/Neon documents under `docs/superpowers` are planning records, not current deployment instructions.

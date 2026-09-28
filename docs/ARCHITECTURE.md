# ARKO architecture

One Render Free web service, `arko`, runs the authenticated `apps/web` system with the existing Supabase PostgreSQL database at `app.arkodevph.com`. A separate Vercel deployment of `apps/web` serves only public marketing pages at `arkodevph.com`. Middleware redirects login and dashboard paths from Vercel to Render; `/` on the Render app opens `/dashboard`. Finance, client portal, PM, and API are routes/modules in the one Render process, not additional Render services. Public Vercel routes use the Render API for landing content, visit tracking, and public chat; the Vercel deployment has no database credentials.

All areas use the existing ARKO users and one Auth.js session on the app hostname. The dashboard requires login. Client users are sent to the portal; finance requires `transactions:read`; PM rejects client and demo roles, and its tRPC router enforces staff roles and task ownership. `apps/web` uses Prisma directly against Supabase.

The `apps/api`, `apps/finance`, `apps/portal`, and `apps/pm` app shells remain in source for now, but the Blueprint declares only `arko`. Removing definitions from a Render Blueprint does not delete their existing services: retire those separately after the new service works. The PM board component and PM tRPC router are imported by `apps/web`. The `AppSession` API routes remain for compatibility but are not used by the unified login.

Free Render services share an instance-hour allowance and spin down after inactivity. Only `arko` should remain active after cutover. The historic Vite/Django/Neon documents under `docs/superpowers` are planning records, not current deployment instructions.

# ARKO architecture

Render runs one `apps/web` Next.js process at `arko-internal.onrender.com`. It serves the public site at `/`, Auth.js login at `/auth/login`, the staff/client dashboard at `/dashboard`, finance at `/dashboard/finance`, the client portal at `/dashboard/client-portal`, the PM board at `/dashboard/pm`, and the shared API at `/api/*`. `/app`, `/finance`, `/portal`, and `/pm` redirect to those dashboard routes.

All areas use the existing ARKO users and one same-origin Auth.js session. The dashboard requires login. Client users are sent to the portal; finance requires `transactions:read`; PM rejects client and demo roles, and its tRPC router enforces staff roles and task ownership. The existing Supabase PostgreSQL database remains the only database, and `apps/web` uses Prisma directly. The API and UI are logical modules, not separate runtime services.

The `apps/api`, `apps/finance`, `apps/portal`, and `apps/pm` app shells from the previous six-service design remain in source. During cutover, their Render services remain declared with auto-deploy off for rollback; CI builds only the unified web app. The PM board component and PM tRPC router are still imported by the unified web app. The `AppSession` API routes remain for compatibility but are not used by the unified login.

Free Render has a shared 750 instance-hour monthly allowance, a 15-minute idle spin-down, and a 512 MB / 0.1 CPU service size. One service reduces instance-hour consumption, but the combined build/runtime still needs measurement under real traffic. The historic Vite/Django/Neon documents under `docs/superpowers` are planning records, not current deployment instructions.

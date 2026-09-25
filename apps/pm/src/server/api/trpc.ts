import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type TRPCContext } from "../../lib/trpc/context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Flat access: three-person team, no roles (PRD). Session is the only gate;
// the review gate lives in the tasks router, not in permissions.
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

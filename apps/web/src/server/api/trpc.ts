import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type TRPCContext } from "../../lib/trpc/context";
import { hasPermission, hasRole, type Permission } from "../../lib/rbac";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const ALLOWED_APP_PROCEDURES: Partial<Record<NonNullable<TRPCContext['application']>, (path: string) => boolean>> = {
  finance: (path) => path.startsWith('finance.') || path === 'users.getProfile',
  portal: (path) => path.startsWith('clientPortal.') || path.startsWith('messages.') ||
    path === 'users.getProfile' || path === 'users.search',
  pm: (path) => path.startsWith('pmTasks.') || path === 'users.getProfile',
}

const enforceAuth = t.middleware(({ ctx, next, path }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const isAllowed = ctx.application && ALLOWED_APP_PROCEDURES[ctx.application]
  if (isAllowed && !isAllowed(path)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'This app cannot access that feature.' })
  }
  if (ctx.userRole === "DEMO") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Demo mode uses sample data and cannot access workspace records.",
    });
  }
  return next({
    ctx: {
      user: ctx.session.user,
      userRole: ctx.userRole,
      userPermissions: ctx.userPermissions,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * Require the authenticated user to have one of the given roles.
 * Usage: requireRole(['ADMIN']) or requireRole(['ADMIN', 'MEMBER'])
 */
export function requireRole(allowedRoles: string[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!hasRole(ctx.userRole as any, allowedRoles as any)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next({
      ctx: {
        user: ctx.session.user,
        userRole: ctx.userRole,
      },
    });
  });
}

export function requirePermission(permission: Permission) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!hasPermission(ctx.userRole, permission, ctx.userPermissions)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next({
      ctx: {
        user: ctx.session.user,
        userRole: ctx.userRole,
        userPermissions: ctx.userPermissions,
      },
    });
  });
}

export function requireRoleOrPermission(
  allowedRoles: string[],
  permission: Permission,
) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const allowedByRole = hasRole(ctx.userRole as any, allowedRoles as any);
    const allowedByPermission = hasPermission(
      ctx.userRole,
      permission,
      ctx.userPermissions,
    );
    if (!allowedByRole && !allowedByPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next({
      ctx: {
        user: ctx.session.user,
        userRole: ctx.userRole,
        userPermissions: ctx.userPermissions,
      },
    });
  });
}

/**
 * Verify that the authenticated user owns a specific resource.
 * `getOwnerId` extracts the owner's userId from the input.
 */
export function requireOwnership(
  getOwnerId: (input: unknown) => string | undefined | null,
) {
  return t.middleware(({ ctx, next, input }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // ADMIN can bypass ownership checks
    if (ctx.userRole === "ADMIN") {
      return next({ ctx: { user: ctx.session.user, userRole: ctx.userRole } });
    }
    const ownerId = getOwnerId(input);
    if (!ownerId || ownerId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not own this resource",
      });
    }
    return next({
      ctx: {
        user: ctx.session.user,
        userRole: ctx.userRole,
      },
    });
  });
}

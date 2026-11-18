import { describe, expect, it, jest } from "@jest/globals";
import { internsRouter } from "../interns";
import { router, protectedProcedure } from "../../trpc";
import { tasksRouter } from "../tasks";
import { usersRouter } from "../users";
const testRouter = router({
  interns: internsRouter,
  tasks: tasksRouter,
  users: usersRouter,
  main: router({ secret: protectedProcedure.query(() => "private") }),
});
const callerFor = (ctx: any) => testRouter.createCaller(ctx).interns;

function context(role = "INTERN") {
  const user = { id: "intern-one" };
  return {
    user,
    session: { user },
    userRole: role,
    prisma: {
      internLearningLog: {
        findMany: jest.fn<any>().mockResolvedValue([]),
        create: jest.fn<any>().mockResolvedValue({}),
        updateMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
      },
      internProfile: { findUnique: jest.fn<any>().mockResolvedValue(null) },
      internActivity: {
        findMany: jest.fn<any>().mockResolvedValue([]),
        findFirst: jest.fn<any>().mockResolvedValue({ id: "study-one" }),
        create: jest.fn<any>(),
      },
      internSubmission: {
        findMany: jest.fn<any>().mockResolvedValue([]),
        updateMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
        upsert: jest.fn<any>().mockResolvedValue({}),
      },
    },
  } as any;
}
const entry = {
  date: "2026-11-07",
  learned: "How to write an accessible form",
  hours: 8,
};

describe("intern portal boundaries and recovery", () => {
  it("does not let interns publish activities or read the admin review queue", async () => {
    const caller = callerFor(context());
    await expect(
      caller.createActivity({
        title: "Study",
        kind: "STUDY",
        description: "Read and practice.",
        assigneeIds: ["intern-one"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reviewQueue()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it.each(["CLIENT", "DEMO", "USER", "MEMBER", "ACCOUNTANT"])(
    "blocks %s accounts from reading intern records",
    async (role) => {
      await expect(callerFor(context(role)).overview()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    },
  );
  it("requires authentication", async () => {
    const ctx = context();
    ctx.session = null;
    await expect(callerFor(ctx).overview()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("reads only the signed-in intern’s private logs and submissions", async () => {
    const ctx = context();
    await callerFor(ctx).overview();
    expect(
      ctx.prisma.internLearningLog.findMany.mock.calls[0][0].where,
    ).toEqual({ userId: "intern-one" });
    expect(ctx.prisma.internSubmission.findMany.mock.calls[0][0].where).toEqual(
      {
        userId: "intern-one",
        activity: { assignments: { some: { userId: "intern-one" } } },
      },
    );
  });
  it("cannot edit or delete another intern’s log", async () => {
    const caller = callerFor(context());
    await expect(
      caller.saveLog({ ...entry, id: "someone-elses-log" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.deleteLog({ id: "someone-elses-log" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("reports duplicate dates without overwriting saved learning", async () => {
    const ctx = context();
    ctx.prisma.internLearningLog.create.mockRejectedValue({ code: "P2002" });
    await expect(callerFor(ctx).saveLog(entry)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(ctx.prisma.internLearningLog.updateMany).not.toHaveBeenCalled();
  });
  it.each([
    { ...entry, date: "2026-02-30" },
    { ...entry, hours: 25 },
    { ...entry, learned: "   " },
  ])("rejects invalid learning entries", async (input) => {
    await expect(callerFor(context()).saveLog(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
  it("keeps a date-only entry at UTC midnight", async () => {
    const ctx = context();
    await callerFor(ctx).saveLog(entry);
    expect(
      ctx.prisma.internLearningLog.create.mock.calls[0][0].data.date.toISOString(),
    ).toBe("2026-11-07T00:00:00.000Z");
  });
  it("does not accept empty or archived activity submissions", async () => {
    const ctx = context();
    const caller = callerFor(ctx);
    await expect(
      caller.saveSubmission({
        activityId: "study-one",
        response: "",
        submit: true,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    ctx.prisma.internActivity.findFirst.mockResolvedValue(null);
    await expect(
      caller.saveSubmission({
        activityId: "archived",
        response: "Notes",
        submit: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(ctx.prisma.internSubmission.upsert).not.toHaveBeenCalled();
  });
  it("blocks main system and task administration even with stale custom permissions", async () => {
    const ctx = context();
    ctx.userPermissions = ["tasks:create", "users:update", "transactions:read"];
    const caller = testRouter.createCaller(ctx);
    await expect(caller.main.secret()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.tasks.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.tasks.create({ title: "Unauthorized", dueDate: new Date() }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.interns.roster()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.interns.internRecord({ userId: "other" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("only returns assigned task fields without related workspace records", async () => {
    const ctx = context();
    ctx.prisma.task = { findMany: jest.fn<any>().mockResolvedValue([]) };
    await callerFor(ctx).tasks();
    expect(ctx.prisma.task.findMany).toHaveBeenCalledWith({
      where: { assigneeId: "intern-one" },
      select: {
        id: true,
        assigneeId: true,
        title: true,
        description: true,
        priority: true,
        dueDate: true,
        status: true,
      },
      orderBy: { position: "asc" },
    });
  });
  it.each([null, "other-intern"])(
    "cannot update an unassigned or other intern's task (%s)",
    async (assigneeId) => {
      const ctx = context();
      ctx.prisma.task = {
        findUnique: jest.fn<any>().mockResolvedValue({ assigneeId }),
        update: jest.fn<any>(),
      };
      ctx.prisma.user = {
        findUnique: jest.fn<any>().mockResolvedValue({ role: "INTERN" }),
      };
      await expect(
        testRouter
          .createCaller(ctx)
          .tasks.updateStatus({ id: "other-task", status: "IN_PROGRESS" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(ctx.prisma.task.update).not.toHaveBeenCalled();
    },
  );
  it("rejects a submission for an activity that was not assigned to this intern", async () => {
    const ctx = context();
    ctx.prisma.internActivity.findFirst.mockResolvedValue(null);
    await expect(
      callerFor(ctx).saveSubmission({
        activityId: "other-activity",
        response: "Notes",
        submit: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(ctx.prisma.internActivity.findFirst).toHaveBeenCalledWith({
      where: {
        id: "other-activity",
        archived: false,
        assignments: { some: { userId: "intern-one" } },
      },
    });
  });
  it("limits intern account management even for staff with delegated user permissions", async () => {
    const ctx = context("MEMBER");
    ctx.userPermissions = ["users:create", "users:update", "users:delete"];
    ctx.prisma.user = {
      findUnique: jest
        .fn<any>()
        .mockResolvedValue({ id: "target", role: "INTERN" }),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
    };
    const caller = testRouter.createCaller(ctx).users;
    await expect(
      caller.create({ name: "New intern", role: "INTERN" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.updateRole({ userId: "target", role: "MEMBER" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.updateAccess({
        userId: "target",
        role: "MEMBER",
        permissions: [],
        canAccess: true,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.updateStatus({ userId: "target", status: "SUSPENDED" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.resetPassword({ userId: "target" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.delete({ userId: "target" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    expect(ctx.prisma.user.delete).not.toHaveBeenCalled();
  });
  it("only lets admins assign work to interns", async () => {
    const ctx = context("MEMBER");
    ctx.prisma.user = {
      findUnique: jest.fn<any>().mockResolvedValue({ role: "INTERN" }),
    };
    await expect(
      testRouter
        .createCaller(ctx)
        .tasks.create({
          title: "Work",
          assigneeId: "other-intern",
          dueDate: new Date(),
        }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("publishes an activity only for the selected active interns", async () => {
    const ctx = context("ADMIN");
    ctx.prisma.user = { count: jest.fn<any>().mockResolvedValue(1) };
    await callerFor(ctx).createActivity({
      title: "Study",
      kind: "STUDY",
      description: "Read and practice",
      assigneeIds: ["selected-intern"],
    });
    expect(ctx.prisma.internActivity.create).toHaveBeenCalledWith({
      data: {
        title: "Study",
        kind: "STUDY",
        description: "Read and practice",
        resourceUrl: "",
        creatorId: "intern-one",
        assignments: { create: [{ userId: "selected-intern" }] },
      },
    });
    ctx.prisma.user.count.mockResolvedValue(0);
    await expect(
      callerFor(ctx).createActivity({
        title: "Study",
        kind: "STUDY",
        description: "Practice",
        assigneeIds: ["inactive-or-non-intern"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects an admin review of a record that changed while being read", async () => {
    await expect(
      callerFor(context("ADMIN")).review({
        id: "changed-log",
        kind: "LOG",
        feedback: "Useful reflection.",
        updatedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rejects executable resource URLs even for administrators", async () => {
    await expect(
      callerFor(context("ADMIN")).createActivity({
        title: "Study",
        kind: "STUDY",
        description: "Read this",
        assigneeIds: ["intern-one"],
        resourceUrl: "javascript:alert(1)",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

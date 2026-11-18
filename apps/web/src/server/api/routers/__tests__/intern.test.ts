import { describe, it, expect, jest } from "@jest/globals";
import { internRouter } from "../intern";
import { tasksRouter } from "../tasks";
import { resourcesRouter } from "../resources";
import { messagesRouter } from "../messages";
import { usersRouter } from "../users";
import { router } from "../../trpc";
import { resolvePermissions } from "../../../../lib/rbac";

jest.mock("../../../../lib/s3", () => ({ s3: {}, S3_BUCKET: "test" }));

function context() {
  const tx = {
    task: { updateMany: jest.fn<any>().mockResolvedValue({ count: 1 }) },
    comment: { create: jest.fn<any>().mockResolvedValue({ id: "comment" }) },
  };
  const prisma = {
    task: {
      findMany: jest.fn<any>().mockResolvedValue([]),
      count: jest.fn<any>().mockResolvedValue(0),
      findFirst: jest.fn<any>().mockResolvedValue(null),
    },
    resource: {
      findMany: jest.fn<any>().mockResolvedValue([]),
      count: jest.fn<any>().mockResolvedValue(0),
      findFirst: jest.fn<any>().mockResolvedValue(null),
    },
    resourceCategory: { findMany: jest.fn<any>().mockResolvedValue([]) },
    comment: { findMany: jest.fn<any>().mockResolvedValue([]) },
    event: { findMany: jest.fn<any>().mockResolvedValue([]) },
    fileAttachment: {
      findFirst: jest.fn<any>().mockResolvedValue(null),
      findMany: jest.fn<any>().mockResolvedValue([]),
      count: jest.fn<any>().mockResolvedValue(0),
    },
    user: {
      findFirst: jest.fn<any>().mockResolvedValue(null),
      findMany: jest.fn<any>().mockResolvedValue([]),
    },
    $transaction: jest.fn<any>().mockImplementation((fn: any) => fn(tx)),
  };
  return {
    session: { user: { id: "intern-1" } },
    user: { id: "intern-1" },
    userRole: "INTERN",
    userPermissions: ["users:update", "tasks:update"],
    prisma,
    tx,
  } as any;
}

const api = router({
  intern: internRouter,
  tasks: tasksRouter,
  resources: resourcesRouter,
  messages: messagesRouter,
  users: usersRouter,
});

describe("intern access boundaries", () => {
  it("keeps document lists and searches within the caller's stored documents", async () => {
    const ctx = context();
    await api.createCaller(ctx).intern.documents({ page: 2, search: "report", kind: "pdf" });
    expect(ctx.prisma.fileAttachment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "intern-1", resourceType: "INTERN_DOCUMENT", scope: "PERSONAL", mimeType: "application/pdf", fileName: { contains: "report", mode: "insensitive" } },
      skip: 20, take: 20,
      select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
    }));
    expect(ctx.prisma.fileAttachment.count).toHaveBeenCalledWith({ where: expect.objectContaining({ userId: "intern-1" }) });
  });
  it("rejects anonymous and non-intern staff access to intern data", async () => {
    const ctx = context();
    await expect(
      api.createCaller({ ...ctx, session: null }).intern.tasks(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      api.createCaller({ ...ctx, userRole: "MEMBER" }).intern.tasks(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(ctx.prisma.task.findMany).not.toHaveBeenCalled();
  });

  it("blocks main-system APIs even with stale custom staff permissions", async () => {
    const ctx = context();
    const caller = api.createCaller(ctx);
    await expect(caller.tasks.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.resources.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.users.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(
      resolvePermissions("INTERN", ["users:update", "transactions:read"]),
    ).toEqual([]);
    expect(ctx.prisma.task.findMany).not.toHaveBeenCalled();
  });

  it("scopes linked tasks and task searches to the signed-in assignee", async () => {
    const ctx = context();
    await api
      .createCaller(ctx)
      .intern.tasks({
        focusId: "someone-elses-task",
        search: "review",
        page: 2,
      });
    expect(ctx.prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "someone-elses-task",
          assigneeId: "intern-1",
        }),
        skip: 20,
      }),
    );
    await expect(
      api
        .createCaller(ctx)
        .intern.taskComments({ taskId: "someone-elses-task" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(ctx.prisma.comment.findMany).not.toHaveBeenCalled();
  });

  it("rejects completion and assignment changes at the API boundary", async () => {
    const ctx = context();
    await expect(
      api
        .createCaller(ctx)
        .intern.updateTask({ id: "task", status: "DONE" } as any),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(ctx.tx.task.updateMany).not.toHaveBeenCalled();
    ctx.tx.task.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      api
        .createCaller(ctx)
        .intern.updateTask({
          id: "task",
          status: "REVIEW",
          comment: "Work link",
        }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(ctx.tx.comment.create).not.toHaveBeenCalled();
  });

  it("writes submissions and updates under the same assignment and review boundary", async () => {
    const ctx = context();
    await api
      .createCaller(ctx)
      .intern.updateTask({
        id: "task",
        status: "REVIEW",
        comment: "  Work submitted  ",
      });
    expect(ctx.tx.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task", assigneeId: "intern-1", status: { not: "DONE" } },
        data: expect.objectContaining({ status: "REVIEW" }),
      }),
    );
    expect(ctx.tx.comment.create).toHaveBeenCalledWith({
      data: {
        resourceType: "TASK",
        resourceId: "task",
        userId: "intern-1",
        content: "Work submitted",
      },
    });
  });

  it("requires explicit sharing for resource queries and category lists", async () => {
    const ctx = context();
    await api
      .createCaller(ctx)
      .intern.resources({ search: "guide", categoryId: "private-category" });
    expect(ctx.prisma.resource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          internShared: true,
          categoryId: "private-category",
        }),
      }),
    );
    expect(ctx.prisma.resourceCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resources: { some: { internShared: true } } },
      }),
    );
  });

  it("rechecks resource sharing before listing files or generating downloads", async () => {
    const ctx = context();
    await expect(
      api.createCaller(ctx).intern.attachments({ resourceId: "unshared" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(ctx.prisma.fileAttachment.findMany).not.toHaveBeenCalled();
    ctx.prisma.fileAttachment.findFirst.mockResolvedValue({
      id: "file",
      resourceId: "unshared",
      fileKey: "key",
    });
    await expect(
      api.createCaller(ctx).intern.download({ id: "file" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(ctx.prisma.fileAttachment.findFirst).toHaveBeenCalledWith({
      where: {
        id: "file",
        resourceType: "RESOURCE",
        scope: "COMPANY",
        resourceId: { not: null },
      },
    });
  });

  it("limits calendar deadlines to the intern and requires shared meetings", async () => {
    const ctx = context();
    await api
      .createCaller(ctx)
      .intern.calendar({
        start: new Date("2026-11-01"),
        end: new Date("2026-12-01"),
      });
    expect(ctx.prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ internShared: true }),
      }),
    );
    expect(ctx.prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assigneeId: "intern-1" }),
      }),
    );
    await expect(
      api
        .createCaller(ctx)
        .intern.calendar({
          start: new Date("2026-01-01"),
          end: new Date("2027-01-01"),
        }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("restricts new conversations and contact search to active staff", async () => {
    const ctx = context();
    await expect(
      api
        .createCaller(ctx)
        .messages.createConversation({ participantId: "client" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api
        .createCaller(ctx)
        .messages.createGroupConversation({
          name: "Bypass",
          participantIds: ["a", "b"],
        }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await api.createCaller(ctx).users.search({ query: "team" });
    expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.any(Object),
            {
              status: "ACTIVE",
              role: { in: ["ADMIN", "MEMBER", "USER", "ACCOUNTANT"] },
            },
          ],
        },
      }),
    );
  });
});

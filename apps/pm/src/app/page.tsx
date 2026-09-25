import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@arko/db";
import { Board } from "@/components/board";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const tasks = await prisma.task.findMany({
    where: { scope: "PERSONAL" },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reviews: {
        select: {
          id: true,
          prLink: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">PM Board</h1>
          <p className="text-sm text-neutral-400">
            Nothing reaches Done without a recorded review.
          </p>
        </div>
        <span className="text-sm text-neutral-500">
          {session.user.name ?? session.user.email}
        </span>
      </header>
      <Board initialTasks={tasks} />
    </main>
  );
}

import { timingSafeEqual } from "node:crypto";
import { prisma } from "@arko/db";
import { syncConnectedClientRequestRepositories } from "../../../../server/services/client-request-github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (
    !secret ||
    !supplied ||
    Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncConnectedClientRequestRepositories(prisma);
  return Response.json(
    { ok: result.failures.length === 0, ...result },
    { status: result.failures.length ? 503 : 200 },
  );
}

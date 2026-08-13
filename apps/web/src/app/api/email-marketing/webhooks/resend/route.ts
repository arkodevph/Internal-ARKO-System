import { prisma } from "@arko/db";
import { Resend } from "resend";
import { recordResendWebhook } from "../../../../../server/services/email-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      { error: "Email webhook is not configured" },
      { status: 503 },
    );

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return Response.json(
      { error: "Missing webhook signature headers" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  try {
    const event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
    const result = await recordResendWebhook(prisma, event, id);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return Response.json({ error: message }, { status: 400 });
  }
}

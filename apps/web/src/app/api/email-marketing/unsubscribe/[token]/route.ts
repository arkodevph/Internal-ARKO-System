import { prisma } from "@arko/db";
import { unsubscribeMarketingContact } from "../../../../../server/services/email-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, message: string, token?: string) {
  const action = token
    ? `<form method="post"><button type="submit">Unsubscribe</button></form>`
    : "";
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#0b1020;color:#f8fafc;font:16px/1.6 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}.card{width:min(520px,calc(100% - 40px));padding:32px;border:1px solid #26324d;border-radius:18px;background:#121a2c;box-shadow:0 20px 60px #0006}h1{margin:0 0 8px;font-size:28px}p{color:#bac5d8}button{border:0;border-radius:10px;background:#e94560;color:white;padding:12px 18px;font-weight:700;cursor:pointer}</style></head><body><main class="card"><h1>${title}</h1><p>${message}</p>${action}</main></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const contact = await prisma.marketingContact.findUnique({
    where: { unsubscribeToken: token },
    select: { status: true },
  });
  if (!contact)
    return page(
      "Link unavailable",
      "This unsubscribe link is invalid or no longer available.",
    );
  if (contact.status === "UNSUBSCRIBED")
    return page(
      "Already unsubscribed",
      "This address is already unsubscribed from ARKO marketing emails.",
    );
  return page(
    "Unsubscribe",
    "Confirm that you no longer want to receive ARKO marketing emails.",
    token,
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const contact = await unsubscribeMarketingContact(prisma, token);
  if (!contact)
    return page(
      "Link unavailable",
      "This unsubscribe link is invalid or no longer available.",
    );
  return page(
    "Unsubscribed",
    "You have been removed from ARKO marketing emails.",
  );
}

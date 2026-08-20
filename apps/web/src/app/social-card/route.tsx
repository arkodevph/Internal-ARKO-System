import { createSocialCard } from "../(marketing)/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return createSocialCard();
}

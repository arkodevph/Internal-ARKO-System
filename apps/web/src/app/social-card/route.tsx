import { createSocialCard } from "../(marketing)/opengraph-image";

export function GET(request: Request) {
  return createSocialCard(new URL(request.url).origin);
}

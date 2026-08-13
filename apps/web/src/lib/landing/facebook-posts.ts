import "server-only";

import type { LandingContent } from "./content";

type BlogItem = LandingContent["blogs"]["items"][number];
type FacebookPost = {
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
};
type FacebookFeedResponse = { data?: FacebookPost[] };

const GRAPH_VERSION = "v23.0";

function summarize(message: string) {
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
}

export function facebookPostToBlogItem(post: FacebookPost): BlogItem | null {
  const message = post.message?.trim();
  const href = post.permalink_url;
  if (!message || !href || !post.created_time) return null;
  const date = new Date(post.created_time);
  if (Number.isNaN(date.getTime())) return null;
  const firstLine =
    message
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim() ?? message;

  return {
    title:
      firstLine.length > 80
        ? `${firstLine.slice(0, 77).trimEnd()}…`
        : firstLine,
    excerpt: summarize(message),
    platform: "Facebook",
    publishedAt: new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(date),
    href,
    image: post.full_picture ?? "",
  };
}

export async function getFacebookBlogPosts(): Promise<BlogItem[]> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) return [];

  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/published_posts`,
  );
  url.searchParams.set(
    "fields",
    "message,created_time,permalink_url,full_picture",
  );
  url.searchParams.set("limit", "12");
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) return [];
    const payload = (await response.json()) as FacebookFeedResponse;
    return (payload.data ?? [])
      .map(facebookPostToBlogItem)
      .filter((post): post is BlogItem => post !== null);
  } catch {
    return [];
  }
}

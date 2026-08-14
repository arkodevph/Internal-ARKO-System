import { afterEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("server-only", () => ({}), { virtual: true });
import {
  facebookPostToBlogItem,
  getFacebookBlogPosts,
} from "../facebook-posts";

const originalPageId = process.env.FACEBOOK_PAGE_ID;
const originalToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

afterEach(() => {
  jest.restoreAllMocks();
  if (originalPageId === undefined) delete process.env.FACEBOOK_PAGE_ID;
  else process.env.FACEBOOK_PAGE_ID = originalPageId;
  if (originalToken === undefined)
    delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  else process.env.FACEBOOK_PAGE_ACCESS_TOKEN = originalToken;
});

describe("Facebook blog posts", () => {
  it("maps a Page post into the blog card shape", () => {
    expect(
      facebookPostToBlogItem({
        message: "We shipped something new.\nSee what changed.",
        created_time: "2026-08-14T02:00:00+0000",
        permalink_url: "https://www.facebook.com/arko/posts/123",
        full_picture: "https://example.com/post.jpg",
      }),
    ).toEqual({
      title: "We shipped something new.",
      excerpt: "We shipped something new. See what changed.",
      platform: "Facebook",
      publishedAt: "Aug 14, 2026",
      href: "https://www.facebook.com/arko/posts/123",
      image: "https://example.com/post.jpg",
    });
  });

  it("skips fetching when credentials are missing", async () => {
    delete process.env.FACEBOOK_PAGE_ID;
    delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const fetchSpy = jest.spyOn(global, "fetch");
    await expect(getFacebookBlogPosts()).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails gracefully when Facebook rejects the request", async () => {
    process.env.FACEBOOK_PAGE_ID = "page-id";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "secret-token";
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("", { status: 401 }));
    await expect(getFacebookBlogPosts()).resolves.toEqual([]);
  });

  it("reads the Page published_posts edge", async () => {
    process.env.FACEBOOK_PAGE_ID = "page-id";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "secret-token";
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(Response.json({ data: [] }));

    await getFacebookBlogPosts();

    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
      "/page-id/published_posts?",
    );
    expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
      cache: "no-store",
    });
  });
});

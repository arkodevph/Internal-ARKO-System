import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Rss } from "lucide-react";
import { getLandingContent } from "../../../lib/landing/get-content";
import { getFacebookBlogPosts } from "../../../lib/landing/facebook-posts";
import { RefreshButton } from "./refresh-button";

const TITLE = "Arko Studio Journal | Product, Design and Engineering";
const DESCRIPTION =
  "Read practical notes from Arko on product strategy, interface design, software engineering, automation, AI implementation, and recent studio launches.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blogs" },
  openGraph: {
    type: "website",
    url: "/blogs",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/social-card?v=4",
        width: 1200,
        height: 630,
        alt: "Arko Studio Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/social-card?v=4"],
  },
};

export default async function BlogsPage() {
  const [{ blogs }, facebookPosts] = await Promise.all([
    getLandingContent(),
    getFacebookBlogPosts(),
  ]);
  const posts = [...facebookPosts, ...blogs.items].filter(
    (post, index, all) =>
      all.findIndex((item) => item.href === post.href) === index,
  );

  return (
    <div className="min-h-dvh bg-ink pb-24 pt-14 text-white md:pt-20">
      <section
        data-bg="light"
        className="border-b-4 border-ink bg-acid px-6 py-16 text-ink md:px-10 md:py-24"
      >
        <p className="eyebrow text-ink/60">{blogs.eyebrow}</p>
        <h1 className="display mt-5 text-[clamp(4rem,13vw,10rem)] leading-[0.78]">
          {blogs.heading}
        </h1>
        <p className="mt-8 max-w-2xl text-base font-semibold leading-relaxed text-ink/70 md:text-xl">
          {blogs.intro}
        </p>
        <RefreshButton />
      </section>

      <section className="px-4 py-10 sm:px-6 md:px-10 md:py-16">
        {posts.length ? (
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, index) => (
              <a
                key={`${post.href}-${index}`}
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-72 flex-col overflow-hidden border border-white/15 bg-white/[0.035] transition-colors duration-200 hover:border-acid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-acid/40"
              >
                {post.image ? (
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-white/15 bg-white/5">
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                    />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="mono inline-flex items-center gap-2 border border-acid/40 bg-acid/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-acid">
                      <span className="h-1.5 w-1.5 rounded-full bg-acid" />
                      {post.platform}
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-white/45 transition-colors group-hover:text-acid" />
                  </div>
                  <h2 className="mt-8 text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">
                    {post.excerpt}
                  </p>
                  <p className="mono mt-auto pt-8 text-[0.65rem] uppercase tracking-wider text-white/40">
                    {post.publishedAt}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center border border-dashed border-white/20 px-6 text-center">
            <Rss className="h-8 w-8 text-acid" />
            <h2 className="display mt-5 text-4xl">Posts are coming.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
              Follow our social channels for studio updates while we prepare the
              archive.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

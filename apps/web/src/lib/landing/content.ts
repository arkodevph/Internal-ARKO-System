import { z } from "zod";

/**
 * Landing page CMS content shape.
 *
 * This is the single source of truth for the editable public landing page.
 * `DEFAULT_LANDING_CONTENT` mirrors the values that used to be hardcoded in
 * `app/(marketing)/page.tsx` and its `_components/*`, so rendering with the
 * defaults produces byte-identical output to the pre-CMS landing page.
 */

const statSchema = z.object({
  to: z.number(),
  suffix: z.string().default(""),
  label: z.string(),
  // When present (even empty string), the raw text is shown instead of the CountUp animation.
  displayText: z.string().optional(),
});

const serviceSlideSchema = z.object({
  lead: z.string(),
  accent: z.string(),
  resolve: z.boolean().optional(),
});

const workCardSchema = z.object({
  kind: z.string(),
  title: z.string(),
  copy: z.string(),
  tags: z.array(z.string()),
  icon: z.string(),
});

const processStepSchema = z.object({
  n: z.string(),
  title: z.string(),
  body: z.string(),
  detail: z.string(),
  icon: z.string(),
});

// Only allow safe link/asset values: https:// URL, root-relative path, #anchor, or empty.
// Blocks dangerous schemes (javascript:, data:) from ever being stored and rendered.
const safeUrl = z
  .string()
  .regex(
    /^$|^(https?:\/\/|\/|#)/,
    "Must be an https:// URL, a /relative path, or a #anchor",
  );

const safeExternalUrl = z
  .string()
  .url()
  .regex(/^https?:\/\//i, "Must be an http:// or https:// URL");

const footerLinkSchema = z.object({ label: z.string(), href: safeUrl });

const projectItemSchema = z.object({
  number: z.string(),
  title: z.string(),
  category: z.string(),
  type: z.string(),
  domain: z.string(),
  href: safeUrl,
  image: safeUrl,
});

const blogItemSchema = z.object({
  title: z.string().trim().min(1).max(180),
  excerpt: z.string().trim().max(500),
  platform: z.string().trim().min(1).max(60),
  publishedAt: z.string().trim().max(40),
  href: safeExternalUrl,
  image: safeUrl,
});

export const landingContentSchema = z.object({
  // Per-section visibility toggles (hero + footer are structural and always render).
  sections: z.object({
    marquee: z.boolean(),
    stats: z.boolean(),
    intro: z.boolean(),
    services: z.boolean(),
    work: z.boolean(),
    process: z.boolean(),
    contact: z.boolean(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headingLead: z.string(),
    roles: z.array(z.string()),
    paragraph: z.string(),
  }),
  marquee: z.object({ words: z.string() }),
  stats: z.array(statSchema),
  intro: z.object({
    heading: z.string(),
    eyebrowNote: z.string(),
    bodyBefore: z.string(),
    bodyHighlight: z.string(),
    bodyAfter: z.string(),
  }),
  services: z.object({
    label: z.string(),
    videoSrc: safeUrl,
    poster: safeUrl,
    ctaLabel: z.string(),
    slides: z.array(serviceSlideSchema),
  }),
  work: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    cards: z.array(workCardSchema),
  }),
  process: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    steps: z.array(processStepSchema),
  }),
  contact: z.object({
    headingLine1: z.string(),
    headingLine2: z.string(),
    paragraph: z.string(),
    email: z.string(),
  }),
  footer: z.object({
    brandBlurb: z.string(),
    email: z.string(),
    githubUrl: safeUrl,
    whatWeDo: z.array(footerLinkSchema),
    ctaLine1: z.string(),
    ctaLine2: z.string(),
    ctaLine3: z.string(),
    location: z.string(),
  }),
  // The dedicated /projects gallery page (categories are derived from item.category).
  projects: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    intro: z.string(),
    ctaEyebrow: z.string(),
    ctaHeading: z.string(),
    ctaLabel: z.string(),
    items: z.array(projectItemSchema),
  }),
  blogs: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    intro: z.string(),
    items: z.array(blogItemSchema),
  }),
});

export type LandingContent = z.infer<typeof landingContentSchema>;

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  sections: {
    marquee: true,
    stats: true,
    intro: true,
    services: true,
    work: true,
    process: true,
    contact: true,
  },
  hero: {
    eyebrow: "Arkō - software studio",
    headingLead: "We build",
    roles: ["websites", "mobile apps", "automation", "ai tools"],
    paragraph:
      "You bring the idea. We design it, build it across web and mobile, then wire in the automation and AI that make it run on its own.",
  },
  marquee: { words: "SITES · APPS · SYSTEMS · TOOLS · CODE · SHIP · " },
  stats: [
    { to: 4, suffix: "", label: "disciplines under one roof" },
    { to: 2, suffix: "", label: "platforms from one codebase" },
    { to: 0, suffix: "", label: "your product, our focus", displayText: "" },
    { to: 0, suffix: "", label: "middlemen between you and the code" },
  ],
  intro: {
    heading: "Ship.",
    eyebrowNote: "*We handle the hard parts.",
    bodyBefore:
      "Most good ideas die in the gap between design and done. We live in that gap, so your product ",
    bodyHighlight: "actually gets built",
    bodyAfter:
      " and reaches real people, without you managing five contractors to get there.",
  },
  services: {
    label: "What we build",
    videoSrc: "/services.mp4",
    poster: "/services-poster.jpg",
    ctaLabel: "Start a project →",
    slides: [
      { lead: "Looking for", accent: "frontend development?" },
      { lead: "Backend", accent: "systems?" },
      { lead: "Cross-platform", accent: "mobile apps?" },
      { lead: "Workflows on", accent: "automation?" },
      { lead: "Products with", accent: "AI that ships?" },
      { lead: "Whatever you need,", accent: "we build it.", resolve: true },
    ],
  },
  work: {
    eyebrow: "what we build",
    heading: "Work",
    subtitle: "The kind of thing we make",
    ctaLabel: "See what fits your project →",
    cards: [
      {
        kind: "web",
        title: "Product websites",
        copy: "Landing pages and marketing sites that load fast and convert.",
        tags: ["Next.js", "Tailwind", "Framer"],
        icon: "◇",
      },
      {
        kind: "mobile",
        title: "Cross-platform apps",
        copy: "One codebase shipped to iOS and Android, store to home screen.",
        tags: ["React Native", "Expo", "Gesture"],
        icon: "◎",
      },
      {
        kind: "automation",
        title: "Automation pipelines",
        copy: "Quiet systems that move data and trigger work while you sleep.",
        tags: ["n8n", "Cron", "Webhooks"],
        icon: "⚡",
      },
      {
        kind: "ai",
        title: "AI features",
        copy: "Chat, retrieval and agents built into products people already use.",
        tags: ["LLMs", "RAG", "Agents"],
        icon: "◆",
      },
    ],
  },
  process: {
    eyebrow: "our process",
    heading: "How we work",
    subtitle: "Four steps. One direction. Ship.",
    ctaLabel: "Ready to start? →",
    steps: [
      {
        n: "01",
        title: "Discovery",
        body: "We learn how your team works today and map the fastest path to something real. You leave with a plan, a scope and a fixed idea of what ships first.",
        detail:
          "A two-week sprint where we interview stakeholders, audit your existing stack, review analytics, and map user flows. You get a technical brief, a sitemap, a UI audit, and a prioritized backlog - no billable hours wasted on discovery theatre.",
        icon: "→",
      },
      {
        n: "02",
        title: "Design & build",
        body: "Design and engineering happen in the same room. You see working software every week, not slide decks, so you can steer while it is cheap to change.",
        detail:
          "We work in one-week cycles. Monday: scope the week. Wednesday: first working build. Friday: demo and feedback. No handoffs, no Figma-to-code gap - the designer writes CSS and the engineer thinks about margins.",
        icon: "◆",
      },
      {
        n: "03",
        title: "Automation & AI",
        body: "Once the core works, we wire in the automation and AI that remove the busywork, so the product does more of the running on its own.",
        detail:
          "This is where we add the force multiplier - background jobs, webhook integrations, vector search, LLM agents, scheduled tasks. Whatever lets your team wake up to work already done instead of a queue of manual steps.",
        icon: "⚡",
      },
      {
        n: "04",
        title: "Handover & support",
        body: "You get clean code, docs and the keys. We stay on for as much or as little support as you want, no lock-in and no mystery.",
        detail:
          "Full handover includes: private npm packages or monorepo access, architecture decision records (ADRs), CI/CD pipelines, runbooks, and a 30-min walkthrough. After that, we offer retainer support in 10-hour blocks - cancel anytime.",
        icon: "◈",
      },
    ],
  },
  contact: {
    headingLine1: "Let's",
    headingLine2: "build",
    paragraph:
      "Tell us what you are trying to make. We will tell you the fastest honest way to get it shipped.",
    email: "contact@arkodevph.com",
  },
  footer: {
    brandBlurb:
      "A software studio that designs, builds and ships web and mobile products - without the overhead.",
    email: "contact@arkodevph.com",
    githubUrl: "https://github.com/justrhey",
    whatWeDo: [
      { label: "Product websites", href: "#work" },
      { label: "Cross-platform apps", href: "#work" },
      { label: "Automation pipelines", href: "#work" },
      { label: "AI features & agents", href: "#work" },
      { label: "Design & prototyping", href: "#work" },
      { label: "Performance audits", href: "#work" },
    ],
    ctaLine1: "Let's",
    ctaLine2: "make it",
    ctaLine3: "real.",
    location: "Philippines",
  },
  projects: {
    eyebrow: "Selected work / 2025 - 2026",
    heading: "Projects",
    intro:
      "Websites and digital products built to turn an idea into something people can use.",
    ctaEyebrow: "Have a project in mind?",
    ctaHeading: "Let's make it real.",
    ctaLabel: "Start a project →",
    items: [
      {
        number: "01",
        title: "BMW",
        category: "Automotive",
        type: "Immersive brand website",
        domain: "unofficial-bmw.vercel.app",
        href: "https://unofficial-bmw.vercel.app",
        image: "/projects/unofficial-bmw-preview.png",
      },
      {
        number: "02",
        title: "Omniscient Reader's Viewpoint",
        category: "Entertainment",
        type: "Interactive story website",
        domain: "unofficial-omniscient-readers-viewpoint.vercel.app",
        href: "https://unofficial-omniscient-readers-viewpoint.vercel.app",
        image: "/projects/unofficial-omniscient-readers-viewpoint-preview.png",
      },
      {
        number: "03",
        title: "Co-Map",
        category: "Civic Tech",
        type: "Community reporting web app",
        domain: "co-map.vercel.app",
        href: "https://co-map.vercel.app",
        image: "/projects/co-map-preview.png",
      },
      {
        number: "04",
        title: "Yuenansichu Restaurant",
        category: "Hospitality",
        type: "Restaurant website",
        domain: "yuenansichu-restaurant.vercel.app",
        href: "https://yuenansichu-restaurant.vercel.app/",
        image: "/projects/yuenansichu-restaurant-preview.webp",
      },
      {
        number: "05",
        title: "Kapet Balay",
        category: "Hospitality",
        type: "Cafe website",
        domain: "unofficial-kapetbalay.vercel.app",
        href: "https://unofficial-kapetbalay.vercel.app/",
        image: "/projects/kapetbalay-preview.png",
      },
      {
        number: "06",
        title: "ISLAS",
        category: "Travel",
        type: "Boutique Philippine journey platform",
        domain: "arko-islas.vercel.app",
        href: "https://arko-islas.vercel.app/",
        image: "/projects/islas-preview.webp",
      },
      {
        number: "07",
        title: "Locus Assembly",
        category: "Architecture",
        type: "Terrain-rooted architecture studio website",
        domain: "arko-locus-assembly.vercel.app",
        href: "https://arko-locus-assembly.vercel.app/",
        image: "/projects/locus-assembly-preview.avif",
      },
      {
        number: "08",
        title: "DM ARC Construction",
        category: "Construction",
        type: "Construction services and project portfolio website",
        domain: "dmarcconstruction.com",
        href: "https://dmarcconstruction.com/",
        image: "/projects/dmarc-construction-preview.webp",
      },
      {
        number: "09",
        title: "Fresh Phones PH",
        category: "E-commerce",
        type: "Mobile device catalog and flexible payment platform",
        domain: "freshphonesph.vercel.app",
        href: "https://freshphonesph.vercel.app/",
        image: "/projects/freshphonesph-preview.webp",
      },
      {
        number: "10",
        title: "Brodie",
        category: "Brand",
        type: "Brand website redesign",
        domain: "brodie-redesign.vercel.app",
        href: "https://brodie-redesign.vercel.app/",
        image: "/projects/brodie-preview.webp",
      },
      {
        number: "11",
        title: "Huntly",
        category: "Career Tech",
        type: "Personalized job search platform",
        domain: "gohuntly.com",
        href: "https://www.gohuntly.com/",
        image: "/projects/huntly-preview.webp",
      },
      {
        number: "12",
        title: "HiveCX",
        category: "Customer Operations",
        type: "Customer operations and outsourcing website",
        domain: "hivecx.asia",
        href: "https://hivecx.asia/",
        image: "/projects/hivecx-preview.webp",
      },
    ],
  },
  blogs: {
    eyebrow: "Notes / updates / fieldwork",
    heading: "Blogs",
    intro:
      "Ideas, launches, and behind-the-scenes updates from ARKO across the platforms where we publish.",
    items: [],
  },
};

/**
 * Merge stored (possibly partial / older-schema) content over the defaults so a
 * freshly-added field never renders as `undefined`. Arrays are replaced wholesale
 * except project items, where newly shipped defaults are appended by URL.
 */
export function mergeLandingContent(stored: unknown): LandingContent {
  const d = DEFAULT_LANDING_CONTENT;
  if (!stored || typeof stored !== "object") return d;
  const s = stored as Partial<LandingContent>;
  const storedProjects = (s.projects?.items ?? [])
    .filter(
      (project) =>
        project.href.replace(/\/$/, "") !== "https://kapetbalay.vercel.app",
    )
    .map((project) => {
      if (project.title === "DM ARC Construction") {
        return {
          ...project,
          domain: "dmarcconstruction.com",
          href: "https://dmarcconstruction.com/",
        };
      }

      const refreshedPreview = {
        Brodie: "/projects/brodie-preview.webp",
        Huntly: "/projects/huntly-preview.webp",
        HiveCX: "/projects/hivecx-preview.webp",
      }[project.title];

      return refreshedPreview ? { ...project, image: refreshedPreview } : project;
    });
  const storedProjectUrls = new Set(
    storedProjects.map((project) => project.href.replace(/\/$/, "")),
  );
  const projectItems = [
    ...storedProjects,
    ...d.projects.items.filter(
      (project) => !storedProjectUrls.has(project.href.replace(/\/$/, "")),
    ),
  ];
  return {
    sections: { ...d.sections, ...s.sections },
    hero: { ...d.hero, ...s.hero },
    marquee: { ...d.marquee, ...s.marquee },
    stats: s.stats ?? d.stats,
    intro: { ...d.intro, ...s.intro },
    services: { ...d.services, ...s.services },
    work: { ...d.work, ...s.work },
    process: { ...d.process, ...s.process },
    contact: { ...d.contact, ...s.contact },
    footer: { ...d.footer, ...s.footer },
    projects: { ...d.projects, ...s.projects, items: projectItems },
    blogs: { ...d.blogs, ...s.blogs, items: s.blogs?.items ?? d.blogs.items },
  };
}

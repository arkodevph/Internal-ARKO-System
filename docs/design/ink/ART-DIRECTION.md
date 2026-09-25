# Arko / Ink edition

## Direction

A switchable homepage theme built from the three supplied posters. The theme is called **Ink**; **Original** restores the existing green studio homepage. Ink is the default for a fresh visitor. A server-set cookie remembers the choice, including after reload. The dashboard and existing secondary marketing pages keep their current design.

The layout follows the supplied references in order:

1. **Image 1 — Type as a window.** Very tall, condensed ARKODEVPH lettering contains an original monochrome mechanical illustration. Pointer movement shifts the artwork by at most 8px horizontally and 6px vertically. The lettering remains still and readable. The still is the hero placeholder for the future Flow loop.
2. **Image 2 — A scroll-controlled poster.** Oversized title, a central image, radial ink lines, small opposing credits, and a bottom statement. Scrolling maps directly to image enlargement, type movement and a progress rule. Native scrolling is preserved.
3. **Image 3 — Halftone editorial.** A coarse black-and-white Philippine street facade, a large lowercase arko. wordmark overlapping the image edge, narrow service columns, and an asymmetric statement.
4. Existing project data and images provide real work links. Contact goes to the studio's configured email.

Keep the composition flat and restrained: square edges, thin rules, no glow, no glass, no extra particle effects. The supplied posters remain the primary visual references. Generated art is original and does not reuse their characters or branding.

## Palette

| Role | Hex | Application |
| --- | --- | --- |
| Ink | #111110 | Main dark ground; text on paper |
| Paper | #F0EFE9 | Main light ground; text on ink |
| Graphite | #575751 | Secondary text on paper |
| Silver | #A5A5A0 | Secondary text on ink |
| Rule | #3B3B37 | Non-interactive dividers on dark ground |

The slightly warm neutral pair retains the printed-poster feeling. Text colors and rules have separate jobs, informed by [Radix Colors' scale guidance](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale). No accent color is needed: inversion supplies the hierarchy. Project screenshots return to their original color on hover/focus.

Typography: self-hosted **Anton** for condensed poster headlines; Arial/Helvetica for large lowercase editorial type and body; system monospace for labels. Anton's SIL Open Font License is saved with the font.

## Reviewed references

Research conducted 2026-09-15. The notes identify the specific idea used or considered; these are references, not copied templates.

| Reference | Useful observation / decision |
| --- | --- |
| [Perpetuum.inc / Awwwards](https://www.awwwards.com/sites/perpetuum-inc) | Brutalist brand identity and analog image treatment; omit its color gradients. |
| [Humbert & Poyet scroll portfolio / Awwwards](https://www.awwwards.com/inspiration/scroll-portfolio) | Architecture, typography and deliberate scroll pacing. |
| [REJOUICE](https://www.rejouice.com/) | Clear studio positioning, restrained navigation and direct work/contact paths. |
| [Studio Freight](https://studiofreight.com/) | Studio identity as the organizing element; keep the Arko layout typographic. |
| [Pangram Pangram](https://pangrampangram.com/) | Type-led hierarchy and strong size contrasts; use an openly licensed display font. |
| [Codrops Image Expansion Typography demo](https://tympanus.net/Development/ImageExpansionTypography/) | A small image becomes the visual focus as the reader scrolls. |
| [Codrops On-Scroll Typography demo](https://tympanus.net/Development/OnScrollTypographyAnimations/) | Connect one typographic movement to scroll; avoid stacking unrelated effects. |
| [Codrops On-Scroll Path Animations](https://github.com/codrops/OnScrollPathAnimations) | SVG geometry is sufficient for poster lines; no WebGL needed. |
| [Motion useScroll](https://motion.dev/docs/react-use-scroll) | Target-relative progress and transforms; use the Motion dependency already in Arko. |
| [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) | Separate background, separator, interaction and text roles. |
| [Anton / Google Fonts](https://fonts.google.com/specimen/Anton) | Heavy condensed letterforms that retain the supplied poster's vertical emphasis. |

Recurring choices: one dominant headline, tightly cropped art, small metadata, asymmetric columns, alternating ink/paper sections, and motion confined to a specific visual. Broader reference sites supply usability and implementation ideas; the user's images determine the style.

## Open-source implementation resources

| Repository | License checked | Use |
| --- | --- | --- |
| [codrops/ImageExpansionTypography](https://github.com/codrops/ImageExpansionTypography) | MIT | Image-with-type scroll composition reference |
| [codrops/OnScrollTypographyAnimations](https://github.com/codrops/OnScrollTypographyAnimations) | MIT | Typography motion reference |
| [codrops/OnScrollPathAnimations](https://github.com/codrops/OnScrollPathAnimations) | MIT | SVG scroll reference |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | MIT | Already used by Original; Ink uses native scrolling |
| [google/fonts — Anton](https://github.com/google/fonts/tree/main/ofl/anton) | SIL OFL 1.1 | Local font asset |

No demo code or additional animation package was imported. The new implementation uses Arko's existing Motion and Next.js dependencies plus an SVG mask and CSS.

## Implementation notes

- Theme content: `apps/web/src/app/(marketing)/_components/ink/InkLanding.tsx`
- Scoped styles: `apps/web/src/app/(marketing)/_components/ink/ink.module.css`
- Marketing shell chooses the correct homepage chrome by theme and pathname.
- Theme cookie: `arko-landing-theme`; values `ink` and `studio`.
- The server reads the cookie to avoid a client-side flash of the other theme. This makes the marketing shell request-rendered; landing content remains cached through the existing content loader.
- Existing section visibility controls determine the story, services and selected work sections.
- Below-fold raster images are lazy loaded. Generated WebP artwork totals approximately 957 KB; the hero itself is approximately 308 KB.
- Reduced motion removes the pinned scroll duration and movement. Static content, real anchors, visible keyboard focus and theme forms remain usable without JavaScript.
- The masked wordmark has a semantic H1 counterpart for assistive technology.

## Assets and generation

Both assets were created with the built-in image generation tool, then encoded as WebP without changing the composition.

- `apps/web/public/themes/ink/mechanical-hero.webp`: hero still / Flow reference.
- `apps/web/public/themes/ink/urban-halftone.webp`: scroll story and studio illustration.
- `apps/web/public/themes/ink/fonts/anton.woff2`: local display font.
- Full generation prompts: [IMAGE-PROMPTS.md](./IMAGE-PROMPTS.md).
- Video prompt and usage: [GOOGLE-FLOW-PROMPT.md](./GOOGLE-FLOW-PROMPT.md).

The hero is intentionally a still placeholder. No video has been generated or inserted.


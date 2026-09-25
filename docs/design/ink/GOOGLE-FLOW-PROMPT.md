# Google Flow / Arko hero loop

## Setup

Use the generated `apps/web/public/themes/ink/mechanical-hero.webp` as the visual reference. In Flow, choose **Video → Frames** and use the same artwork for both the start and end frame. Select landscape 16:9 and 4 seconds if the selected model offers it. Google documents the [start/end frame workflow here](https://support.google.com/flow/answer/16353334?hl=en).

The target is a **3–5 second loop**, ideally 4 seconds. Available generation lengths depend on the selected model. If 4 seconds is unavailable, use an available length and ask for a complete repeating cycle that can be cut to 3–5 seconds. Check the seam visually; matching endpoint images helps but does not guarantee a seamless result.

## Ready-to-paste prompt

> Animate the supplied monochrome mechanical illustration into a quiet, seamless 4-second infinite loop for a software studio website. Preserve the exact composition, diagonal mechanical structure, cable layout, city background, drawing style and paper texture. The camera is completely locked. A few small internal rollers turn one complete slow revolution over the duration; one short exposed conduit subtly flexes and returns exactly to its original shape. All large structures and the distant city remain still. Every moving element completes one cycle and arrives at precisely its starting position and velocity on the final frame. Maintain crisp black ink outlines, graphite-grey cel shading and fine printed halftone on warm off-white paper. Restrict the palette to ink black, charcoal, silver grey and warm paper white. Keep the movement gentle and legible when the footage is seen through very tall condensed letters. No typography, no letters, no logos, no interface, no color accents, no glow, no particles, no new objects, no smoke, no morphing, no camera movement, no cuts, no zoom, no lighting change, no flicker, no audio. The first and last frames must match for continuous repeat playback. Flat hand-drawn late-1980s science-fiction manga print aesthetic, not glossy 3D.

## Integration handoff

Keep ARKODEVPH as actual page typography/SVG masking. Do not bake the name into the generated video. The video replaces only the hero media layer; the type and layout stay fixed.

Export a silent H.264 MP4, preferably 1600px wide or smaller, with a target payload below 2 MB. A browser video should use `muted loop playsInline`, keep this generated still as its poster, and show only the still for reduced motion. Pause playback while the hero is out of view or the tab is hidden. Review the export's loop join before adding it.

For now, the website uses the generated still placeholder.


# Memory Parlour

A single-page marketing site for **Memory Parlour** — a family-legacy
preservation studio. The whole site is **one viewport tall (100vh)** and divided
into six **folds**. Only one fold is visible at a time; scrolling, swiping,
pressing arrow keys, or clicking a nav item swaps the visible fold with a
crossfade. There is no normal page scroll.

Built as **plain HTML / CSS / JS** — no framework, bundler, or build step. Shared
UI uses native Web Components, content is externalized to JSON and rendered
client-side, and CSS is split into a shared base plus one file per fold. Intended
to deploy as static assets on Cloudflare Workers.

---

## Folds & routes

Fold order is the nav order. Each fold has a clean URL kept in sync via the
History API (no reload).

| Order | Fold       | Route          | Fold id    | Status        |
|-------|------------|----------------|------------|---------------|
| 1     | Home       | `/`            | `home`     | ✅ Built      |
| 2     | About Us   | `/about-us`    | `about`    | ✅ Built      |
| 3     | Services   | `/services`    | `services` | ⏳ Stub        |
| 4     | Process    | `/process`     | `process`  | ⏳ Stub        |
| 5     | FAQs       | `/faqs`        | `faqs`     | ⏳ Stub        |
| 6     | Contact Us | `/contact-us`  | `contact`  | ⏳ Stub        |

Stubbed folds are empty `<section>`s so navigation is testable end-to-end; they
get real content as their designs/specs arrive. Specs live in `specdoc/`.

---

## Quick start

Requires Node (uses only built-ins — no `npm install` needed).

```bash
npm run dev            # serves at http://localhost:8080
PORT=9000 npm run dev  # pin a specific port
```

If the port is busy the dev server walks up to the next free one and prints the
final URL — **watch the console for the actual port**.

The dev server (`server/dev-server.js`) serves static files from the repo root
and falls back to `index.html` for clean routes (e.g. `/about-us`) so deep links
work. It mirrors what the future Worker/SSR layer will do; it is not a production
server.

---

## Project structure

```
index.html                 Single page: <site-nav> + six fold <section>s.
css/
  base.css                 Design tokens (:root), reset, fonts, header styles,
                           the fold layout + crossfade framework, responsive
                           defaults, reduced-motion.
  folds/
    home.css               Home-only: headline type + hero positioning/overlap.
    about.css              About-only: video block, poem, heading band.
    services.css           Services-only: two-column scroll layout + media slot.
    process.css            Process-only: lede/steps + bottom-bleeding video band.
js/
  nav.js                   <site-nav> Web Component (logo + nav, active state).
  folds.js                 Fold controller: input handling, crossfade, URL sync,
                           end-clamping, fold lifecycle + scrollable hooks.
  media.js                 Shared renderers: createMedia + createHeading, used by
                           about/services/process (on window.MemoryParlour).
  home.js                  Home renderer (segmented headline + hero media).
  about.js                 About renderer (video + poem + heading).
  services.js              Services renderer (heading + media + markdown list).
  process.js               Process renderer (lede + numbered steps + video band).
content/
  site.json                Shared logo + nav (single source of truth for routes).
  home.json                Home fold content.
  about.json               About fold content (introduces the video media type).
  services.json            Services fold content (heading + media + body pointer).
  services.md              Services list, rendered by the in-repo markdown parser.
  process.json             Process fold content (lede + steps + video).
assets/
  images/                  Placeholder hero + video poster.
  icons/
server/
  dev-server.js            Zero-dependency static server with SPA fallback.
specdoc/                    Per-fold specifications (home, about, services, …).
```

---

## Architecture

### The shared shell (built once, used by every fold)

- **`<site-nav>`** (`js/nav.js`) — a native custom element rendered in the light
  DOM (so `base.css` styles it). It reads `content/site.json` and builds the logo
  block (tagline / wordmark / established) and the nav links. Collapses to a
  hamburger overlay on narrow widths.
- **Fold controller** (`js/folds.js`) — owns *which fold is active*. It handles
  all navigation input, the crossfade, URL sync, end-clamping, and fold
  lifecycle hooks. The route table is derived from `site.json`'s `nav` array, so
  order and paths have a single source of truth.

### Component communication contract

Components are decoupled and talk via DOM `CustomEvent`s on `document`, plus one
mirrored attribute. **Preserve this contract when adding folds.**

| Signal | Type | Direction | Payload |
|--------|------|-----------|---------|
| `fold:goto` | event on `document` | nav/logo → controller | `{ fold }` — request navigation |
| `fold:change` | event on `document` | controller → anyone | `{ fold, path }` — active fold changed |
| `<html data-fold="…">` | attribute | controller → anyone | mirrors the active fold id (read on first render) |
| `registerScrollable(fold, el)` | JS call on `window.MemoryParlour` | fold → controller | registers an internally-scrollable region so nav hands off at its top/bottom edges |

`<site-nav>` dispatches `fold:goto` on click and listens to `fold:change` to move
its active highlight. The controller is the only thing that decides when a fold
becomes active.

### Fold lifecycle hooks (for folds with active-only behaviour)

Some folds have behaviour that should only run while they're on screen — e.g. the
About fold's video must lazy-load, play on enter, and pause on leave. Rather than
each fold listening to events and guessing, the controller drives it:

```js
window.MemoryParlour.registerFold('about', {
  onEnter() { /* lazy-load + play */ },
  onLeave() { /* pause */ },
});
```

The controller calls `onLeave` for the fold being left and `onEnter` for the one
being entered. Registering also fires `onEnter` immediately if that fold is
already active (covers deep-links + async renderers that finish after init).

### Navigation input

All handled in `js/folds.js`:

- **Wheel / trackpad** — one gesture advances exactly one fold. The handler is
  **timestamp-based**: it steps on the leading edge of a gesture, then re-arms
  only when the burst ends (a gap since the last event, magnitude decaying to
  near-zero, *or* a 1 s safety ceiling). This swallows trackpad momentum tails
  without skipping folds, and — critically — can never get permanently stuck even
  under continuous/overlapping scrolling.
- **Touch** — a vertical swipe past a threshold advances one fold.
- **Keyboard** — ↑ / PageUp and ↓ / PageDown move one fold (accessibility).
- **Nav / logo click** — jumps directly to a fold (via `fold:goto`).
- **Ends clamp** — no wrap-around (up on Home / down on Contact Us does nothing).
- **`prefers-reduced-motion`** — crossfade becomes an instant swap (CSS).

### Routing

Clean paths via the History API. Changing folds updates the URL without a reload;
on load the controller reads `location.pathname` to pick the starting fold;
`popstate` (back/forward) re-selects without pushing a new entry. Server-side
handling of these paths arrives with the SSR pass — for now the dev server's
`index.html` fallback covers deep links.

---

## Content model

Content is data-driven JSON, fetched and rendered client-side. Header data lives
in `site.json` (shared); each fold has its own file.

**`content/site.json`** — logo + nav (also the route table):

```json
{
  "logo": { "tagline": "…", "wordmark": "MEMORY PARLOUR", "established": "EST. 2024", "href": "/" },
  "nav": [ { "label": "HOME", "path": "/", "fold": "home" }, … ]
}
```

**`content/home.json`** — the headline is modeled as styled segments so the
upright/italic split is data-driven; `media` is a typed object:

```json
{
  "headline": [
    { "text": "PRESERVE", "style": "upright" },
    { "text": "YOUR", "style": "italic" },
    { "break": true },
    …
  ],
  "media": { "type": "image", "src": "…", "alt": "…" }
}
```

Renderer rule: consecutive `text` segments join with a space; `{ "break": true }`
inserts a line break.

**`content/about.json`** — the `media` object **extends** the Home shape with
video fields (an `image` type ignores them; a `video` type uses them):

```json
{
  "media": {
    "type": "video",
    "src": "",                 // empty → show poster as a static placeholder
    "poster": "…",
    "autoplay": true, "loop": true,
    "muted": true,             // always starts muted (browsers block sound autoplay)
    "showMuteControl": false   // true → render a mute/unmute toggle overlay
  },
  "poem": ["line 1", "line 2", …],   // array preserves deliberate line breaks
  "heading": { "eyebrow": "Knowing", "title": "The Memory Parlour" }
}
```

---

## Styling conventions

- **Tokens first.** Colors, type families, and layout values are CSS custom
  properties in `:root` (`css/base.css`). They are **placeholders** — the real
  design system (final fonts, exact colors, spacing scale) is a later pass. Use
  the tokens; don't hard-code values.
- **Base vs. per-fold.** Anything shared (header, fold framework, tokens, reset)
  lives in `base.css`. Fold-specific styling lives in `css/folds/<fold>.css` and
  is namespaced with a `.<fold>__…` BEM-ish prefix.
- **Fonts (placeholders):** display serif **Cormorant Garamond** (wordmark,
  headlines, poem — needs a true italic) and label sans **Jost** (tagline, nav,
  established, About heading). Loaded from Google Fonts.

---

## Adding a new fold

The shell is built to make this incremental. To fill a stubbed fold (e.g.
`services`):

1. **Content** — add `content/services.json`.
2. **Markup** — in `index.html`, replace the empty
   `<section class="fold" data-fold="services">` stub with its skeleton
   containers (mirror how `home`/`about` are structured).
3. **Styles** — add `css/folds/services.css` and link it in `index.html`'s
   `<head>` (alongside the other fold stylesheets).
4. **Renderer** — add `js/services.js` (fetch the JSON, populate the DOM) and add
   a `<script defer>` for it before `</body>`.
5. **Lifecycle (only if needed)** — if the fold has active-only behaviour (video,
   autoplay, animation), call `window.MemoryParlour.registerFold(...)`.

No change to `js/folds.js` or `js/nav.js` is needed for a normal content fold —
the route already exists in `site.json`, and the nav/active-state/URL sync all
work automatically. Touch `folds.js` only to extend shared navigation behaviour.

---

## Deferred / roadmap

- **Worker SSR + per-route meta/OG injection** — render folds server-side and
  inject metadata per route.
- **Deploy config** (`wrangler.jsonc`) — Cloudflare Workers deployment.
- **Real design system** — final fonts, exact colors, spacing tokens.
- **Final media assets** — hero image and the About video (the real video will
  exceed the 25 MiB static cap, so it'll point at Cloudflare Stream or R2).
- **Folds 3–6 content** — Services, Process, FAQs, Contact Us.
- **Mobile polish** — current responsive behaviour is sensible defaults only.

---

## Notes for AI agents

- **Read the spec first.** Each fold has a spec in `specdoc/`; it's the source of
  truth for content, layout, and scope (including what's explicitly deferred).
- **Respect the contracts** above (the `fold:goto` / `fold:change` events, the
  `data-fold` mirror, and `registerFold`). They keep folds decoupled.
- **No build step / no dependencies.** Don't introduce a framework or bundler.
  Keep using native Web Components, plain modules loaded with `<script defer>`,
  and Node built-ins for tooling. Markdown (e.g. `services.md`) is rendered by a
  small in-repo parser in `js/services.js` — no third-party markdown library.
- **Shared rendering** for the media block (image/video, lazy-load, mute control)
  and the eyebrow+title heading lives in `js/media.js`
  (`window.MemoryParlour.createMedia` / `createHeading`); reuse it when a new fold
  needs either, rather than re-implementing per fold.
- **Verify in a browser**, not just by reading code — the dev server plus a
  headless browser screenshot/DOM-dump catches layout and navigation regressions.
- **Use the tokens** in `base.css`; treat colors/fonts as placeholders pending
  the design-system pass.

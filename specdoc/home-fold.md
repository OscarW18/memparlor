# Memory Parlour — Home Fold Spec

> Scope: this is the first page we build, so it establishes the **shared shell**
> (header + fold navigation system) in addition to the **Home fold** content.
> Everything not relevant to Home (the other five folds' content, full SSR, the
> real design system) is explicitly deferred — see §10.

---

## 1. Context

The whole site is a **single page, one viewport tall (100vh)**. There are six
folds, each mapping to a nav item. Only one fold is visible at a time; scrolling
or clicking a nav item swaps the visible fold with a crossfade. There is no
normal page scroll.

**Stack recap:** plain HTML/CSS/JS — no framework, build step, or bundler;
native Web Components for shared UI; content externalized to JSON; base +
per-fold CSS split; deployed as static assets on Cloudflare Workers. Content for
the Home fold renders **client-side** for now (JS fetches JSON and populates the
DOM); the Worker SSR + meta-tag layer is a separate later pass.

---

## 2. Fold system (shared — built now)

A single `index.html` holds six full-viewport `<section>` fold containers,
layered on top of each other. Only the active fold is visible.

- **Fold order** (= nav order): Home → About Us → Services → Process → FAQs → Contact Us.
- **Transition:** crossfade. Respects `prefers-reduced-motion` → instant swap.
- **Navigation triggers:**
  - Wheel / trackpad: one gesture advances exactly one fold (snap), debounced so a single scroll can't skip folds.
  - Touch: vertical swipe advances one fold.
  - Keyboard: ↑/↓ and PageUp/PageDown move one fold (accessibility).
  - Nav click / logo click: jumps directly to the target fold (with fade).
- **Ends clamp** — no wrap-around (scrolling up on Home or down on Contact Us does nothing).
- **URL sync:** clean paths via the History API. Changing fold updates the URL
  (`/`, `/about-us`, …) without a reload; on initial load the path selects the
  starting fold. (Server-side handling of these paths comes with the SSR pass;
  for now the client reads `location.pathname`.)

**Routes**

| Fold       | Path           | Fold id    |
|------------|----------------|------------|
| Home       | `/`            | `home`     |
| About Us   | `/about-us`    | `about`    |
| Services   | `/services`    | `services` |
| Process    | `/process`     | `process`  |
| FAQs       | `/faqs`        | `faqs`     |
| Contact Us | `/contact-us`  | `contact`  |

Folds 2–6 are **stubbed** as empty placeholder sections now (so the navigation
is testable end-to-end). They get real content as their designs arrive.

---

## 3. Header — `<site-nav>` Web Component (shared — built now)

Fixed to the top, identical on every fold. Built as a native custom element
that renders its own markup and reads its data from `content/site.json`.

**Left — logo block.** One container `<div>` wrapping three child `<div>`s, per
your spec:

1. Tagline — `PRESERVING FAMILY LEGACY` (small, tracked, uppercase)
2. Wordmark — `MEMORY PARLOUR` (large display serif)
3. Established — `EST. 2024` (small, tracked, uppercase; the wide gap between
   `EST.` and `2024` is handled in CSS, since HTML collapses whitespace)

Clicking the logo block jumps to the Home fold.

**Right — nav.** Links in this exact order and casing: `HOME`, `ABOUT US`,
`SERVICES`, `PROCESS`, `FAQS`, `CONTACT US`. The link for the currently active
fold gets a highlighted **active** state.

---

## 4. Home fold — content & layout

Background: warm cream/ivory (placeholder token — exact value set in the
design-system pass).

**Hero headline** — centered, below the header, mixing an upright serif and a
true italic. Exact words and styling (everything upright except the two italic
words):

- Line 1: `PRESERVE` *(upright)* · `YOUR` *(italic)* · `FAMILY'S` *(upright)*
- Line 2: `LEGACY.` *(italic)*
- Line 3: `ONE MEMORY AT A TIME.` *(upright)*

Modeled as styled segments in JSON (see §5) so the upright/italic split is
data-driven rather than hard-coded.

**Hero image** — placeholder for now (final asset to come).

- Sits in the lower portion of the fold with cream gutters left and right (not full-bleed).
- **Bleeds off the bottom edge** — cropped by the 100vh fold boundary, as in the design.
- The bottom of the headline **overlaps onto the top** of the image.
- Referenced through the typed `media` object so a future swap (or a video fold) needs no schema change.

---

## 5. Content model (JSON)

Two files. Shared header data lives separately from fold content, because the
header is identical across all folds.

**`content/site.json`** — shared logo + nav

```json
{
  "logo": {
    "tagline": "PRESERVING FAMILY LEGACY",
    "wordmark": "MEMORY PARLOUR",
    "established": "EST. 2024",
    "href": "/"
  },
  "nav": [
    { "label": "HOME",       "path": "/",            "fold": "home" },
    { "label": "ABOUT US",   "path": "/about-us",    "fold": "about" },
    { "label": "SERVICES",   "path": "/services",    "fold": "services" },
    { "label": "PROCESS",    "path": "/process",     "fold": "process" },
    { "label": "FAQS",       "path": "/faqs",        "fold": "faqs" },
    { "label": "CONTACT US", "path": "/contact-us",  "fold": "contact" }
  ]
}
```

**`content/home.json`** — Home fold content

```json
{
  "fold": "home",
  "headline": [
    { "text": "PRESERVE", "style": "upright" },
    { "text": "YOUR",     "style": "italic"  },
    { "text": "FAMILY'S", "style": "upright" },
    { "break": true },
    { "text": "LEGACY.",  "style": "italic"  },
    { "break": true },
    { "text": "ONE MEMORY AT A TIME.", "style": "upright" }
  ],
  "media": {
    "type": "image",
    "src": "/assets/images/hero-home-placeholder.jpg",
    "alt": "Two figures standing at the edge of a lake"
  }
}
```

Renderer rule for `headline`: consecutive `text` segments join with a space;
`{ "break": true }` inserts a line break.

---

## 6. CSS plan (base + per-fold split)

- **`css/base.css`** — `:root` design tokens (color / type / layout, placeholder
  values), reset, font setup, header/`<site-nav>` styles, the fold layout +
  crossfade framework, and shared layout primitives.
- **`css/folds/home.css`** — Home-fold-only rules: headline type treatment,
  hero-image positioning/cropping, and the headline-over-image overlap.

Both are linked in `index.html`.

---

## 7. Fonts (placeholders — replaced in the design-system pass)

- **Display serif** (wordmark + headline, needs a real italic): placeholder
  **Cormorant Garamond** — high-contrast, elegant, strong true italic.
- **Label sans** (tagline, nav, `EST. 2024` — tracked uppercase): placeholder
  **Jost**.

Loaded from Google Fonts. Both are stand-ins chosen to approximate the design;
the real faces get locked when we do the design system.

---

## 8. JavaScript

| File          | Responsibility                                                                 |
|---------------|--------------------------------------------------------------------------------|
| `js/nav.js`   | `<site-nav>` component — logo + nav markup, active-state, click → fold change.  |
| `js/folds.js` | Fold controller — loads JSON, renders folds, handles wheel/touch/keyboard nav, crossfade, end-clamping, History API URL sync, reduced-motion. |
| `js/home.js`  | Home-fold renderer — reads `home.json`, builds the segmented headline + hero media. |

`marked.js` is **not** needed for this fold (no markdown here); it comes in when
a fold actually uses markdown.

---

## 9. File/folder structure created in this build

(Relative to repo root; root/domain name still TBD.)

```
├── index.html                       # single page: header + 6 fold sections (Home real, 2–6 stubbed)
├── css/
│   ├── base.css
│   └── folds/
│       └── home.css
├── js/
│   ├── nav.js                       # <site-nav>
│   ├── folds.js                     # fold controller
│   └── home.js                      # home fold renderer
├── content/
│   ├── site.json                    # shared logo + nav
│   └── home.json                    # home fold content
├── assets/
│   ├── images/
│   │   └── hero-home-placeholder.jpg
│   └── icons/
└── specdocs/
    └── home-fold.md                 # this document
```

---

## 10. Deferred (explicitly out of scope for this build)

- **Worker SSR + per-route meta/OG injection** — dedicated pass once more folds exist.
- **`wrangler.jsonc` / deploy config** — added in the deploy pass.
- **Real design system** — final fonts, exact colors, spacing tokens.
- **Final hero image** — you'll supply it; placeholder used until then.
- **Folds 2–6 content** — stubbed; built as their designs arrive.
- **Mobile polish** — sensible responsive defaults only for now (nav collapses
  to a hamburger + overlay on narrow widths; fluid headline). Refined later.

---

## 11. Open questions / assumptions to confirm

- Header is assumed to sit on a transparent/cream background matching each fold
  (no separate bar fill), per the design. Confirm if you want it otherwise.
- Stubbing folds 2–6 now (vs. building Home in isolation) — assumed yes, so the
  navigation is demonstrable.

# Memory Parlour — Services Fold Spec

> Scope: the **Services** fold only. Builds on the already-implemented shell
> (header, fold system, base tokens) and the media model established on About.
> Introduces two firsts: **markdown content via marked.js**, and an
> **internally-scrollable fold** (content taller than the viewport).

---

## 1. Context

- **Route:** `/services` · **Fold id:** `services` · third in scroll order.
- **Active nav:** `SERVICES` highlighted when active.
- Two-column layout: a scrollable services list (left) and a pinned column
  holding the heading + media (right).

---

## 2. Layout & scroll behavior

**Left column — services list.** A list of items (label + description), taller
than the viewport. It **scrolls internally** within the fold.

**Right column — pinned.** The heading block (top) and the media slot (below)
**stay fixed/sticky** while the left list scrolls.

**Fold hand-off (new controller capability).** Because the left content
overflows, the fold controller (`js/folds.js`) gains support for
*internally-scrollable folds*: scrolling scrolls the left list; once it reaches
the **bottom**, the next downward scroll advances to **Process**; at the **top**,
an upward scroll returns to **About**. Nav clicks still jump directly. This is an
addition to the controller introduced by this fold (the shell as previously
built assumed every fold fit one viewport).

`prefers-reduced-motion` is respected as before; the internal list still scrolls
normally.

---

## 3. Right column — heading + media

**Heading block (top-right).** Eyebrow + title, bold sans, right-aligned — same
component pattern as About's heading:

- Eyebrow: `What we`
- Title: `Preserve`

**Media slot (below heading).** The flexible image-or-video media object — the
same shape introduced on About.

- `type: "image"` for now with a placeholder; swappable to `"video"` later,
  carrying the same `autoplay` / `loop` / `muted` / `showMuteControl` config.
- The **"Can be a video"** annotation in the mockup is a marker only — it does
  **not** appear in the build.
- Portrait-oriented slot (taller than wide), per the mockup.

---

## 4. Content model — two files

**`content/services.json`** — structured wrapper

```json
{
  "fold": "services",
  "heading": {
    "eyebrow": "What we",
    "title": "Preserve"
  },
  "media": {
    "type": "image",
    "src": "/assets/images/services-media-placeholder.jpg",
    "poster": "",
    "autoplay": true,
    "loop": true,
    "muted": true,
    "showMuteControl": false
  },
  "body": "services.md"
}
```

- `body` points at the markdown file rendered into the left column.
- `type` flips to `"video"` (with a `src`/`poster`) when a video is supplied.

**`content/services.md`** — the services list (placeholder text = what's in the
mockup). Each service is a heading (label, with its colon) followed by a
paragraph (description). marked.js renders these to `<h2>` + `<p>`, styled in CSS.

```markdown
## Stories:
Childhood memories, family folklore, and stories passed quietly across generations preserved as thoughtfully created books and personal archives.

## Photographs:
Personal image archives restored, organised, and curated into albums and books that allow the photographs to speak for themselves.

## Films & Home Videos:
Old tapes and family recordings carefully preserved as intimate film diaries that capture movement, voice, and everyday life.

## Voice & Letters:
Letters, conversations, and recordings gathered into personal written or audio archives — allowing voices and words to remain close across time.

## Jewellery & Personal Objects:
Keepsakes, heirlooms, and everyday objects documented alongside the stories they carry, with thoughtful restoration and recreation where needed.

## A Life Story:
<!-- description cut off in the mockup — placeholder body to be supplied -->
```

> **Flag:** "A Life Story:" is cut off at the bottom of the mockup with no
> visible description, so its body is a placeholder for now. If there are
> further items below it, send them and I'll append.

---

## 5. Typography

Reusing the placeholder families (finalized in the design-system pass):

| Element                         | Family (placeholder)        | Treatment                  |
|---------------------------------|-----------------------------|----------------------------|
| Service label (`h2`)            | Cormorant Garamond *italic* | label with colon, left     |
| Service description (`p`)       | Cormorant Garamond *italic* | paragraph, left            |
| `Preserve` title                | Jost **bold**               | large, right-aligned       |
| `What we` eyebrow               | Jost regular                | small, right-aligned       |

The whole left list is italic serif (labels and descriptions alike), matching
the mockup.

---

## 6. CSS — `css/folds/services.css`

Per-fold styles only:

- Two-column grid: scrollable left list | sticky right column.
- Left list: `overflow-y` scroll within the fold height (viewport minus header),
  spacing/rhythm between items, markdown `h2`/`p` type treatment.
- Right column: sticky positioning; heading block + media stacked; portrait
  media sizing with the same gutter/crop language as elsewhere.

Linked in `index.html` alongside `base.css`, `home.css`, `about.css`.

---

## 7. JavaScript — `js/services.js`

- Services renderer: reads `services.json`; renders the heading and the media
  slot (image now, video-ready); fetches the referenced `.md`, runs **marked.js**
  to render it into the left column.
- Registers the left list as a scrollable region with `js/folds.js` so the
  fold-advance hand-off (§2) works.

This is the first fold to load marked.js (from CDN).

---

## 8. Deferred / out of scope

- **Actual media** (image or video) + hosting choice if video — later.
- **"A Life Story" description** (cut off) and any items below it — to be supplied.
- **Real design system** — fonts, colors, spacing.
- **Mobile polish** — sensible defaults only (columns stack; the fold likely
  scrolls normally rather than pinning on small screens). Refined later.

---

## 9. Assumptions to confirm

- Scroll hand-off works as in §2 (scroll reads the list first, then advances
  folds at the list's top/bottom). If you instead want Services to advance only
  via nav clicks (scroll never leaves the list), say so.
- The right column is vertically pinned for the full fold; heading sits above
  the media within it.

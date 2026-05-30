# Memory Parlour — About Us Fold Spec

> Scope: the **About Us** fold only. The shared shell (header `<site-nav>`, fold
> navigation system, base tokens) is already built and assumed implemented per
> the Home spec — this fold is an increment that fills the stubbed `about`
> section and adds its own content, CSS, and JS. It introduces **video** into
> the media model.

---

## 1. Context

- **Route:** `/about-us` · **Fold id:** `about` · second in scroll order.
- **Active nav:** when this fold is active, `ABOUT US` shows the highlighted
  active state (the design confirms this behavior).
- Header is the shared `<site-nav>`, unchanged.

---

## 2. Layout — three regions (within one 100vh fold, below the fixed header)

1. **Video block (upper area).** A wide landscape video region with the **same
   left/right cream gutters and crop treatment as the Home image** — contained,
   not bleeding off any viewport edge. Sits just below the header; the poem and
   heading sit on cream below it. Height is sized so header + video + bottom row
   all fit within 100vh.
2. **Poem (bottom-left).** Italic serif, left-aligned, six lines (see §4).
3. **Heading block (bottom-right).** Two stacked, right-aligned lines:
   `Knowing` (small) above `The Memory Parlour` (large, bold).

The poem and heading form a two-column band along the bottom of the fold.

> Note: the **"INTRO VIDEO"** text in the mockup is a placeholder marker only —
> it does **not** appear in the build. The region renders just the video (poster
> stand-in for now).

---

## 3. Video behavior

Rendered as a `<video>` element, driven by the typed `media` object (§4).

- **Playback:** `autoplay` + `loop` + `playsinline`.
- **Audio is undecided — the config keeps both paths open.** One technical
  constraint to flag: browsers block autoplay when a video has sound, so the
  video **must start muted** to autoplay reliably, regardless of the final
  audio decision. The two accommodated outcomes:
  - *Silent background video:* `muted: true`, no control.
  - *Video with sound:* still starts muted (to satisfy autoplay), plus an
    on-screen mute/unmute button the user taps to enable audio (the tap is the
    user gesture browsers require to unmute).
  Both are switched via `muted` + `showMuteControl` in the JSON — no code change.
- **Placeholder now:** there is no video source yet, so the region shows the
  **poster image** (a stand-in). When the real `src` is added, it autoplays.
- **Lazy-load + lifecycle:** because the fold is off-screen on load, the video
  source isn't fetched until the About fold becomes active; it plays on
  activation and pauses when the fold is left (handled by the existing fold
  controller).
- **Hosting:** the real video will exceed the 25 MiB static-asset cap, so `src`
  will point at a Cloudflare Stream or R2 URL. Which one is decided later;
  nothing here assumes either.

---

## 4. Content model — `content/about.json`

The `media` object extends the Home media shape with video fields (an `image`
type simply ignores them; a `video` type uses them).

```json
{
  "fold": "about",
  "media": {
    "type": "video",
    "src": "",
    "poster": "/assets/images/about-video-poster-placeholder.jpg",
    "autoplay": true,
    "loop": true,
    "muted": true,
    "showMuteControl": false
  },
  "poem": [
    "We are the keepers of dinner-table folklore.",
    "The cataloguers of grandmother's perfume.",
    "The translators of the handwriting",
    "no one can read anymore.",
    "We do not collect the past.",
    "We tend to it, slowly, save it to be savoured for years."
  ],
  "heading": {
    "eyebrow": "Knowing",
    "title": "The Memory Parlour"
  }
}
```

- `poem` is an array of lines so the deliberate line breaks (e.g. "The
  translators of the handwriting" / "no one can read anymore." as one sentence
  across two lines) are preserved exactly.
- `src: ""` → renderer shows the poster as a static placeholder until a source
  is supplied.

---

## 5. Typography

Reusing the placeholder families (final faces set in the design-system pass):

| Element                    | Family (placeholder)        | Treatment                    |
|----------------------------|-----------------------------|------------------------------|
| Poem                       | Cormorant Garamond *italic* | left-aligned, multi-line     |
| `The Memory Parlour` title | Jost **bold**               | large, right-aligned         |
| `Knowing` eyebrow          | Jost regular                | small, right-aligned         |

Note: the bottom-right `The Memory Parlour` is the **bold sans** treatment —
distinct from the serif logo wordmark in the header.

---

## 6. CSS — `css/folds/about.css`

Per-fold styles only (base tokens, header, and the fold/transition framework
already live in `base.css`):

- Video block: gutter widths matching Home, crop/object-fit, height sizing to
  keep the fold within 100vh.
- Poem: italic serif type scale, line spacing, bottom-left placement.
- Heading block: bold/regular sans scale, bottom-right placement.
- Bottom two-column band layout (poem | heading).

Linked in `index.html` alongside `base.css` and `home.css`.

---

## 7. JavaScript — `js/about.js`

- About-fold renderer: reads `about.json`; builds the `<video>` (applying
  `autoplay`/`loop`/`muted`/`playsinline`, optional mute/unmute control,
  poster, lazy `src`), the poem lines, and the heading block.
- Play/pause + lazy-load on fold activation are driven by the existing
  `js/folds.js` controller (this fold registers its media with it).

---

## 8. Deferred / out of scope

- **Actual video file + hosting choice** (Stream vs R2) — later.
- **Final audio decision** (silent vs sound) — config keeps both open; no rebuild needed.
- **Final poster image** — placeholder until supplied.
- **Real design system** — fonts, colors, spacing.
- **Mobile polish** — sensible defaults only (stack the poem and heading, shrink
  the video block); refined later.

---

## 9. Assumptions to confirm

- The bottom band is a two-column split (poem left, heading right) on cream,
  with the video contained above — matching the mockup.
- The mute/unmute control, when enabled, sits as a small overlay in a corner of
  the video block (placement finalized in the design pass).

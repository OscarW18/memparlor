# Memory Parlour — FAQs Fold Spec

> Scope: the **FAQs** fold only. Builds on the implemented shell and the media
> model. Introduces three things: a **per-fold header treatment** (the header is
> shared/fixed, so this fold overrides it), a **see-through/knockout logo**
> filled with the fold's image, and a reusable **image `position` (crop)
> control** plus a **dev-only focal-point picker**.

---

## 0. Build decisions (resolved)

These supersede any conflicting detail below; the original intent is kept for
context but scoped to what we're building now.

1. **Knockout logo — approximate CSS fill, not a true cut-out.** Fill the logo
   letters with the FAQ image via `background-clip: text` (pure CSS). We do **not**
   pixel-align the fill to the photo behind it (no JS geometry / resize handler).
   A faithful, aligned cut-out is deferred to the design-system pass. See §2.1.
2. **No `data-header-theme` machinery.** The controller already mirrors
   `<html data-fold="faqs">`, so the knockout is keyed off that in CSS and resets
   automatically on leave. `js/folds.js` needs **no** theme-switching code. The
   only JS-side need is handing the **image URL** to the header (a CSS custom
   property, e.g. `--knockout-image`). See §2 / §9.
3. **Fonts — keep currently loaded weights (≤600).** Do **not** add 700/bold to
   the font load. Questions use Cormorant italic 600; the `Experience` title uses
   Jost 500. See §7.
4. **`fit`/`position` crop control — FAQ-only for now.** Add it to the shared
   `createMedia` image branch and use it on FAQs. **Leave Home/About/Services/
   Process untouched** (Home also uses its own private renderer). Full rollout to
   every fold is a **dedicated later task**. See §4.
5. **Dev focal-point picker — build now, gated on `?dev`.** Loaded/activated only
   under `?dev`; since there's no build step yet it still lives on the static host
   (just never runs for normal visitors). True stripping waits for the SSR pass.
   See §5.

---

## 1. Context

- **Route:** `/faqs` · **Fold id:** `faqs` · fifth in scroll order.
- **Active nav:** `FAQS` highlighted when active.
- Fits **one viewport** — three Q&A pairs, no overflow, no internal scroll.
- Layout regions:
  - **Left:** full-height image column (bleeds to the left/top/bottom edges).
  - **Center:** the Q&A list.
  - **Bottom-right:** the "The / Experience" heading block.

---

## 2. Header — per-fold treatment (refactor)

The shared `<site-nav>` is fixed and identical across folds, so a per-page look
is a **per-fold treatment keyed off the active fold**. The controller already
mirrors the active fold on `<html data-fold="…">`, so the treatment is **pure CSS**
keyed on `html[data-fold="faqs"]` — it applies on enter and reverts on leave with
no JS theme-switching. (No `data-header-theme` attribute is introduced; see §0.2.)

- **Default treatment** (Home / About / Services / Process / Contact):
  dark text on cream — the original look.
- **FAQ treatment:** the **logo** uses the see-through/knockout effect; the
  **nav links stay normal dark text on cream**.

### 2.1 See-through logo (knockout) — approximate CSS fill
- The logo's three text parts are filled with the **fold's left image** via
  `background-clip: text` (transparent letter fill revealing the photo).
- **Approximate fill only (see §0.1).** The fill is *not* pixel-aligned to the
  image's on-screen position — the letters read as image-filled, not as an exact
  cut-out of the photo directly behind them. A faithful, geometry-aligned cut-out
  (JS that matches the column's cover-crop and recomputes on resize) is deferred
  to the design-system pass.
- The image URL is the only dynamic input the header needs. The controller (or
  the FAQ renderer) exposes it as a CSS custom property (e.g. `--knockout-image`)
  the logo's `background-image` reads; no per-fold content is loaded by the
  controller itself.
- **Nav links are excluded** — the image is left-only, so there's nothing behind
  the right-side nav to reveal; they remain dark text on cream.

### 2.2 Legibility
- See-through letters reveal whatever is behind them, so a light image patch
  yields low contrast.
- Mitigation: use the image **`position`** control (§4) to slide a darker slice
  of the image behind the logo; tune it with the picker (§5).
- Adaptive blend (`mix-blend-mode`) remains a possible fallback if the effect is
  ever too subtle, but is **not** used by default.

---

## 3. Left image — full-height column

- Full-height column on the **left**, bleeding to the left, top, and bottom edges.
- The displayed image is a **crop of a larger source** — `object-fit: cover`
  fills the column; `object-position` (from `media.position`) picks the visible
  slice.
- This is the **same image** the knockout logo reveals (§2.1).

---

## 4. Image `position` control (reusable across all folds)

Extends the shared media object so any oversized image's crop is adjustable from
content, no re-cropping the file:

| Field      | Meaning                                  | Default    |
|------------|------------------------------------------|------------|
| `fit`      | CSS `object-fit`                         | `"cover"`  |
| `position` | CSS `object-position` (the visible crop) | `"center"` |

- `position` accepts coordinates (`"50% 20%"` — x then y; `0%` = top/left,
  `100%` = bottom/right) or keywords (`"top"`, `"left center"`).
- **Scope now: FAQ-only (see §0.4).** Added to the shared `createMedia` image
  branch and used on FAQs. The styles are applied **only when the field is
  present**, so the already-built folds' own CSS isn't overridden. Home/About/
  Services/Process are left untouched for now; a full rollout to every fold
  (including migrating `home.js` off its private media renderer) is a **dedicated
  later task**. Conceptually it still applies to any image/video — just not wired
  up everywhere yet.
- **Zoom/scale is intentionally not included** (positioning only, per decision).

---

## 5. Dev-only focal-point picker

A development aid for finding `position` values, **built now and gated on `?dev`**
(see §0.5).

- **Activation:** a `?dev` query flag (off by default).
- **Behavior:** drag on the image to reposition the crop live; it displays the
  resulting `object-position` string to copy into the fold's JSON.
- **Implementation:** vanilla JS, loaded/activated only when the flag is present
  — no build step. **Note:** with no build/SSR layer yet, the file still lives on
  the static host; `?dev`-gating means it never runs for normal visitors, but it
  is **not** truly stripped from the shipped assets. Real exclusion from the
  production bundle waits for the Worker/SSR pass.

---

## 6. Content model — single file `content/faqs.json`

```json
{
  "fold": "faqs",
  "heading": {
    "eyebrow": "The",
    "title": "Experience"
  },
  "media": {
    "type": "image",
    "src": "/assets/images/faqs-image-placeholder.jpg",
    "fit": "cover",
    "position": "center"
  },
  "faqs": [
    {
      "question": "Is the process personalised?",
      "answer": [
        "Every archive is approached differently.",
        "We spend time understanding your story, materials, and comfort levels before shaping the process around you. No two projects are handled the same way."
      ]
    },
    {
      "question": "Is my information kept private?",
      "answer": [
        "Absolutely!",
        "Any personal material shared with us remains confidential and is never published or shared without your permission."
      ]
    },
    {
      "question": "What are the deliverables and timelines?",
      "answer": [
        "Each archive is unique, and timelines vary depending on the materials and scope of the project.",
        "All deliverables, timelines, and expectations are discussed clearly beforehand."
      ]
    }
  ]
}
```

- `answer` is an **array of paragraphs** so the **deliberate breaks** (punchy
  opening line → elaboration) are preserved exactly.
- No `headerTheme` field — the knockout treatment is keyed in CSS off
  `html[data-fold="faqs"]` (see §0.2). The same image referenced in `media` feeds
  the knockout logo fill via the `--knockout-image` custom property.
- `position` is the crop control (defaults to `"center"`; tune with the picker).

---

## 7. Typography

Weights are limited to what's currently loaded — Cormorant ≤600, Jost ≤500. No
700/bold is added in this pass (see §0.3); true bold waits for the design-system
pass.

| Element                  | Family (placeholder)               | Treatment            |
|--------------------------|------------------------------------|----------------------|
| Question                 | Cormorant Garamond *italic 600*    | left, above answer   |
| Answer paragraphs        | Cormorant Garamond *italic 400*    | left, stacked        |
| `Experience` title       | Jost 500                           | large, right-aligned |
| `The` eyebrow            | Jost regular                       | small, right-aligned |
| Logo (knockout)          | existing logo fonts                | filled with image    |

---

## 8. CSS — `css/folds/faqs.css`

Per-fold styles only:
- Three-region layout: full-height left image | centered Q&A list | bottom-right heading.
- Q&A spacing/rhythm; question vs answer-paragraph type treatment.
- Left image: full-height, `object-fit`/`object-position` from the media object.
- FAQ header theme: knockout logo (`background-clip: text` on the logo, fed the
  fold image), nav links left as default dark text.

Base header/transition/token styles stay in `base.css`. The FAQ header treatment
is keyed in CSS off `html[data-fold="faqs"]` (already mirrored by the controller),
so there's no JS theme-switching hook — the knockout rules live here and read the
`--knockout-image` custom property for the logo fill (see §0.2 / §2.1).

---

## 9. JavaScript

| File          | Change                                                                                  |
|---------------|-----------------------------------------------------------------------------------------|
| `js/faqs.js`  | FAQ renderer: reads `faqs.json`; renders Q&A (answers as paragraph arrays), heading, and the left image with `fit`/`position`. Also publishes the image URL as the `--knockout-image` custom property for the logo fill. |
| `js/folds.js` | **No theme-switching code needed** — the existing `data-fold` mirror drives the CSS treatment. (Unchanged for FAQs.) |
| `js/nav.js`   | **No theme attribute / image logic** — the knockout is pure CSS keyed on `html[data-fold="faqs"]`, reading `--knockout-image`. (Unchanged for FAQs.) |
| `js/media.js` | Extend `createMedia`'s image branch to apply `fit`/`position` (`object-fit`/`object-position`) **only when present**. |
| dev picker    | `js/faqs-dev-picker.js`: focal-point picker, loaded/activated only under `?dev`.         |

---

## 10. Deferred / out of scope
- **Actual image asset** + final crop `position` — placeholder for now
  (`assets/images/faqs-image-placeholder.jpg` to be added).
- **True knockout cut-out** — geometry-aligned fill (letters showing the exact
  slice of the photo behind them, recomputed on resize). This pass ships the
  approximate CSS fill only (§0.1).
- **Full `fit`/`position` rollout** — wiring the crop control into every fold
  (and migrating `home.js` off its private media renderer) is a dedicated later
  task (§0.4).
- **True production stripping of the dev picker** — waits for the Worker/SSR pass;
  `?dev`-gating is the interim (§0.5).
- **Bold font weights** — Cormorant 700 italic / Jost 700 land with the
  design-system pass (§0.3).
- **Real design system** — fonts, colors, spacing.
- **Mobile polish** — sensible defaults only (stack image/Q&A/heading; the
  knockout logo may simplify on small screens); refined later. Note: stacking
  three regions in one viewport may force the "no internal scroll" rule to relax
  on small screens — revisit when mobile polish lands.

---

## 11. Assumptions to confirm
- Fits one viewport (three FAQs, no internal scroll).
- Knockout logo is fed the **same** left-column image (not a separate asset).
- Header reverts to the default dark-on-cream treatment on every other fold.

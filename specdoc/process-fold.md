# Memory Parlour — Process Fold Spec

> Scope: the **Process** fold only. Builds on the implemented shell and the media
> model (About). Content is **JSON only** — no markdown / marked.js for this fold.

---

## 1. Context

- **Route:** `/process` · **Fold id:** `process` · fourth in scroll order.
- **Active nav:** `PROCESS` highlighted when active.
- Fits **one viewport** (no internal scroll): text content in the upper area, a
  video band filling the lower area and **bleeding off the bottom edge** (same
  treatment as the Home image).

---

## 2. Layout

**Upper area**

- **Heading block (top-right):** eyebrow + title, bold sans, right-aligned —
  same component as Services. Eyebrow `How we`, title `Preserve`.
- **Lede (top-left):** a short bold-italic serif intro, two lines.
- **Numbered steps (left, below the lede):** three items, each a number + title
  on one line and a description below it. The number ("1.", "2.", "3.") is
  derived from the array order by the renderer.

**Lower area**

- **Video band:** full width with the same left/right cream gutters used
  elsewhere, **bleeding off the bottom** of the viewport. The mockup's **"VIDEO"**
  label is a marker only — it does **not** appear in the build. Same media object
  and `autoplay`/`loop`/`muted`/`showMuteControl` config as About; lazy-loaded
  and played/paused on fold activation by the existing controller.

---

## 3. Content model — single file `content/process.json`

```json
{
  "fold": "process",
  "heading": {
    "eyebrow": "How we",
    "title": "Preserve"
  },
  "lede": [
    "No two archives are approached the same way.",
    "Each story is bespoke in nature, with care for the people, memories, and materials that make it uniquely yours."
  ],
  "steps": [
    {
      "title": "Listening",
      "description": "We spend time with you, listening, sorting through memories, and understanding where the story lives."
    },
    {
      "title": "Documenting",
      "description": "Photographs, negatives, letters, recordings, and objects are carefully organised, scanned, and documented."
    },
    {
      "title": "Shaping",
      "description": "We slowly build the final archive, whether as a film, book, audio piece, or personal collection, preserving your memories in a way that feels true to you."
    }
  ],
  "media": {
    "type": "video",
    "src": "",
    "poster": "/assets/images/process-video-poster-placeholder.jpg",
    "autoplay": true,
    "loop": true,
    "muted": true,
    "showMuteControl": false
  }
}
```

- **Why JSON here:** the content is short and regular (number + title +
  one-sentence description) with distinct fields and no markdown formatting in
  use. JSON models it directly, keeps the fold to one file, and skips marked.js.
- The step **number** is rendered from array order (`index + 1` → "1." etc.), so
  it isn't duplicated in the data.
- The **lede** stays a two-line array so its line break is preserved and it can
  be styled separately (bold italic) from the step descriptions.

---

## 4. Typography

| Element            | Family (placeholder)               | Treatment                   |
|--------------------|------------------------------------|-----------------------------|
| Lede               | Cormorant Garamond **bold italic** | two lines, top-left, larger |
| Step number+title  | Cormorant Garamond *italic*        | number + title on one line  |
| Step description   | Cormorant Garamond *italic*        | paragraph below the title   |
| `Preserve` title   | Jost **bold**                      | large, right-aligned        |
| `How we` eyebrow   | Jost regular                       | small, right-aligned        |

Note: the lede is **bold** italic, distinct from the regular-italic steps.

---

## 5. CSS — `css/folds/process.css`

Per-fold styles only:

- Upper grid: lede + steps (left) | heading block (top-right).
- Lower video band: full width with cream gutters, bleeding off the bottom edge.
- Step list typography (number+title line, description paragraph) and lede styling.

Linked in `index.html` alongside the existing stylesheets.

---

## 6. JavaScript — `js/process.js`

- Process renderer: reads `content/process.json` and renders the heading, the
  lede, the numbered steps (number from array order), and the video (reusing
  About's video handling — lazy `src`, poster, autoplay/loop/mute, optional
  control).
- Play/pause + lazy-load on activation handled by `js/folds.js` as before.
- **No marked.js** for this fold.

No new controller capability needed.

---

## 7. Deferred / out of scope

- **Actual video** + hosting choice — later.
- **Real design system** — fonts, colors, spacing.
- **Mobile polish** — sensible defaults only (stack heading/lede/steps, video
  below); refined later.

---

## 8. Assumptions to confirm

- The fold fits one viewport with no internal scroll, and the video band bleeds
  off the bottom edge (like Home). If the steps ever grow past the viewport,
  we'd switch this to a scrollable fold like Services.

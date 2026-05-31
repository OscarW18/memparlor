/* ==========================================================================
   Services-fold renderer.
   Reads content/services.json and builds the right-column heading + media slot
   (image now, video-ready — same typed `media` shape as About, built by the
   shared helpers in js/media.js), then fetches the referenced markdown and
   renders it with the in-repo parser into the scrollable left-column list.

   Registers the left list as the fold's internally-scrollable region with the
   controller, so scrolling reads the list first and only advances folds at its
   top/bottom edges (see js/folds.js). If the media is a video, also registers
   the fold's play/pause lifecycle.
   ========================================================================== */

(async () => {
  const bodyEl = document.querySelector('[data-services-body]');
  const headingEl = document.querySelector('[data-services-heading]');
  const mediaEl = document.querySelector('[data-services-media]');
  if (!bodyEl || !headingEl || !mediaEl) return;

  let data;
  try {
    data = await fetch('/content/services.json').then((r) => r.json());
  } catch (err) {
    console.error('[services] failed to load services.json', err);
    return;
  }

  window.MemoryParlour.createHeading(headingEl, data.heading, { prefix: 'services' });
  const media = window.MemoryParlour.createMedia(mediaEl, data.media, { prefix: 'services' });
  await renderBody(bodyEl, data.body);

  // Hand the left list to the controller as this fold's scrollable region.
  window.MemoryParlour?.registerScrollable?.('services', bodyEl);

  // If the media is a video, let the controller drive its play/pause too.
  if (media && window.MemoryParlour?.registerFold) {
    window.MemoryParlour.registerFold('services', {
      onEnter: media.activate,
      onLeave: media.deactivate,
    });
  }

  /**
   * Fetches the markdown body and renders it into the left list with the
   * in-repo parser below (handles the `## h2` + paragraph subset that
   * services.md uses — no third-party markdown dependency).
   */
  async function renderBody(el, file) {
    if (!file) return;
    let md;
    try {
      md = await fetch('/content/' + file).then((r) => r.text());
    } catch (err) {
      console.error('[services] failed to load', file, err);
      return;
    }
    el.innerHTML = renderMarkdown(md);
  }

  // Minimal markdown renderer: `## text` → <h2>, blank-line-separated blocks
  // → <p>. HTML comments and other markdown are dropped/ignored.
  function renderMarkdown(md) {
    return md
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const h2 = block.match(/^##\s+(.*)$/);
        if (h2) return `<h2>${escapeHtml(h2[1])}</h2>`;
        if (block.startsWith('<!--')) return '';
        return `<p>${escapeHtml(block)}</p>`;
      })
      .join('\n');
  }

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
})();

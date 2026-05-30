/* ==========================================================================
   Services-fold renderer.
   Reads content/services.json and builds the right-column heading + media slot
   (image now, video-ready — same typed `media` shape as About), then fetches
   the referenced markdown and renders it with marked.js into the scrollable
   left-column list.

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

  renderHeading(headingEl, data.heading);
  const media = renderMedia(mediaEl, data.media);
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

  function renderHeading(el, heading) {
    el.textContent = '';
    if (!heading) return;
    const eyebrow = document.createElement('div');
    eyebrow.className = 'services__eyebrow';
    eyebrow.textContent = heading.eyebrow || '';

    const title = document.createElement('div');
    title.className = 'services__title';
    title.textContent = heading.title || '';

    el.append(eyebrow, title);
  }

  /**
   * Fetches the markdown body and renders it into the left list. Uses marked.js
   * when present; falls back to a minimal `## h2` / paragraph parse if the CDN
   * script is unavailable, so the list still renders offline.
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
    el.innerHTML = window.marked?.parse ? window.marked.parse(md) : fallbackMarkdown(md);
  }

  // Minimal stand-in for marked: `## text` → <h2>, blank-line-separated blocks
  // → <p>. HTML comments and other markdown are dropped/ignored.
  function fallbackMarkdown(md) {
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

  /**
   * Builds the media element and, for video, returns activation controls (else
   * null). Mirrors About's media model: image renders eagerly; video shows its
   * poster, lazy-attaches `src` on first activation, and always starts muted.
   */
  function renderMedia(el, media) {
    el.textContent = '';
    if (!media) return null;

    if (media.type === 'image') {
      const img = document.createElement('img');
      img.className = 'services__media-el';
      img.src = media.src;
      img.alt = media.alt || '';
      img.loading = 'lazy';
      el.appendChild(img);
      return null;
    }

    if (media.type !== 'video') return null;

    const video = document.createElement('video');
    video.className = 'services__media-el';
    if (media.poster) video.poster = media.poster;
    video.loop = !!media.loop;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.muted = true; // browsers block autoplay for videos with sound
    video.preload = 'none';
    el.appendChild(video);

    if (media.showMuteControl) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'services__mute';
      const sync = () => {
        btn.classList.toggle('is-muted', video.muted);
        btn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        btn.setAttribute('aria-pressed', String(!video.muted));
      };
      btn.addEventListener('click', () => {
        video.muted = !video.muted;
        sync();
      });
      sync();
      el.appendChild(btn);
    }

    let srcAttached = false;
    const hasSource = typeof media.src === 'string' && media.src !== '';

    return {
      activate() {
        if (!hasSource) return; // placeholder: poster only
        if (!srcAttached) {
          video.src = media.src;
          srcAttached = true;
          video.load();
        }
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      },
      deactivate() {
        if (hasSource) video.pause();
      },
    };
  }
})();

/* ==========================================================================
   Shared media + heading renderers.
   The About / Services / Process folds all render the same two pieces — a typed
   media object (image-or-video, with lazy `src`, poster, autoplay/loop/mute, and
   an optional mute control) and a heading block (eyebrow + title). These helpers
   hold that logic once, parameterized by the fold's BEM prefix, so the per-fold
   renderers stay thin and the markup/CSS hooks can't drift between folds.

   Attached to window.MemoryParlour (create-or-reuse, like the fold controller),
   so load order relative to folds.js doesn't matter — just before the fold
   renderers that call them.
   ========================================================================== */

(() => {
  'use strict';
  const NS = (window.MemoryParlour = window.MemoryParlour || {});

  /**
   * Render a heading block (eyebrow + title) into `el`.
   * The eyebrow is a non-heading element; the title is a real heading (default
   * <h2>) so each fold contributes to the document outline. Class hooks are
   * `${prefix}__eyebrow` and `${prefix}__title`.
   *
   * @param {Element} el  container (cleared before rendering)
   * @param {{eyebrow?:string,title?:string}|null|undefined} heading
   * @param {{prefix:string, as?:string}} opts  `as` = title tag, default 'h2'
   */
  NS.createHeading = (el, heading, { prefix, as = 'h2' } = {}) => {
    el.textContent = '';
    if (!heading) return;

    const eyebrow = document.createElement('div');
    eyebrow.className = `${prefix}__eyebrow`;
    eyebrow.textContent = heading.eyebrow || '';

    const title = document.createElement(as);
    title.className = `${prefix}__title`;
    title.textContent = heading.title || '';

    el.append(eyebrow, title);
  };

  /**
   * Build the media element for a fold and, for activation-driven types, return
   * { activate, deactivate } controls (else null). Mirrors the typed `media` model:
   *   - image → renders with the given `imgLoading` (default 'lazy'), plus the
   *     opt-in `fit`/`position`/`zoom` crop control (`zoom` is a scale
   *     multiplier whose origin tracks `position`); returns null.
   *   - video → poster shows immediately; `src` is lazy-attached on the first
   *     activation; the element always starts muted so autoplay isn't blocked;
   *     an optional mute/unmute control is rendered when `showMuteControl`.
   *   - calendly → inline scheduling embed; the Calendly script is injected and
   *     the widget initialised on first `activate` (guarded), so the third-party
   *     script stays off the initial load. Empty `url` → a neutral placeholder
   *     block (no script). `deactivate` is a no-op (the iframe persists hidden).
   * Class hooks: `${prefix}__media-el`, `${prefix}__mute`, `${prefix}__calendly`,
   * `${prefix}__calendly-placeholder`.
   *
   * @param {Element} el  container (cleared before rendering)
   * @param {object|null|undefined} media  typed media object
   * @param {{prefix:string, imgLoading?:string}} opts  `imgLoading` default 'lazy'
   * @returns {{activate:Function, deactivate:Function}|null}
   */
  NS.createMedia = (el, media, { prefix, imgLoading } = {}) => {
    el.textContent = '';
    if (!media) return null;

    if (media.type === 'image') {
      const img = document.createElement('img');
      img.className = `${prefix}__media-el`;
      img.src = media.src;
      img.alt = media.alt || '';
      img.loading = imgLoading || 'lazy';
      // Crop control (opt-in): only set the inline styles when the content
      // supplies them, so folds that rely on their own CSS aren't overridden.
      if (media.fit) img.style.objectFit = media.fit;
      if (media.position) img.style.objectPosition = media.position;
      // Zoom (opt-in): a scale multiplier (1 = no zoom; >1 magnifies into the
      // focal point, <1 shrinks the image within the frame). Origin tracks
      // `position` so it zooms toward the crop you framed. The fold's media
      // container must clip overflow for >1 to read as a tighter crop.
      if (typeof media.zoom === 'number' && media.zoom !== 1) {
        img.style.transform = `scale(${media.zoom})`;
        img.style.transformOrigin = media.position || 'center';
      }
      el.appendChild(img);
      return null;
    }

    // Calendly inline embed. Build the container now; defer the third-party
    // script + widget init to the first activation (see js/contact.js).
    if (media.type === 'calendly') {
      const hasUrl = typeof media.url === 'string' && media.url !== '';

      if (!hasUrl) {
        // No-URL state: a neutral placeholder block, no script ever loaded.
        const placeholder = document.createElement('div');
        placeholder.className = `${prefix}__calendly-placeholder`;
        placeholder.textContent = 'Scheduling opens here.';
        el.appendChild(placeholder);
        return { activate() {}, deactivate() {} };
      }

      const widget = document.createElement('div');
      widget.className = `${prefix}__calendly`;
      el.appendChild(widget);

      const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';
      let inited = false;
      const initWidget = () => {
        window.Calendly?.initInlineWidget?.({ url: media.url, parentElement: widget });
      };

      return {
        activate() {
          if (inited) return; // init exactly once on the first enter
          inited = true;
          if (window.Calendly) {
            initWidget();
            return;
          }
          const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
          if (existing) {
            existing.addEventListener('load', initWidget, { once: true });
            return;
          }
          const s = document.createElement('script');
          s.src = SCRIPT_SRC;
          s.async = true;
          s.addEventListener('load', initWidget, { once: true });
          document.head.appendChild(s);
        },
        deactivate() {}, // iframe persists in the hidden fold — nothing to tear down
      };
    }

    if (media.type !== 'video') return null;

    const video = document.createElement('video');
    video.className = `${prefix}__media-el`;
    if (media.poster) video.poster = media.poster;
    video.loop = !!media.loop;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    // Must start muted regardless of the final audio decision — browsers block
    // autoplay for videos with sound.
    video.muted = true;
    video.preload = 'none'; // nothing fetched until activation
    el.appendChild(video);

    // Optional mute/unmute control (small corner overlay). Present only when the
    // video is meant to carry sound the user can enable.
    if (media.showMuteControl) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `${prefix}__mute`;
      const sync = () => {
        btn.classList.toggle('is-muted', video.muted);
        btn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        btn.setAttribute('aria-pressed', String(!video.muted));
      };
      btn.addEventListener('click', () => {
        video.muted = !video.muted; // the tap is the gesture browsers require
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
        if (p?.catch) p.catch(() => {}); // ignore autoplay rejections
      },
      deactivate() {
        if (hasSource) video.pause();
      },
    };
  };
})();

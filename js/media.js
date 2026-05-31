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
   * Build the media element for a fold and, for video, return activation
   * controls (else null). Mirrors the typed `media` model:
   *   - image → renders with the given `imgLoading` (default 'lazy'); returns null.
   *   - video → poster shows immediately; `src` is lazy-attached on the first
   *     activation; the element always starts muted so autoplay isn't blocked;
   *     an optional mute/unmute control is rendered when `showMuteControl`.
   * Class hooks: `${prefix}__media-el` and `${prefix}__mute`.
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
      el.appendChild(img);
      return null;
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

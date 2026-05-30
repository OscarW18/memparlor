/* ==========================================================================
   Home-fold renderer.
   Reads content/home.json and builds the data-driven segmented headline
   (upright/italic split) plus the hero media into the Home fold's DOM.

   Headline rule: consecutive `text` segments join with a single space;
   `{ "break": true }` starts a new line.
   ========================================================================== */

(async () => {
  const headlineEl = document.querySelector('[data-home-headline]');
  const mediaEl = document.querySelector('[data-home-media]');
  if (!headlineEl || !mediaEl) return;

  let data;
  try {
    data = await fetch('/content/home.json').then((r) => r.json());
  } catch (err) {
    console.error('[home] failed to load home.json', err);
    return;
  }

  renderHeadline(headlineEl, data.headline);
  renderMedia(mediaEl, data.media);

  function renderHeadline(el, segments = []) {
    el.textContent = '';
    let lineHasText = false; // track whether to prepend a separating space

    for (const seg of segments) {
      if (seg.break) {
        el.appendChild(document.createElement('br'));
        lineHasText = false;
        continue;
      }
      if (lineHasText) el.appendChild(document.createTextNode(' '));

      const span = document.createElement('span');
      span.className = `home__seg home__seg--${seg.style === 'italic' ? 'italic' : 'upright'}`;
      span.textContent = seg.text;
      el.appendChild(span);
      lineHasText = true;
    }
  }

  function renderMedia(el, media) {
    el.textContent = '';
    if (!media) return;

    // Only `image` is modeled today; the typed object leaves room for a future
    // swap (e.g. a video fold) without a schema change.
    if (media.type === 'image') {
      const img = document.createElement('img');
      img.src = media.src;
      img.alt = media.alt || '';
      img.loading = 'eager';
      el.appendChild(img);
    }
  }
})();

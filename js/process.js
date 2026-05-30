/* ==========================================================================
   Process-fold renderer.
   Reads content/process.json and builds the heading (top-right), the bold-italic
   lede (top-left), the numbered steps (number derived from array order), and the
   lower video band. Registers the video's lifecycle with the fold controller so
   it lazy-loads + plays on activation and pauses on leave.

   JSON only — no markdown / marked.js for this fold. The video handling mirrors
   About's media model (lazy `src`, poster, autoplay/loop, always-muted start,
   optional mute control).
   ========================================================================== */

(async () => {
  const ledeEl = document.querySelector('[data-process-lede]');
  const stepsEl = document.querySelector('[data-process-steps]');
  const headingEl = document.querySelector('[data-process-heading]');
  const mediaEl = document.querySelector('[data-process-media]');
  if (!ledeEl || !stepsEl || !headingEl || !mediaEl) return;

  let data;
  try {
    data = await fetch('/content/process.json').then((r) => r.json());
  } catch (err) {
    console.error('[process] failed to load process.json', err);
    return;
  }

  renderLede(ledeEl, data.lede);
  renderSteps(stepsEl, data.steps);
  renderHeading(headingEl, data.heading);
  const media = renderMedia(mediaEl, data.media);

  // Hand the video's play/pause + lazy-load to the fold controller.
  if (media && window.MemoryParlour?.registerFold) {
    window.MemoryParlour.registerFold('process', {
      onEnter: media.activate,
      onLeave: media.deactivate,
    });
  }

  // Lede — each line its own element so the deliberate two-line break is kept.
  function renderLede(el, lines = []) {
    el.textContent = '';
    for (const line of lines) {
      const p = document.createElement('p');
      p.className = 'process__lede-line';
      p.textContent = line;
      el.appendChild(p);
    }
  }

  // Steps — the number ("1.", "2.", …) is derived from array order, not data.
  function renderSteps(el, steps = []) {
    el.textContent = '';
    steps.forEach((stepData, i) => {
      const li = document.createElement('li');
      li.className = 'process__step';

      const head = document.createElement('div');
      head.className = 'process__step-head';
      const num = document.createElement('span');
      num.className = 'process__step-num';
      num.textContent = `${i + 1}.`;
      const title = document.createElement('span');
      title.className = 'process__step-title';
      title.textContent = stepData.title || '';
      head.append(num, title);

      const desc = document.createElement('p');
      desc.className = 'process__step-desc';
      desc.textContent = stepData.description || '';

      li.append(head, desc);
      el.appendChild(li);
    });
  }

  function renderHeading(el, heading) {
    el.textContent = '';
    if (!heading) return;
    const eyebrow = document.createElement('div');
    eyebrow.className = 'process__eyebrow';
    eyebrow.textContent = heading.eyebrow || '';

    const title = document.createElement('div');
    title.className = 'process__title';
    title.textContent = heading.title || '';

    el.append(eyebrow, title);
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
      img.className = 'process__media-el';
      img.src = media.src;
      img.alt = media.alt || '';
      img.loading = 'lazy';
      el.appendChild(img);
      return null;
    }

    if (media.type !== 'video') return null;

    const video = document.createElement('video');
    video.className = 'process__media-el';
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
      btn.className = 'process__mute';
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

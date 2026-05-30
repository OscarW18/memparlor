/* ==========================================================================
   About-fold renderer.
   Reads content/about.json and builds the video block (typed `media` object),
   the poem, and the bottom-right heading. Registers the video's lifecycle with
   the fold controller so it lazy-loads + plays on activation and pauses on
   leave — the controller owns "when a fold is active".

   Media model: extends Home's `media` with video fields. `type: "image"`
   ignores them; `type: "video"` uses them. An empty `src` shows the poster as a
   static placeholder until a real source (Stream/R2 URL) is supplied.
   ========================================================================== */

(async () => {
  const mediaEl = document.querySelector('[data-about-media]');
  const poemEl = document.querySelector('[data-about-poem]');
  const headingEl = document.querySelector('[data-about-heading]');
  if (!mediaEl || !poemEl || !headingEl) return;

  let data;
  try {
    data = await fetch('/content/about.json').then((r) => r.json());
  } catch (err) {
    console.error('[about] failed to load about.json', err);
    return;
  }

  renderPoem(poemEl, data.poem);
  renderHeading(headingEl, data.heading);
  const media = renderMedia(mediaEl, data.media);

  // Hand the video's play/pause + lazy-load to the fold controller.
  if (media && window.MemoryParlour?.registerFold) {
    window.MemoryParlour.registerFold('about', {
      onEnter: media.activate,
      onLeave: media.deactivate,
    });
  }

  function renderPoem(el, lines = []) {
    el.textContent = '';
    // Each line is kept as its own element so the deliberate breaks (e.g. one
    // sentence split across two lines) are preserved exactly.
    for (const line of lines) {
      const p = document.createElement('p');
      p.className = 'about__poem-line';
      p.textContent = line;
      el.appendChild(p);
    }
  }

  function renderHeading(el, heading) {
    el.textContent = '';
    if (!heading) return;
    const eyebrow = document.createElement('div');
    eyebrow.className = 'about__eyebrow';
    eyebrow.textContent = heading.eyebrow || '';

    const title = document.createElement('div');
    title.className = 'about__title';
    title.textContent = heading.title || '';

    el.append(eyebrow, title);
  }

  /**
   * Builds the media element and returns activation controls, or null.
   * For video: poster shows immediately; the `src` is only attached on the
   * first activation (lazy), and the element always starts muted so autoplay is
   * never blocked.
   */
  function renderMedia(el, media) {
    el.textContent = '';
    if (!media) return null;

    if (media.type === 'image') {
      const img = document.createElement('img');
      img.className = 'about__media-el';
      img.src = media.src;
      img.alt = media.alt || '';
      el.appendChild(img);
      return null;
    }

    if (media.type !== 'video') return null;

    const video = document.createElement('video');
    video.className = 'about__media-el';
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
      btn.className = 'about__mute';
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
  }
})();

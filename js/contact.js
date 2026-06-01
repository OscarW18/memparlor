/* ==========================================================================
   Contact-fold renderer (the sixth / last fold).
   Reads content/contact.json and builds the three regions: the left lede + body
   (italic serif), the right Calendly inline embed (shared createMedia's new
   `calendly` type), and the bottom-right heading (shared createHeading).

   The embed is lazy: createMedia returns { activate, deactivate } and we wire
   them to the controller via registerFold — identical to the About/Process
   videos — so the Calendly script is fetched only on the first enter, not on
   page load. With an empty `url` the embed renders a neutral placeholder and the
   script is never loaded.
   ========================================================================== */

(async () => {
  const ledeEl = document.querySelector('[data-contact-lede]');
  const bodyEl = document.querySelector('[data-contact-body]');
  const mediaEl = document.querySelector('[data-contact-media]');
  const headingEl = document.querySelector('[data-contact-heading]');
  if (!ledeEl || !bodyEl || !mediaEl || !headingEl) return;

  let data;
  try {
    data = await fetch('/content/contact.json').then((r) => r.json());
  } catch (err) {
    console.error('[contact] failed to load contact.json', err);
    return;
  }

  ledeEl.textContent = data.lede || '';
  renderBody(bodyEl, data.body);
  window.MemoryParlour.createHeading(headingEl, data.heading, { prefix: 'contact' });
  const media = window.MemoryParlour.createMedia(mediaEl, data.media, { prefix: 'contact' });

  // Hand the embed's lazy script-injection/init to the fold controller.
  if (media && window.MemoryParlour?.registerFold) {
    window.MemoryParlour.registerFold('contact', {
      onEnter: media.activate,
      onLeave: media.deactivate,
    });
  }

  // Body — each paragraph its own element (array preserves deliberate breaks).
  function renderBody(el, lines = []) {
    el.textContent = '';
    for (const line of lines) {
      const p = document.createElement('p');
      p.className = 'contact__body-line';
      p.textContent = line;
      el.appendChild(p);
    }
  }
})();

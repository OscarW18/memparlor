/* ==========================================================================
   Dev-only focal-point picker (loaded ONLY under ?dev — see js/faqs.js).
   Drag on the FAQ image to reposition its crop live; the resulting CSS
   `object-position` string is shown in a small readout to copy into
   content/faqs.json (`media.position`). The same value drives the knockout
   logo's fill position so you can tune legibility (§2.2) at the same time.

   Vanilla JS, no build step, nothing shipped to normal visitors (they never
   request this file). True stripping waits for the SSR pass.
   ========================================================================== */

(() => {
  'use strict';

  const img = document.querySelector('[data-faqs-media] .faqs__media-el');
  if (!img) {
    console.warn('[faqs-dev] no FAQ image found — picker not started');
    return;
  }

  // Readout chip (fixed, bottom-left, above the fold content).
  const readout = document.createElement('div');
  readout.setAttribute('data-faqs-dev', '');
  Object.assign(readout.style, {
    position: 'fixed',
    left: '16px',
    bottom: '16px',
    zIndex: '9999',
    font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
    background: 'rgba(20,19,16,0.9)',
    color: '#f7f5e7',
    padding: '8px 10px',
    borderRadius: '6px',
    pointerEvents: 'none',
    whiteSpace: 'pre',
  });
  document.body.appendChild(readout);

  const fmt = (n) => `${Math.round(n)}%`;
  const setPosition = (xPct, yPct) => {
    const pos = `${fmt(xPct)} ${fmt(yPct)}`;
    img.style.objectPosition = pos;
    // Keep the knockout logo fill in sync so legibility tuning is visible too.
    document.documentElement.style.setProperty('--knockout-pos', pos);
    readout.textContent = `object-position: ${pos}\n"position": "${pos}"  ← copy to faqs.json\ndrag on the image · ?dev`;
  };

  // Map a pointer location within the image box to an object-position percentage.
  const fromEvent = (e) => {
    const r = img.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    return [Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y))];
  };

  let dragging = false;
  img.style.cursor = 'crosshair';

  img.addEventListener('pointerdown', (e) => {
    dragging = true;
    img.setPointerCapture?.(e.pointerId);
    setPosition(...fromEvent(e));
    e.preventDefault();
  });
  img.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setPosition(...fromEvent(e));
  });
  const stop = () => {
    dragging = false;
  };
  img.addEventListener('pointerup', stop);
  img.addEventListener('pointercancel', stop);

  // Seed the readout from whatever the image currently shows.
  const current = getComputedStyle(img).objectPosition;
  readout.textContent = `object-position: ${current}\ndrag on the image · ?dev`;
})();

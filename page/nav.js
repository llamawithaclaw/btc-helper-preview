// Mobile "route" sheet for the section navigation. A native <dialog> gives focus containment and Escape-to-close.
(function () {
  'use strict';
  // Phone chapter strip (review T1): start scrolled so the current chapter is in view, without moving the page.
  // Browsers leave a partly visible focused link where it is, so a focused chapter is also brought fully clear of the
  // faded edges, outline included.
  const strip = document.querySelector('.chapters ul');
  const here = strip && strip.querySelector('[aria-current]');
  if (here && strip.scrollWidth > strip.clientWidth) {
    const s = strip.getBoundingClientRect(); const a = here.getBoundingClientRect();
    strip.scrollLeft += (a.left + a.width / 2) - (s.left + s.width / 2);
  }
  strip?.addEventListener('focusin', (e) => {
    if (strip.scrollWidth <= strip.clientWidth) return;
    const edge = 28; const s = strip.getBoundingClientRect(); const a = e.target.getBoundingClientRect();
    if (a.left < s.left + edge) strip.scrollLeft -= s.left + edge - a.left;
    else if (a.right > s.right - edge) strip.scrollLeft += a.right - (s.right - edge);
  });
  // Ported pages: content that scrolls sideways (wide tables) can be reached and scrolled by keyboard. The current
  // site's markup is kept unchanged; this only adds focusability where a region overflows (review note, inherited issue).
  document.querySelectorAll('main.port *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1 || el.hasAttribute('tabindex') || el.matches('a, button, input, select, textarea, summary')) return;
    el.tabIndex = 0;
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      const cap = el.querySelector('caption') || el.previousElementSibling;
      el.setAttribute('role', el.getAttribute('role') || 'region');
      el.setAttribute('aria-label', ((cap && cap.textContent.trim().slice(0, 80)) || 'Table') + ' (scrolls sideways)');
    }
  });
  const button = document.getElementById('route-open');
  const sheet = document.getElementById('route');
  if (!button || !sheet || typeof sheet.showModal !== 'function') return;
  const close = () => { sheet.close(); };
  button.addEventListener('click', () => { sheet.showModal(); button.setAttribute('aria-expanded', 'true'); sheet.querySelector('[aria-current], a')?.focus(); });
  sheet.addEventListener('close', () => { button.setAttribute('aria-expanded', 'false'); button.focus(); });
  sheet.querySelector('.sheet-close')?.addEventListener('click', close);
  // A tap on the dimmed backdrop (outside the sheet) closes it.
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
})();

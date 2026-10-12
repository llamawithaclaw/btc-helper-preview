// evidence.html: the list of every timeline record. "Show details" activates the record's own chart marker, so the
// page's existing handler fills the Selected marker panel; focus then moves to that panel. #record-<date> links open
// the right group and show the record, on load and when the anchor changes.
(function () {
  'use strict';
  const panel = document.getElementById('replay-detail');
  const marker = (date) => document.querySelector(`.replay-marker[data-date="${CSS.escape(date)}"]`);
  if (panel && !panel.hasAttribute('tabindex')) panel.tabIndex = -1;
  function show(date, focusPanel) {
    const m = marker(date); if (!m) return false;
    m.click();
    document.querySelectorAll('.timeline-records .tr-row[aria-current]').forEach((r) => r.removeAttribute('aria-current'));
    const row = document.getElementById(`record-${date}`); if (row) row.setAttribute('aria-current', 'true');
    if (focusPanel && panel) { panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'nearest' }); }
    return true;
  }
  document.querySelectorAll('.timeline-records .tr-show').forEach((b) => b.addEventListener('click', () => show(b.dataset.record, true)));
  function fromHash() {
    const m = /^#record-(\d{4}-\d{2}-\d{2})$/.exec(location.hash); if (!m) return null;
    const row = document.getElementById(`record-${m[1]}`); if (!row) return null;
    const group = row.closest('details'); if (group) group.open = true;
    if (!show(m[1], false)) return null;
    const button = row.querySelector('.tr-show');
    button?.focus({ preventScroll: true }); row.scrollIntoView({ block: 'center' });
    return button;
  }
  addEventListener('hashchange', fromHash);
  // On a fresh load the browser's own fragment handling runs after this script and moves focus back to the page, so
  // focus is placed on the record's button again once loading has finished (verification note, 2026-10-10).
  const first = fromHash();
  if (first) {
    const refocus = () => requestAnimationFrame(() => setTimeout(() => { if (document.activeElement === document.body || !document.activeElement) first.focus({ preventScroll: true }); }, 0));
    if (document.readyState === 'complete') refocus(); else addEventListener('load', refocus, { once: true });
  }
})();

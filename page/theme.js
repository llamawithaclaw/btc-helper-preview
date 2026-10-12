// Light/dark theme toggle for Field guide pages. Same storage key and button id as the current site's script,
// so a saved choice carries over; ported pages run the current site's own copy of this behaviour instead.
(function () {
  'use strict';
  const KEY = 'btcHelperTheme';
  const button = document.getElementById('theme-toggle');
  const SUN = '<svg aria-hidden="true" class="theme-icon theme-icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v3M12 18.2v3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M2.8 12h3M18.2 12h3M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="theme-toggle-label">Theme</span>';
  const MOON = '<svg aria-hidden="true" class="theme-icon theme-icon-moon" viewBox="0 0 24 24"><path d="M20.4 14.7A8.3 8.3 0 0 1 9.3 3.6 8.7 8.7 0 1 0 20.4 14.7Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="theme-toggle-label">Theme</span>';
  function set(theme, persist) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    if (persist) { try { localStorage.setItem(KEY, next); } catch (e) { /* storage unavailable: the choice lasts for this page */ } }
    if (button) {
      button.innerHTML = next === 'dark' ? SUN : MOON;
      const text = next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      button.setAttribute('aria-label', text); button.setAttribute('title', text);
    }
  }
  set(document.documentElement.dataset.theme || 'light', false);
  button?.addEventListener('click', () => set(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
  addEventListener('storage', (e) => { if (e.key === KEY && e.newValue) set(e.newValue, false); });
})();

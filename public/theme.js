// Applies the visitor's saved light/dark choice before the page paints, so there is no flash
// of the wrong theme. Loaded from the <head> of every page; the choice is shared by both sites.
// It lives in its own file (not inline) so the site can run under a strict content security policy.
try {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;
} catch {
  // storage is unavailable (private window, blocked site data): stay on the default theme
}

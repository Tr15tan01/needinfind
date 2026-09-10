// Kept as a plain string (not a .ts function executed normally) because it
// needs to run as an inline, render-blocking <script> in <head> — before
// React hydrates and before the page paints — so the very first frame is
// already in the right theme instead of flashing light-then-dark (or vice
// versa) a moment later.
export const THEME_STORAGE_KEY = "needinfind-theme";

export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {
    // localStorage can throw in some locked-down browser contexts (private
    // mode, disabled storage) — falling back to light is a safe default,
    // not worth failing the page load over.
  }
})();
`;

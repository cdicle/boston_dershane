(() => {
  const STORAGE_KEY = "lh4h_theme";
  const THEMES = new Set(["dark", "light"]);

  const getStoredTheme = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return THEMES.has(value) ? value : null;
    } catch {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore persistence errors.
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-set-theme]").forEach((button) => {
      const isActive = button.getAttribute("data-set-theme") === theme;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("is-active", isActive);
    });
  };

  const initialTheme = getStoredTheme() || "dark";
  applyTheme(initialTheme);

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-set-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = button.getAttribute("data-set-theme");
        if (!THEMES.has(theme)) {
          return;
        }
        applyTheme(theme);
        setStoredTheme(theme);
      });
    });

    applyTheme(document.documentElement.getAttribute("data-theme") || initialTheme);
  });
})();

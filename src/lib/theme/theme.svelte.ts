export type Theme = "light" | "dark"

// Read before first paint by the inline script in src/app.html.
const STORAGE_KEY = "night-bakery:theme"
const THEME_COLOR: Record<Theme, string> = {
  light: "#fff8ed",
  dark: "#1a120d",
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

class ThemeStore {
  // Without a stored choice the CSS follows the system theme.
  current = $state<Theme>(storedTheme() ?? systemTheme())

  toggle() {
    this.set(this.current === "dark" ? "light" : "dark")
  }

  set(theme: Theme) {
    this.current = theme
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[theme])
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Remembering the theme is only a convenience.
    }
  }
}

export const theme = new ThemeStore()

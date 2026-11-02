export type Theme = "light" | "dark"
export type ThemeChoice = Theme | "system"

// Read before first paint by the inline script in src/app.html.
const STORAGE_KEY = "night-bakery:theme"
const THEME_COLOR: Record<Theme, string> = {
  light: "#fff8ed",
  dark: "#1a120d",
}
const NEXT_CHOICE: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
}

function storedChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

class ThemeStore {
  // "system" stores nothing, so the CSS follows the system theme.
  choice = $state<ThemeChoice>(storedChoice())
  #systemDark = matchMedia("(prefers-color-scheme: dark)")
  #system = $state<Theme>(this.#systemDark.matches ? "dark" : "light")
  current = $derived<Theme>(
    this.choice === "system" ? this.#system : this.choice,
  )

  constructor() {
    this.#systemDark.addEventListener("change", (event) => {
      this.#system = event.matches ? "dark" : "light"
      this.#applyThemeColor()
    })
  }

  cycle() {
    this.set(NEXT_CHOICE[this.choice])
  }

  set(choice: ThemeChoice) {
    this.choice = choice
    if (choice === "system") delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = choice
    this.#applyThemeColor()
    try {
      if (choice === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // Remembering the theme is only a convenience.
    }
  }

  #applyThemeColor() {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[this.current])
  }
}

export const theme = new ThemeStore()

import { normalizeOptions } from "$lib/game/engine"
import type { GameOptions } from "$lib/game/types"

const OPTIONS_KEY = "night-bakery:table"

// The last table setup, so experiments carry over between games.
export function loadTableOptions(): GameOptions {
  try {
    return normalizeOptions(
      JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? "null"),
    )
  } catch {
    return normalizeOptions(null)
  }
}

export function saveTableOptions(options: GameOptions) {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
  } catch {
    // Remembering the setup is only a convenience.
  }
}

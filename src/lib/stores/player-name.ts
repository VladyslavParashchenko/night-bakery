const NAME_KEY = "night-bakery:name"

export function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? ""
  } catch {
    return ""
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // Remembering the name is only a convenience.
  }
}

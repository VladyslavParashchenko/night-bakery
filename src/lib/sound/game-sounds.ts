import type { GameState, LogEntry } from "$lib/game/types"

export type SoundName =
  | "place"
  | "draw"
  | "burn"
  | "scorch"
  | "slap"
  | "turn"
  | "win"
  | "lose"
  | "error"

// The log keeps only its latest entries, so the new ones are found by where
// the end of the old log lines up with the start of the new one.
export function newLogEntries(before: LogEntry[], after: LogEntry[]) {
  const key = (entry: LogEntry) => JSON.stringify(entry)
  const old = before.map(key)
  const next = after.map(key)
  for (let added = 0; added <= next.length; added++) {
    const kept = next.length - added
    if (kept > old.length) continue
    const tail = old.slice(old.length - kept)
    if (tail.every((entry, i) => entry === next[i])) return after.slice(kept)
  }
  return after
}

function entrySound(entry: LogEntry, me: number): SoundName | null {
  switch (entry.type) {
    case "play":
    case "cook":
      return "place"
    case "burn":
      return "burn"
    case "draw":
      return entry.reason === "scorch" ? "slap" : "draw"
    case "win":
      return entry.player === me ? "win" : "lose"
    default:
      return null
  }
}

// What to play for the change from `before` to `after`, as seen by seat `me`.
export function gameSounds(
  before: GameState,
  after: GameState,
  me: number,
): SoundName[] {
  const sounds = new Set<SoundName>()
  for (const entry of newLogEntries(before.log, after.log)) {
    const sound = entrySound(entry, me)
    if (sound) sounds.add(sound)
  }
  if (after.pending?.kind === "scorch" && before.pending?.kind !== "scorch") {
    sounds.add("scorch")
  }
  if (after.current === me && before.current !== me && !after.pending) {
    sounds.add("turn")
  }
  return [...sounds]
}

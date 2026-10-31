import { describe, expect, it } from "vitest"
import { createGame } from "$lib/game/engine"
import type { GameState, LogEntry } from "$lib/game/types"
import { gameSounds, newLogEntries } from "$lib/sound/game-sounds"

const pass = (player: number): LogEntry => ({ type: "pass", player })

function game(changes: Partial<GameState> = {}): GameState {
  const state = createGame(
    [
      { name: "Me", isBot: false },
      { name: "Bot", isBot: true },
    ],
    1,
  )
  return { ...state, current: 1, log: [], ...changes }
}

describe("newLogEntries", () => {
  it("returns entries added to the end", () => {
    expect(newLogEntries([pass(0)], [pass(0), pass(1)])).toEqual([pass(1)])
  })

  it("finds new entries after the oldest ones were dropped", () => {
    const before = [pass(0), pass(1), pass(0)]
    const after = [pass(1), pass(0), pass(1)]
    expect(newLogEntries(before, after)).toEqual([pass(1)])
  })

  it("returns nothing when the log did not change", () => {
    expect(newLogEntries([pass(0)], [pass(0)])).toEqual([])
  })
})

describe("gameSounds", () => {
  const before = game()

  it("plays a card landing for numbers and cooks", () => {
    const after = game({
      log: [
        {
          type: "play",
          player: 1,
          card: { id: "x", type: "number", pastry: "bagel", value: 3 },
          oven: 0,
        },
        { type: "cook", player: 1, cook: "lock", oven: 1 },
      ],
    })
    expect(gameSounds(before, after, 0)).toEqual(["place"])
  })

  it("tells a slap apart from an ordinary draw", () => {
    const draw = (reason: "burn" | "scorch"): LogEntry => ({
      type: "draw",
      player: 1,
      count: 1,
      reason,
    })
    expect(gameSounds(before, game({ log: [draw("burn")] }), 0)).toEqual([
      "draw",
    ])
    expect(gameSounds(before, game({ log: [draw("scorch")] }), 0)).toEqual([
      "slap",
    ])
  })

  it("plays a win only for the winner", () => {
    const after = game({ log: [{ type: "win", player: 1 }] })
    expect(gameSounds(before, after, 1)).toEqual(["win"])
    expect(gameSounds(before, after, 0)).toEqual(["lose"])
  })

  it("calls out a scorch window once", () => {
    const scorch = game({ pending: { kind: "scorch", offender: 1 } })
    expect(gameSounds(before, scorch, 0)).toEqual(["scorch"])
    expect(gameSounds(scorch, scorch, 0)).toEqual([])
  })

  it("announces our turn when it passes to us", () => {
    expect(gameSounds(before, game({ current: 0 }), 0)).toEqual(["turn"])
    expect(gameSounds(game({ current: 0 }), game({ current: 0 }), 0)).toEqual(
      [],
    )
  })
})

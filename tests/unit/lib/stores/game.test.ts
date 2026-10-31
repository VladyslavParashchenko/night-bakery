import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createGame } from "$lib/game/engine"
import type { GameState, NumberCard, Pastry } from "$lib/game/types"
import { game, HUMAN_ID, SCORCH_WINDOW_MS } from "$lib/stores/game.svelte"

const n = (value: number, pastry: Pastry = "croissant"): NumberCard => ({
  id: `${pastry}-${value}`,
  type: "number",
  pastry,
  value,
})

// Human (0) against two bots, with an oven whose top card is a bagel 5.
function table(humanHand: NumberCard[]): GameState {
  const state = createGame(
    [
      { name: "Me", isBot: false },
      { name: "Bot A", isBot: true },
      { name: "Bot B", isBot: true },
    ],
    7,
  )
  state.players[0].hand = humanHand
  state.ovens = [
    { cards: [n(5, "bagel")], lockedBy: null },
    { cards: [], lockedBy: null },
    { cards: [], lockedBy: null },
  ]
  return state
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  game.quit()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("game store", () => {
  it("lets the bots take their turns and hands the turn back", () => {
    game.start(
      [
        { name: "Me", isBot: false },
        { name: "Bot", isBot: true },
      ],
      3,
    )
    game.dispatch({ type: "endTurn", player: HUMAN_ID })
    expect(game.state?.current).toBe(1)

    for (let i = 0; i < 50 && game.state?.current !== HUMAN_ID; i++) {
      vi.advanceTimersByTime(SCORCH_WINDOW_MS)
    }
    expect(game.state?.current).toBe(HUMAN_ID)
    expect(game.error).toBeNull()
  })

  it("shows the player's mistakes and counts each one", () => {
    game.start(
      [
        { name: "Me", isBot: false },
        { name: "Bot", isBot: true },
      ],
      3,
    )
    game.dispatch({ type: "endTurn", player: 1 })
    expect(game.error).toBe("notYourTurn")
    const key = game.errorKey
    game.dispatch({ type: "endTurn", player: 1 })
    expect(game.errorKey).toBe(key + 1)
    game.clearError()
    expect(game.error).toBeNull()
  })

  it("closes the scorch window by itself when nobody slaps", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99)
    game.start([
      { name: "Me", isBot: false },
      { name: "Bot", isBot: true },
    ])
    game.state = table([n(5), n(9)])
    game.dispatch({
      type: "playNumber",
      player: HUMAN_ID,
      cardId: n(5).id,
      oven: 0,
    })
    game.dispatch({ type: "endTurn", player: HUMAN_ID })
    expect(game.state?.pending).toEqual({ kind: "scorch", offender: HUMAN_ID })
    const hand = game.state!.players[HUMAN_ID].hand.length

    vi.advanceTimersByTime(SCORCH_WINDOW_MS)
    expect(game.state?.pending).toBeNull()
    expect(game.state?.players[HUMAN_ID].hand).toHaveLength(hand)
    expect(game.error).toBeNull()
  })

  it("lets a bot slap a value match within the window", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    game.start([
      { name: "Me", isBot: false },
      { name: "Bot", isBot: true },
    ])
    game.state = table([n(5), n(9)])
    game.dispatch({
      type: "playNumber",
      player: HUMAN_ID,
      cardId: n(5).id,
      oven: 0,
    })
    game.dispatch({ type: "endTurn", player: HUMAN_ID })
    const hand = game.state!.players[HUMAN_ID].hand.length

    // With Math.random at 0 the first bot slaps after its minimum delay.
    vi.advanceTimersByTime(500)
    expect(game.state?.pending).toBeNull()
    expect(game.state?.current).toBe(1)
    expect(game.state?.players[HUMAN_ID].hand).toHaveLength(hand + 1)
    expect(game.error).toBeNull()
  })
})

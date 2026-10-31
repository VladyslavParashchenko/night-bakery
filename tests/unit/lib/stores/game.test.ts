import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createGame } from "$lib/game/engine"
import type { Action, GameState, NumberCard, Pastry } from "$lib/game/types"
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

describe("online game store", () => {
  const humans = [
    { name: "Host", isBot: false },
    { name: "Guest", isBot: false },
  ]

  it("publishes every state as host and takes remote actions", () => {
    const published: GameState[] = []
    const close = vi.fn()
    game.connect({ role: "host", publish: (s) => published.push(s), close })
    game.start(humans, 3)
    expect(published).toHaveLength(1)

    expect(game.applyRemote({ type: "endTurn", player: 1 })).toBe("notYourTurn")
    expect(game.error).toBeNull()
    game.dispatch({ type: "endTurn", player: HUMAN_ID })
    expect(game.applyRemote({ type: "endTurn", player: 1 })).toBeNull()
    expect(published.at(-1)?.current).toBe(HUMAN_ID)

    game.quit()
    expect(close).toHaveBeenCalledOnce()
  })

  it("lets a bot take over a player who left", () => {
    game.connect({ role: "host", publish: () => {}, close: () => {} })
    game.start(humans, 3)
    game.dispatch({ type: "endTurn", player: HUMAN_ID })
    game.replaceWithBot(1)
    expect(game.state?.players[1].isBot).toBe(true)

    for (let i = 0; i < 50 && game.state?.current !== HUMAN_ID; i++) {
      vi.advanceTimersByTime(SCORCH_WINDOW_MS)
    }
    expect(game.state?.current).toBe(HUMAN_ID)
  })

  it("sends a guest's actions to the host instead of applying them", () => {
    const sent: Action[] = []
    game.connect({ role: "guest", send: (a) => sent.push(a), close: () => {} })
    const state = createGame(humans, 3)
    game.receive(state, 1)
    expect(game.me).toBe(1)

    game.dispatch({ type: "endTurn", player: 1 })
    expect(sent).toEqual([{ type: "endTurn", player: 1 }])
    expect(game.state).toBe(state)
    expect(game.error).toBeNull()
  })

  it("clears a guest's error once the host sends a new state", () => {
    game.connect({ role: "guest", send: () => {}, close: () => {} })
    game.receive(createGame(humans, 3), 1)
    game.showError("doesNotFit")
    game.receive(createGame(humans, 4), 1)
    expect(game.error).toBeNull()
  })
})

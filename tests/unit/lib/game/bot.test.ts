import { describe, expect, it } from "vitest"
import { chooseBotAction } from "$lib/game/bot"
import { applyAction, createGame } from "$lib/game/engine"
import type { CookCard, GameState, NumberCard } from "$lib/game/types"

function playOut(state: GameState, maxSteps = 20000) {
  let current = state
  for (let step = 0; step < maxSteps; step++) {
    const pending = current.pending
    if (pending?.kind === "gameOver") return { state: current, steps: step }
    if (pending?.kind === "scorch") {
      current = expectOk(current, { type: "closeScorch" })
      continue
    }
    const actor =
      pending?.kind === "carousel"
        ? current.players.find((p) => chooseBotAction(current, p.id))!.id
        : current.current
    const action = chooseBotAction(current, actor)
    if (!action) throw new Error(`bot ${actor} has no action`)
    current = expectOk(current, action)
  }
  throw new Error("game did not finish")
}

function expectOk(state: GameState, action: Parameters<typeof applyAction>[1]) {
  const result = applyAction(state, action)
  if (!result.ok) throw new Error(`${action.type} failed: ${result.error}`)
  return result.state
}

describe("bots", () => {
  it.each([2, 3, 4, 5])(
    "finish full games with %i players using only legal moves",
    (count) => {
      for (let seed = 1; seed <= 20; seed++) {
        const game = createGame(
          Array.from({ length: count }, (_, i) => ({
            name: `Bot ${i}`,
            isBot: true,
          })),
          seed * 977 + count,
        )
        const { state } = playOut(game)
        expect(state.pending?.kind).toBe("gameOver")
        const winner =
          state.pending?.kind === "gameOver" && state.pending.winner
        expect(state.players[winner as number].hand).toEqual([])
        const total = state.players.reduce((sum, p) => sum + p.hand.length, 0)
        expect(
          total +
            state.deck.length +
            state.discard.length +
            state.ovens.flatMap((o) => o.cards).length,
        ).toBe(72)
      }
    },
  )

  it.each([
    [3, 3],
    [6, 8],
    [4, 6],
  ])("finish full games with %i ovens of %i cards", (ovens, ovenCapacity) => {
    for (let seed = 1; seed <= 10; seed++) {
      const game = createGame(
        Array.from({ length: 5 }, (_, i) => ({
          name: `Bot ${i}`,
          isBot: true,
        })),
        seed * 131 + ovens,
        { ovens, ovenCapacity },
      )
      const { state } = playOut(game)
      expect(state.pending?.kind).toBe("gameOver")
      expect(state.ovens).toHaveLength(ovens)
      expect(
        state.ovens.every((oven) => oven.cards.length < ovenCapacity),
      ).toBe(true)
    }
  })
})

describe("bot scoring", () => {
  const n = (value: number, pastry: NumberCard["pastry"] = "croissant") =>
    ({ id: `${pastry}-${value}`, type: "number", pastry, value }) as const
  const chef: CookCard = {
    id: "cook-chef-0",
    type: "cook",
    cook: "chef",
    pastry: null,
  }

  function table(hands: GameState["players"][number]["hand"][]) {
    const state = createGame(
      hands.map((_, i) => ({ name: `Bot ${i}`, isBot: true })),
      7,
    )
    state.players.forEach((player, i) => (player.hand = hands[i]))
    state.ovens = [
      { cards: [n(5, "bagel")], lockedBy: null },
      { cards: [], lockedBy: null },
      { cards: [], lockedBy: null },
    ]
    return state
  }

  it("sheds a Chef first when an opponent is about to win", () => {
    const state = table([[n(3), n(4, "donut"), chef], [n(9)]])
    expect(chooseBotAction(state, 0)).toMatchObject({
      type: "playCook",
      cardId: chef.id,
    })
  })

  it("keeps playing pastries while nobody is close to winning", () => {
    const state = table([
      [n(3), n(4, "donut"), chef],
      [n(9), n(10), n(11)],
    ])
    expect(chooseBotAction(state, 0)).toMatchObject({ type: "playNumber" })
  })

  it("prefers shedding the higher of two equal options", () => {
    const state = table([
      [n(2, "pretzel"), n(13, "pretzel")],
      [n(9), n(10), n(11)],
    ])
    state.turn.cardsPlayed = 2
    expect(chooseBotAction(state, 0)).toMatchObject({
      type: "playNumber",
      cardId: "pretzel-13",
    })
  })

  it("passes the more expensive of two isolated cards on a Carousel", () => {
    const state = table([[n(2, "pretzel"), chef], [n(9)]])
    state.pending = { kind: "carousel", choices: {} }
    expect(chooseBotAction(state, 0)).toMatchObject({
      type: "submitCarousel",
      cardId: chef.id,
    })
  })
})

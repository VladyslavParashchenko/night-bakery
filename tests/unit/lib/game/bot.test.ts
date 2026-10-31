import { describe, expect, it } from "vitest"
import { chooseBotAction } from "$lib/game/bot"
import { applyAction, createGame } from "$lib/game/engine"
import type { GameState } from "$lib/game/types"

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
})

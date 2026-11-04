import { describe, expect, it } from "vitest"
import { createDeck, sortHand } from "$lib/game/cards"
import {
  applyAction,
  createGame,
  handOverToBot,
  legalOvens,
  standings,
  viewFor,
} from "$lib/game/engine"
import type {
  Action,
  Card,
  CookCard,
  GameState,
  NumberCard,
  Pastry,
} from "$lib/game/types"

const n = (
  value: number,
  pastry: Pastry = "croissant",
  copy = 0,
): NumberCard => ({
  id: `${pastry}-${value}-${copy}`,
  type: "number",
  pastry,
  value,
})

// Oven 0 starts with a bagel, so bagel cooks fit there by default.
const cook = (kind: CookCard["cook"], pastry: Pastry = "bagel"): CookCard => ({
  id: `cook-${kind}-${pastry}`,
  type: "cook",
  cook: kind,
  pastry,
})

function setup(
  hands: Card[][],
  ovens: NumberCard[][] = [[n(5, "bagel", 1)], [], []],
) {
  const state = createGame(
    hands.map((_, i) => ({ name: `P${i}`, isBot: false })),
    42,
  )
  state.players.forEach((player, i) => (player.hand = hands[i]))
  state.ovens = ovens.map((cards) => ({ cards, lockedBy: null }))
  state.deck = [n(9, "donut", 1), n(8, "donut", 1), n(7, "donut", 1)]
  state.discard = []
  return state
}

function run(state: GameState, ...actions: Action[]) {
  let current = state
  for (const action of actions) {
    const result = applyAction(current, action)
    if (!result.ok) throw new Error(`${action.type}: ${result.error}`)
    current = result.state
  }
  return current
}

function fail(state: GameState, action: Action) {
  const result = applyAction(state, action)
  expect(result.ok).toBe(false)
  return result.ok ? null : result.error
}

describe("deck", () => {
  it("orders a hand by value, then suit, with cooks last", () => {
    const chef: CookCard = {
      id: "cook-chef-0",
      type: "cook",
      cook: "chef",
      pastry: null,
    }
    const hand = [chef, cook("lock"), n(9, "bagel"), n(3, "bagel"), n(12)]
    expect(sortHand(hand)).toEqual([
      n(3, "bagel"),
      n(9, "bagel"),
      n(12),
      cook("lock"),
      chef,
    ])
    expect(hand[0]).toBe(chef)
  })

  it("has 52 pastries, 16 coloured cooks and 4 chefs with unique ids", () => {
    const deck = createDeck()
    expect(deck).toHaveLength(72)
    const cooks = deck.filter(
      (c): c is CookCard => c.type === "cook" && c.cook !== "chef",
    )
    expect(cooks).toHaveLength(16)
    expect(new Set(cooks.map((c) => `${c.cook}-${c.pastry}`)).size).toBe(16)
    const chefs = deck.filter((c) => c.type === "cook" && c.cook === "chef")
    expect(chefs).toHaveLength(4)
    expect(chefs.every((c) => c.pastry === null)).toBe(true)
    expect(new Set(deck.map((c) => c.id)).size).toBe(72)
    for (const pastry of ["croissant", "bagel", "pretzel", "donut"]) {
      const suit = deck.filter(
        (c) => c.type === "number" && c.pastry === pastry,
      )
      expect(suit.map((c) => (c.type === "number" ? c.value : 0))).toEqual([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      ])
    }
  })
})

describe("createGame", () => {
  it("deals 7 cards and opens a pastry in every oven", () => {
    const state = createGame(
      [
        { name: "A", isBot: false },
        { name: "B", isBot: true },
        { name: "C", isBot: true },
      ],
      7,
    )
    expect(state.players.every((p) => p.hand.length === 7)).toBe(true)
    expect(state.ovens).toHaveLength(3)
    expect(
      state.ovens.every(
        (o) => o.cards.length === 1 && o.cards[0].type === "number",
      ),
    ).toBe(true)
    expect(state.deck.length).toBe(72 - 21 - 3)
  })

  it("is deterministic for a seed", () => {
    const players = [
      { name: "A", isBot: false },
      { name: "B", isBot: true },
    ]
    expect(createGame(players, 1)).toEqual(createGame(players, 1))
  })
})

describe("playing pastries", () => {
  it("accepts the same kind or the same value, and anything on an empty oven", () => {
    const state = setup([[n(5), n(7, "bagel"), n(7)], [n(2)]])
    expect(legalOvens(state, 0, n(5))).toEqual([0, 1, 2])
    expect(legalOvens(state, 0, n(7, "bagel"))).toEqual([0, 1, 2])
    expect(legalOvens(state, 0, n(7))).toEqual([1, 2])
    expect(
      fail(state, { type: "playNumber", player: 0, cardId: n(7).id, oven: 0 }),
    ).toBe("doesNotFit")
  })

  it("compares each card in a chain with the new top card", () => {
    // bagel 5 -> croissant 5 (value) -> croissant 8 (kind) -> donut 8 (value)
    const state = run(
      setup([[n(5), n(8), n(8, "donut")], [n(2)]]),
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(8).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(8, "donut").id, oven: 0 },
    )
    expect(state.ovens[0].cards.map((c) => c.id)).toEqual([
      n(5, "bagel", 1).id,
      n(5).id,
      n(8).id,
      n(8, "donut").id,
    ])
  })

  it("lets each pastry go into any oven and caps the turn at three", () => {
    // Oven 0 holds a bagel 5; ovens 1 and 2 are empty.
    const state = run(
      setup([[n(5), n(13), n(9, "pretzel"), n(6)], [n(2)]]),
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(13).id, oven: 1 },
      { type: "playNumber", player: 0, cardId: n(9, "pretzel").id, oven: 2 },
    )
    expect(state.ovens.map((o) => o.cards.at(-1)?.id)).toEqual([
      n(5).id,
      n(13).id,
      n(9, "pretzel").id,
    ])
    expect(
      fail(state, { type: "playNumber", player: 0, cardId: n(6).id, oven: 0 }),
    ).toBe("tooManyCards")
  })

  it("burns an oven at five cards and gives the player two penalty cards", () => {
    const oven = [n(13, "bagel"), n(2, "bagel"), n(3, "bagel"), n(4, "bagel")]
    let state = setup([[n(5, "bagel"), n(9)], [n(2)]], [oven, [], []])
    state = run(state, {
      type: "playNumber",
      player: 0,
      cardId: n(5, "bagel").id,
      oven: 0,
    })
    expect(state.ovens[0].cards).toEqual([])
    expect(state.discard).toHaveLength(5)
    expect(state.players[0].hand.map((c) => c.id)).toEqual([
      n(9).id,
      n(7, "donut", 1).id,
      n(8, "donut", 1).id,
    ])
    // The chain may continue into the now empty oven.
    state = run(state, {
      type: "playNumber",
      player: 0,
      cardId: n(9).id,
      oven: 0,
    })
    expect(state.ovens[0].cards).toHaveLength(1)
  })

  it("makes every opponent draw after three cards of one value", () => {
    let state = setup([
      [n(5), n(5, "donut"), n(5, "pretzel"), n(13, "bagel")],
      [n(2)],
      [n(3)],
    ])
    state = run(
      state,
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(5, "donut").id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(5, "pretzel").id, oven: 0 },
      { type: "endTurn", player: 0 },
      // Value matches also open the scorch window; nobody slaps here.
      { type: "closeScorch" },
    )
    expect(state.players[1].hand).toHaveLength(2)
    expect(state.players[2].hand).toHaveLength(2)
    expect(state.current).toBe(1)
  })

  it("does not trigger the recipe for mixed values", () => {
    let state = setup([[n(5), n(6), n(7), n(13)], [n(2)]])
    state = run(
      state,
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(6).id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(7).id, oven: 0 },
      { type: "endTurn", player: 0 },
    )
    expect(state.players[1].hand).toHaveLength(1)
  })
})

describe("turn flow", () => {
  it("only lets the current player end the turn", () => {
    const state = setup([[n(13)], [n(2)]])
    expect(fail(state, { type: "endTurn", player: 1 })).toBe("notYourTurn")
  })

  it("draws three cards when the turn ends with nothing played", () => {
    const state = run(setup([[n(13)], [n(2)]]), { type: "endTurn", player: 0 })
    expect(state.players[0].hand).toHaveLength(4)
    expect(state.current).toBe(1)
    expect(state.log.at(-1)).toEqual({
      type: "draw",
      player: 0,
      count: 3,
      reason: "shortfall",
    })
  })

  it("draws the cards missing to three", () => {
    const one = run(
      setup([[n(5), n(9, "pretzel")], [n(2)]]),
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "endTurn", player: 0 },
      { type: "closeScorch" },
    )
    expect(one.players[0].hand).toHaveLength(1 + 2)

    const two = run(
      setup([[n(7, "bagel"), n(8, "bagel"), n(9, "pretzel")], [n(2)]]),
      { type: "playNumber", player: 0, cardId: n(7, "bagel").id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(8, "bagel").id, oven: 0 },
      { type: "endTurn", player: 0 },
    )
    expect(two.players[0].hand).toHaveLength(1 + 1)
  })

  it("counts a played cook towards the three", () => {
    const state = run(
      setup([
        [n(7, "bagel"), n(8, "bagel"), cook("lock"), n(2, "pretzel")],
        [n(2)],
      ]),
      { type: "playNumber", player: 0, cardId: n(7, "bagel").id, oven: 0 },
      { type: "playNumber", player: 0, cardId: n(8, "bagel").id, oven: 0 },
      {
        type: "playCook",
        player: 0,
        cardId: cook("lock").id,
        target: { cook: "lock", oven: 0 },
      },
      { type: "endTurn", player: 0 },
    )
    expect(state.players[0].hand.map((c) => c.id)).toEqual([n(2, "pretzel").id])
  })

  it("reshuffles the discard pile when the deck runs out", () => {
    let state = setup([[n(13)], [n(2)]])
    state.deck = []
    state.discard = [n(9, "pretzel")]
    state = run(state, { type: "endTurn", player: 0 })
    expect(state.players[0].hand).toHaveLength(2)
    expect(state.discard).toEqual([])
  })
})

describe("scorch", () => {
  it("opens a scorch window after a value match and punishes on slap", () => {
    // Oven 0 holds a bagel 5; the player matches it with a croissant 5.
    let state = setup([[n(5), n(13)], [n(2)], [n(3)]])
    state = run(
      state,
      { type: "playNumber", player: 0, cardId: n(5).id, oven: 0 },
      { type: "endTurn", player: 0 },
    )
    expect(state.pending).toEqual({ kind: "scorch", offender: 0 })
    expect(fail(state, { type: "slap", player: 0 })).toBe("invalidTarget")
    const before = state.players[0].hand.length
    state = run(state, { type: "slap", player: 2 })
    expect(state.players[0].hand).toHaveLength(before + 1)
    expect(state.pending).toBeNull()
    expect(state.current).toBe(1)
  })

  it("does not open the window for a kind match", () => {
    const state = run(
      setup([[n(7, "bagel"), n(13)], [n(2)]]),
      { type: "playNumber", player: 0, cardId: n(7, "bagel").id, oven: 0 },
      { type: "endTurn", player: 0 },
    )
    expect(state.pending).toBeNull()
    expect(state.current).toBe(1)
  })
})

describe("cooks", () => {
  it("only goes on an oven whose top card has the cook's colour", () => {
    const state = setup([[cook("lock", "donut"), cook("lock"), n(13)], [n(2)]])
    // Oven 0 holds a bagel; ovens 1 and 2 are empty.
    expect(legalOvens(state, 0, cook("lock", "donut"))).toEqual([1, 2])
    expect(legalOvens(state, 0, cook("lock"))).toEqual([0, 1, 2])
    expect(
      fail(state, {
        type: "playCook",
        player: 0,
        cardId: cook("lock", "donut").id,
        target: { cook: "lock", oven: 0 },
      }),
    ).toBe("doesNotFit")
  })

  it("stays on top of the oven, so only its colour may follow", () => {
    const state = run(setup([[cook("lock"), n(5), n(7, "bagel")], [n(2)]]), {
      type: "playCook",
      player: 0,
      cardId: cook("lock").id,
      target: { cook: "lock", oven: 0 },
    })
    expect(state.ovens[0].cards.at(-1)).toEqual(cook("lock"))
    // A croissant 5 matched the bagel 5 underneath, but not the bagel cook.
    expect(legalOvens(state, 0, n(5))).toEqual([1, 2])
    expect(legalOvens(state, 0, n(7, "bagel"))).toEqual([0, 1, 2])
  })

  it("chef goes into any oven and takes the colour the player picks", () => {
    const chef: CookCard = {
      id: "cook-chef-0",
      type: "cook",
      cook: "chef",
      pastry: null,
    }
    // Oven 0 holds a bagel 5; a chef fits regardless of colour.
    let state = setup([[chef, n(7, "donut"), n(7)], [n(2)]])
    expect(legalOvens(state, 0, chef)).toEqual([0, 1, 2])
    expect(
      fail(state, {
        type: "playCook",
        player: 0,
        cardId: chef.id,
        target: { cook: "chef", oven: 0, pastry: "plum" as Pastry },
      }),
    ).toBe("invalidTarget")
    state = run(state, {
      type: "playCook",
      player: 0,
      cardId: chef.id,
      target: { cook: "chef", oven: 0, pastry: "donut" },
    })
    expect(state.ovens[0].cards.at(-1)).toEqual({ ...chef, pastry: "donut" })
    expect(legalOvens(state, 0, n(7, "donut"))).toContain(0)
    expect(legalOvens(state, 0, n(7))).not.toContain(0)
  })

  it("chef loses its colour again when its oven is emptied", () => {
    const chef: CookCard = {
      id: "cook-chef-0",
      type: "cook",
      cook: "chef",
      pastry: null,
    }
    const oven = [n(13, "bagel"), n(2, "bagel"), n(3, "bagel"), n(4, "bagel")]
    const state = run(setup([[chef, n(9)], [n(2)]], [oven, [], []]), {
      type: "playCook",
      player: 0,
      cardId: chef.id,
      target: { cook: "chef", oven: 0, pastry: "donut" },
    })
    expect(state.ovens[0].cards).toEqual([])
    expect(state.discard).toContainEqual(chef)
  })

  it("counts towards the five cards that burn an oven", () => {
    const oven = [n(13, "bagel"), n(2, "bagel"), n(3, "bagel"), n(4, "bagel")]
    const state = run(setup([[cook("lock"), n(9)], [n(2)]], [oven, [], []]), {
      type: "playCook",
      player: 0,
      cardId: cook("lock").id,
      target: { cook: "lock", oven: 0 },
    })
    expect(state.ovens[0].cards).toEqual([])
    expect(state.discard).toHaveLength(5)
    expect(state.players[0].hand).toHaveLength(3)
  })

  it("clean empties the oven it is placed in, itself included", () => {
    let state = setup([[cook("clean"), n(13)], [n(2)]])
    state = run(state, {
      type: "playCook",
      player: 0,
      cardId: cook("clean").id,
      target: { cook: "clean", oven: 0 },
    })
    expect(state.ovens[0].cards).toEqual([])
    expect(state.discard.map((c) => c.id)).toContain(cook("clean").id)
    expect(
      fail(state, {
        type: "playCook",
        player: 0,
        cardId: cook("clean").id,
        target: { cook: "clean", oven: 0 },
      }),
    ).toBe("cardNotInHand")
  })

  it("lock blocks other players until the owner's next turn", () => {
    let state = setup([
      [cook("lock"), n(13)],
      [n(4), n(9)],
    ])
    state = run(
      state,
      {
        type: "playCook",
        player: 0,
        cardId: cook("lock").id,
        target: { cook: "lock", oven: 0 },
      },
      { type: "endTurn", player: 0 },
    )
    expect(
      fail(state, { type: "playNumber", player: 1, cardId: n(4).id, oven: 0 }),
    ).toBe("ovenLocked")
    state = run(
      state,
      { type: "playNumber", player: 1, cardId: n(4).id, oven: 1 },
      { type: "endTurn", player: 1 },
    )
    expect(state.ovens[0].lockedBy).toBeNull()
  })

  it("spy swaps one random card with the chosen opponent", () => {
    let state = setup([[cook("spy"), n(9)], [n(13), n(2)], [n(3)]])
    state = run(state, {
      type: "playCook",
      player: 0,
      cardId: cook("spy").id,
      target: { cook: "spy", oven: 0, opponent: 1 },
    })
    // The player's only remaining card goes over; one of the opponent's comes back.
    const [taken] = state.players[0].hand
    expect(state.players[0].hand).toHaveLength(1)
    expect([n(13).id, n(2).id]).toContain(taken.id)
    expect(state.players[1].hand.map((c) => c.id)).toContain(n(9).id)
    expect(state.players[1].hand).toHaveLength(2)
    expect(state.players[2].hand).toEqual([n(3)])
  })

  it("spy rejects the player themselves as the opponent", () => {
    const state = setup([[cook("spy"), n(9)], [n(13)]])
    expect(
      fail(state, {
        type: "playCook",
        player: 0,
        cardId: cook("spy").id,
        target: { cook: "spy", oven: 0, opponent: 0 },
      }),
    ).toBe("invalidTarget")
  })

  it("carousel passes one card per player to the left", () => {
    let state = setup([[cook("carousel"), n(13)], [n(2)], [n(3)]])
    state = run(state, {
      type: "playCook",
      player: 0,
      cardId: cook("carousel").id,
      target: { cook: "carousel", oven: 0 },
    })
    expect(state.pending?.kind).toBe("carousel")
    state = run(
      state,
      { type: "submitCarousel", player: 0, cardId: n(13).id },
      { type: "submitCarousel", player: 1, cardId: n(2).id },
    )
    expect(state.pending?.kind).toBe("carousel")
    state = run(state, { type: "submitCarousel", player: 2, cardId: n(3).id })
    expect(state.pending).toBeNull()
    expect(state.players.map((p) => p.hand[0].id)).toEqual([
      n(3).id,
      n(13).id,
      n(2).id,
    ])
  })

  it("ends the game at once when the Carousel is the last card", () => {
    const state = run(setup([[cook("carousel")], [n(2)], [n(3)]]), {
      type: "playCook",
      player: 0,
      cardId: cook("carousel").id,
      target: { cook: "carousel", oven: 0 },
    })
    expect(state.pending).toEqual({ kind: "gameOver", winner: 0 })
    expect(state.players[1].hand).toEqual([n(2)])
  })

  it("shares the three-card limit with pastries, any mix allowed", () => {
    // Two cooks and a pastry fill the turn; a fourth card is refused.
    const state = run(
      setup([
        [cook("lock"), cook("carousel", "pretzel"), n(7, "bagel"), n(2)],
        [n(3)],
      ]),
      {
        type: "playCook",
        player: 0,
        cardId: cook("lock").id,
        target: { cook: "lock", oven: 0 },
      },
      { type: "playNumber", player: 0, cardId: n(7, "bagel").id, oven: 0 },
      {
        type: "playCook",
        player: 0,
        cardId: cook("carousel", "pretzel").id,
        target: { cook: "carousel", oven: 1 },
      },
      { type: "submitCarousel", player: 0, cardId: n(2).id },
      { type: "submitCarousel", player: 1, cardId: n(3).id },
    )
    expect(state.turn.cardsPlayed).toBe(3)
    expect(
      fail(state, { type: "playNumber", player: 0, cardId: n(3).id, oven: 2 }),
    ).toBe("tooManyCards")
  })
})

describe("winning", () => {
  it("ends the game as soon as the last card is played", () => {
    let state = setup(
      [[n(5), n(6)], [n(3), cook("lock")], [n(9)]],
      [[n(6, "croissant", 1)], [], []],
    )
    state = run(state, {
      type: "playNumber",
      player: 0,
      cardId: n(5).id,
      oven: 0,
    })
    expect(state.pending).toBeNull()

    state = run(state, {
      type: "playNumber",
      player: 0,
      cardId: n(6).id,
      oven: 1,
    })
    expect(state.pending).toEqual({ kind: "gameOver", winner: 0 })
    expect(state.log.at(-1)).toEqual({ type: "win", player: 0 })
    expect(fail(state, { type: "endTurn", player: 0 })).toBe("pending")
  })

  it("wins on a value match without opening the Scorched! window", () => {
    const state = run(
      setup([[n(5, "donut")], [n(3)]], [[n(5, "bagel", 1)], [], []]),
      { type: "playNumber", player: 0, cardId: n(5, "donut").id, oven: 0 },
    )
    expect(state.pending).toEqual({ kind: "gameOver", winner: 0 })
  })

  it("keeps running totals for the end-of-game summary", () => {
    const full = [1, 2, 3, 4].map((copy) => n(5, "bagel", copy))
    let state = setup([[n(7, "bagel"), n(6, "bagel")], [n(3)]], [full, [], []])
    expect(state.stats).toEqual({
      turns: 1,
      players: [
        { played: 0, burns: 0, drawn: 0 },
        { played: 0, burns: 0, drawn: 0 },
      ],
    })
    state = run(
      state,
      { type: "playNumber", player: 0, cardId: n(7, "bagel").id, oven: 0 },
      { type: "endTurn", player: 0 },
    )
    // One burn penalty of 2, then 2 more for the unplayed quota.
    expect(state.stats.players[0]).toEqual({ played: 1, burns: 1, drawn: 4 })
    expect(state.stats.turns).toBe(2)
  })

  it("does not win when the last card burns an oven", () => {
    const full = [1, 2, 3, 4].map((copy) => n(5, "bagel", copy))
    const state = run(setup([[n(7, "bagel")], [n(3)]], [full, [], []]), {
      type: "playNumber",
      player: 0,
      cardId: n(7, "bagel").id,
      oven: 0,
    })
    expect(state.players[0].hand).toHaveLength(2)
    expect(state.pending).toBeNull()
  })
})

describe("remote play", () => {
  it("hides other hands, the deck and the seed from a player", () => {
    const state = setup([[n(3)], [n(4), cook("spy")]])
    const view = viewFor(state, 0)
    expect(view.players[0].hand).toEqual([n(3)])
    expect(view.players[1].hand).toHaveLength(2)
    expect(view.players[1].hand).toEqual([
      { id: "hidden-1-0", type: "hidden" },
      { id: "hidden-1-1", type: "hidden" },
    ])
    expect(view.deck).toHaveLength(state.deck.length)
    expect(view.deck.every((card) => card.type === "hidden")).toBe(true)
    expect(view.rng).toBe(0)
    expect(state.players[1].hand).toEqual([n(4), cook("spy")])
  })

  it("shows every hand once the game is over", () => {
    const state = setup([[], [n(4), cook("spy")]])
    state.pending = { kind: "gameOver", winner: 0 }
    const view = viewFor(state, 0)
    expect(view.players[1].hand).toEqual([n(4), cook("spy")])
    expect(view.deck.every((card) => card.type === "hidden")).toBe(true)
  })

  it("hides other players' Carousel picks but keeps who has picked", () => {
    const state = setup([[n(3)], [n(4)], [n(6)]])
    state.pending = { kind: "carousel", choices: { 0: n(3).id, 1: n(4).id } }
    const view = viewFor(state, 0)
    expect(view.pending).toEqual({
      kind: "carousel",
      choices: { 0: n(3).id, 1: "hidden" },
    })
  })

  it("hands a player's seat over to a bot", () => {
    const state = setup([[n(3)], [n(4)]])
    const next = handOverToBot(state, 1)
    expect(next.players[1].isBot).toBe(true)
    expect(state.players[1].isBot).toBe(false)
  })
})

describe("standings", () => {
  const chef: CookCard = {
    id: "cook-chef-0",
    type: "cook",
    cook: "chef",
    pastry: null,
  }

  function over(hands: Card[][], winner = 0) {
    const state = setup(hands)
    state.pending = { kind: "gameOver", winner }
    return state
  }

  it("counts pastries by value, cooks as 15 and the Chef as 20", () => {
    const state = over([[], [n(2), n(14, "donut")], [cook("spy"), chef, n(7)]])
    expect(standings(state)).toEqual([
      { player: 0, points: 0, place: 1, worst: false },
      { player: 1, points: 16, place: 2, worst: false },
      { player: 2, points: 42, place: 3, worst: true },
    ])
  })

  it("ranks by points rather than cards left, ties sharing a place", () => {
    const state = over(
      [[n(3), n(4)], [chef], [n(2), n(4, "bagel"), n(14)], []],
      3,
    )
    expect(standings(state)).toEqual([
      { player: 3, points: 0, place: 1, worst: false },
      { player: 0, points: 7, place: 2, worst: false },
      { player: 1, points: 20, place: 3, worst: true },
      { player: 2, points: 20, place: 3, worst: true },
    ])
  })

  it("shares first place with anyone else left empty-handed", () => {
    const state = over([[n(5)], [], []], 2)
    expect(
      standings(state).map(({ player, place }) => [player, place]),
    ).toEqual([
      [2, 1],
      [1, 1],
      [0, 3],
    ])
  })

  it("names no worst baker in a two-player game", () => {
    const state = over([[], [n(9)]])
    expect(standings(state)[1]).toEqual({
      player: 1,
      points: 9,
      place: 2,
      worst: false,
    })
  })

  it("falls back to cards left when hands are hidden", () => {
    const state = over([[], [chef], [n(2), n(3)]])
    state.pending = null
    const view = viewFor(state, 0)
    view.pending = { kind: "gameOver", winner: 0 }
    expect(standings(view)).toEqual([
      { player: 0, points: null, place: 1, worst: false },
      { player: 1, points: null, place: 2, worst: false },
      { player: 2, points: null, place: 3, worst: false },
    ])
  })
})

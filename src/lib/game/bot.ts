import {
  canPlaceOn,
  cardPoints,
  cardsShort,
  opensScorch,
  cookPlayError,
  isOvenBlockedFor,
  legalOvens,
  ovenCapacity,
} from "./engine"
import { isVisible } from "./cards"
import {
  CARDS_PER_TURN,
  PASTRIES,
  type Action,
  type Card,
  type CookCard,
  type CookTarget,
  type GameState,
  type NumberCard,
  type Pastry,
  type VisibleCard,
} from "./types"

type ChainStep = { cardId: string; oven: number }
// An opponent this close to emptying their hand may end the game any turn,
// so the bot sheds its most expensive cards first.
const ENDGAME_HAND = 2
type Chain = { steps: ChainStep[]; score: number; burns: number }

// How many other cards in the hand share a colour or value with this one.
// Isolated cards are the hardest to shed.
function flexibility(card: Card, hand: Card[]) {
  return hand.filter(
    (other) =>
      other !== card &&
      // Colourless chefs do not match each other.
      ((other.pastry !== null && other.pastry === card.pastry) ||
        (other.type === "number" &&
          card.type === "number" &&
          other.value === card.value)),
  ).length
}

// Ties go to the card worth more penalty points.
function leastFlexible(hand: VisibleCard[]) {
  return hand.reduce((worst, card) => {
    const diff = flexibility(card, hand) - flexibility(worst, hand)
    return diff < 0 || (diff === 0 && cardPoints(card) > cardPoints(worst))
      ? card
      : worst
  })
}

export function bestChain(state: GameState, botId: number): Chain | null {
  const turn = state.turn
  const me = state.players[botId]
  const remaining = cardsShort(turn)
  if (remaining <= 0) return null
  const numbers = me.hand.filter(
    (card): card is NumberCard => card.type === "number",
  )
  const open = state.ovens.map((oven) => !isOvenBlockedFor(oven, botId))
  const capacity = ovenCapacity(state)

  let best: Chain | null = null

  const score = (
    steps: ChainStep[],
    played: NumberCard[],
    stacks: VisibleCard[][],
    burns: number,
    scorches: number,
  ) => {
    const values = [...turn.values, ...played.map((card) => card.value)]
    const recipe =
      values.length === CARDS_PER_TURN &&
      values.every((value) => value === values[0])
    const handAfter = me.hand.length - played.length + burns
    const newScorch = turn.scorchPlays === 0 && scorches > 0
    // Ovens left one card short of burning are traps for the next player.
    const traps = new Set(steps.map((step) => step.oven))
    const trapBonus = [...traps].filter(
      (oven) => stacks[oven].length === capacity - 1,
    ).length
    // High pastries cost more points if the game ends with them in hand.
    const shed = played.reduce((sum, card) => sum + card.value, 0)
    return (
      played.length * 10 +
      shed / 2 -
      burns * 26 -
      (newScorch ? 9 : 0) +
      (recipe ? 10 : 0) +
      (handAfter === 0 && !newScorch ? 200 : 0) +
      trapBonus * 3
    )
  }

  // Each pastry may go into any oven, so search over (card, oven) pairs.
  const search = (
    stacks: VisibleCard[][],
    steps: ChainStep[],
    played: NumberCard[],
    burns: number,
    scorches: number,
  ) => {
    if (steps.length > 0) {
      const value = score(steps, played, stacks, burns, scorches)
      if (!best || value > best.score) best = { steps, score: value, burns }
    }
    if (steps.length >= remaining) return
    for (const card of numbers) {
      if (played.includes(card)) continue
      stacks.forEach((stack, oven) => {
        if (!open[oven]) return
        if (!canPlaceOn({ cards: stack, lockedBy: null }, card)) return
        const scorch = opensScorch(stack.at(-1), card)
        const next = [...stack, card]
        const burned = next.length >= capacity
        const nextStacks = stacks.map((s, i) =>
          i === oven ? (burned ? [] : next) : s,
        )
        search(
          nextStacks,
          [...steps, { cardId: card.id, oven }],
          [...played, card],
          burns + (burned ? 1 : 0),
          scorches + (scorch ? 1 : 0),
        )
      })
    }
  }

  search(
    state.ovens.map((oven) => oven.cards),
    [],
    [],
    0,
    0,
  )
  return best
}

function cookTarget(
  state: GameState,
  botId: number,
  card: CookCard,
): CookTarget | null {
  const ovens = legalOvens(state, botId, card)
  if (ovens.length === 0) return null
  const size = (index: number) => state.ovens[index].cards.length
  // The cook itself adds a card, so avoid ovens one card short of burning.
  const safe = ovens.filter((index) => size(index) < ovenCapacity(state) - 1)
  const pool = safe.length > 0 ? safe : ovens
  const emptiest = pool.reduce((a, b) => (size(b) < size(a) ? b : a))

  switch (card.cook) {
    case "clean": {
      const fullest = pool.reduce((a, b) => (size(b) > size(a) ? b : a))
      return { cook: "clean", oven: fullest }
    }
    case "lock":
      return { cook: "lock", oven: emptiest }
    case "spy": {
      // Disrupt whoever is closest to winning.
      const opponents = state.players.filter((p) => p.id !== botId)
      const target = opponents.reduce((a, b) =>
        b.hand.length < a.hand.length ? b : a,
      )
      return { cook: "spy", oven: emptiest, opponent: target.id }
    }
    case "carousel":
      return { cook: "carousel", oven: emptiest }
    case "chef": {
      // Switch to the colour the bot holds the most of.
      const counts = new Map<Pastry, number>()
      for (const other of state.players[botId].hand) {
        if (other.type === "number") {
          counts.set(other.pastry, (counts.get(other.pastry) ?? 0) + 1)
        }
      }
      const pastry = PASTRIES.reduce((a, b) =>
        (counts.get(b) ?? 0) > (counts.get(a) ?? 0) ? b : a,
      )
      return { cook: "chef", oven: emptiest, pastry }
    }
  }
}

function cookAction(
  state: GameState,
  botId: number,
  card: CookCard,
): Action | null {
  if (cookPlayError(state, botId, card)) return null
  const target = cookTarget(state, botId, card)
  return target
    ? { type: "playCook", player: botId, cardId: card.id, target }
    : null
}

function firstCook(state: GameState, botId: number, kind?: CookCard["cook"]) {
  return state.players[botId].hand.find(
    (card): card is CookCard =>
      card.type === "cook" && (kind === undefined || card.cook === kind),
  )
}

export function chooseBotAction(
  state: GameState,
  botId: number,
): Action | null {
  const pending = state.pending
  const me = state.players[botId]

  if (pending?.kind === "carousel") {
    if (pending.choices[botId] !== undefined || me.hand.length === 0)
      return null
    return {
      type: "submitCarousel",
      player: botId,
      cardId: leastFlexible(me.hand.filter(isVisible)).id,
    }
  }
  if (pending || state.current !== botId) return null

  const turn = state.turn
  const endTurn: Action = { type: "endTurn", player: botId }

  if (me.hand.every((card) => card.type === "cook") && me.hand.length > 0) {
    for (const card of me.hand) {
      const action = cookAction(state, botId, card as CookCard)
      if (action) return action
    }
  }

  // A blind swap is worth a gamble when stuck with an isolated card.
  const spy = firstCook(state, botId, "spy")
  if (
    spy &&
    turn.cardsPlayed === 0 &&
    me.hand.length >= 3 &&
    me.hand.some((card) => flexibility(card, me.hand) === 0)
  ) {
    const action = cookAction(state, botId, spy)
    if (action) return action
  }

  const carousel = firstCook(state, botId, "carousel")
  if (
    carousel &&
    turn.cardsPlayed === 0 &&
    me.hand.length >= 3 &&
    me.hand.some((card) => flexibility(card, me.hand) === 0)
  ) {
    const action = cookAction(state, botId, carousel)
    if (action) return action
  }

  // Cooks cost the most points, so get rid of them before the game ends.
  const endgame = state.players.some(
    (p) => p.id !== botId && p.hand.length <= ENDGAME_HAND,
  )
  if (endgame && cardsShort(turn) > 0) {
    const cooks = me.hand
      .filter((card): card is CookCard => card.type === "cook")
      .sort((a, b) => cardPoints(b) - cardPoints(a))
    for (const card of cooks) {
      const action = cookAction(state, botId, card)
      if (action) return action
    }
  }

  const chain = bestChain(state, botId)
  const clean = firstCook(state, botId, "clean")
  if (
    clean &&
    (!chain || chain.burns > 0) &&
    (turn.cardsPlayed === 0 || chain) &&
    !cookPlayError(state, botId, clean)
  ) {
    const chainOven = chain?.steps[0].oven
    const target: CookTarget | null =
      chainOven !== undefined &&
      legalOvens(state, botId, clean).includes(chainOven) &&
      state.ovens[chainOven].cards.length < ovenCapacity(state) - 1
        ? { cook: "clean", oven: chainOven }
        : cookTarget(state, botId, clean)
    if (target) {
      return { type: "playCook", player: botId, cardId: clean.id, target }
    }
  }

  if (chain && chain.score > 0) {
    const [step] = chain.steps
    return {
      type: "playNumber",
      player: botId,
      cardId: step.cardId,
      oven: step.oven,
    }
  }

  const lock = firstCook(state, botId, "lock")
  if (lock && state.players.some((p) => p.id !== botId && p.hand.length <= 3)) {
    const action = cookAction(state, botId, lock)
    if (action) return action
  }

  // Every card short of the quota is drawn at the end of the turn, so any
  // playable cook is better than holding it.
  if (cardsShort(turn) > 0) {
    for (const card of me.hand) {
      if (card.type !== "cook") continue
      const action = cookAction(state, botId, card)
      if (action) return action
    }
  }
  return endTurn
}

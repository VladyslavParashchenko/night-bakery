import { createDeck, nextRandom, shuffle } from "./cards"
import {
  PASTRIES,
  BURN_PENALTY,
  CARDS_PER_TURN,
  HAND_SIZE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  OVEN_CAPACITY,
  OVEN_COUNT,
  type Action,
  type ActionResult,
  type Card,
  type DrawReason,
  type GameError,
  type GameState,
  type HiddenCard,
  type LogEntry,
  type NumberCard,
  type Oven,
  type PlayerSetup,
  type TurnState,
} from "./types"

const LOG_LIMIT = 60

function emptyTurn(): TurnState {
  return {
    cardsPlayed: 0,
    scorchPlays: 0,
    values: [],
  }
}

export function createGame(setups: PlayerSetup[], seed: number): GameState {
  if (setups.length < MIN_PLAYERS || setups.length > MAX_PLAYERS) {
    throw new Error(`Night Bakery needs ${MIN_PLAYERS}-${MAX_PLAYERS} players`)
  }
  const state: GameState = {
    players: setups.map((setup, id) => ({
      id,
      name: setup.name,
      isBot: setup.isBot,
      hand: [],
    })),
    ovens: [],
    deck: [],
    discard: [],
    current: 0,
    turn: emptyTurn(),
    pending: null,
    rng: seed,
    log: [],
    stats: {
      turns: 1,
      players: setups.map(() => ({ played: 0, burns: 0, drawn: 0 })),
    },
  }
  deal(state)
  return state
}

function deal(state: GameState) {
  const [deck, rng] = shuffle(createDeck(), state.rng)
  state.rng = rng
  state.deck = deck
  for (let round = 0; round < HAND_SIZE; round++) {
    for (const player of state.players) player.hand.push(state.deck.pop()!)
  }
  for (let i = 0; i < OVEN_COUNT; i++) {
    state.ovens.push({ cards: [drawNumberForOven(state)], lockedBy: null })
  }
}

function drawNumberForOven(state: GameState): NumberCard {
  for (;;) {
    const card = state.deck.pop()!
    if (card.type === "number") return card
    // A cook goes back into the deck, which is reshuffled before the next try.
    const [deck, rng] = shuffle([...state.deck, card], state.rng)
    state.deck = deck
    state.rng = rng
  }
}

function pushLog(state: GameState, entry: LogEntry) {
  state.log.push(entry)
  if (state.log.length > LOG_LIMIT)
    state.log.splice(0, state.log.length - LOG_LIMIT)
}

function drawCards(
  state: GameState,
  playerId: number,
  count: number,
  reason: DrawReason,
): Card[] {
  const drawn: Card[] = []
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break
      const [deck, rng] = shuffle(state.discard, state.rng)
      state.deck = deck
      state.discard = []
      state.rng = rng
    }
    drawn.push(state.deck.pop()!)
  }
  state.players[playerId].hand.push(...drawn)
  state.stats.players[playerId].drawn += drawn.length
  if (drawn.length > 0) {
    pushLog(state, {
      type: "draw",
      player: playerId,
      count: drawn.length,
      reason,
    })
  }
  return drawn
}

function removeFromHand(state: GameState, playerId: number, cardId: string) {
  const hand = state.players[playerId].hand
  const index = hand.findIndex((card) => card.id === cardId)
  return hand.splice(index, 1)[0]
}

// Any card matches the top card by colour; pastries may also match by value.
export function canPlaceOn(oven: Oven, card: Card) {
  const top = oven.cards.at(-1)
  // The chef has no colour of its own and goes anywhere.
  if (card.type === "cook" && card.pastry === null) return true
  if (!top || top.pastry === card.pastry) return true
  return (
    card.type === "number" && top.type === "number" && top.value === card.value
  )
}

// Matching the top card by value is legal but opens the scorch window.
export function opensScorch(top: Card | undefined, card: NumberCard) {
  return top?.type === "number" && top.value === card.value
}

export function isOvenBlockedFor(oven: Oven, playerId: number) {
  return oven.lockedBy !== null && oven.lockedBy !== playerId
}

function turnError(state: GameState, playerId: number): GameError | null {
  if (state.pending) return "pending"
  if (playerId !== state.current) return "notYourTurn"
  return null
}

export function numberPlayError(
  state: GameState,
  playerId: number,
  card: Card,
  ovenIndex: number,
): GameError | null {
  const error = turnError(state, playerId)
  if (error) return error
  if (card.type !== "number") return "wrongCardType"
  if (state.turn.cardsPlayed >= CARDS_PER_TURN) return "tooManyCards"
  return ovenError(state, playerId, card, ovenIndex)
}

export function cookPlayError(
  state: GameState,
  playerId: number,
  card: Card,
): GameError | null {
  const error = turnError(state, playerId)
  if (error) return error
  if (card.type !== "cook") return "wrongCardType"
  return state.turn.cardsPlayed >= CARDS_PER_TURN ? "tooManyCards" : null
}

function ovenError(
  state: GameState,
  playerId: number,
  card: Card,
  ovenIndex: number,
): GameError | null {
  const oven = state.ovens[ovenIndex]
  if (!oven) return "invalidTarget"
  if (isOvenBlockedFor(oven, playerId)) return "ovenLocked"
  if (!canPlaceOn(oven, card)) return "doesNotFit"
  return null
}

// Why `card` cannot go into the given oven right now, or null if it can.
export function playError(
  state: GameState,
  playerId: number,
  card: Card,
  ovenIndex: number,
): GameError | null {
  if (card.type === "number") {
    return numberPlayError(state, playerId, card, ovenIndex)
  }
  return (
    cookPlayError(state, playerId, card) ??
    ovenError(state, playerId, card, ovenIndex)
  )
}

export function legalOvens(state: GameState, playerId: number, card: Card) {
  return state.ovens
    .map((_, index) => index)
    .filter((index) => playError(state, playerId, card, index) === null)
}

export function canEndTurn(state: GameState, playerId: number) {
  return turnError(state, playerId) === null
}

export function cardsShort(turn: TurnState) {
  return Math.max(0, CARDS_PER_TURN - turn.cardsPlayed)
}

export function applyAction(state: GameState, action: Action): ActionResult {
  const draft = structuredClone(state)
  const error = reduce(draft, action)
  return error ? { ok: false, error } : { ok: true, state: draft }
}

function reduce(state: GameState, action: Action): GameError | null {
  switch (action.type) {
    case "playNumber":
      return playNumber(state, action.player, action.cardId, action.oven)
    case "playCook":
      return playCook(state, action)
    case "submitCarousel":
      return submitCarousel(state, action.player, action.cardId)
    case "endTurn":
      return endTurn(state, action.player)
    case "slap":
      return slap(state, action.player)
    case "closeScorch":
      return closeScorch(state)
  }
}

function findCard(state: GameState, playerId: number, cardId: string) {
  return state.players[playerId]?.hand.find((card) => card.id === cardId)
}

function playNumber(
  state: GameState,
  playerId: number,
  cardId: string,
  ovenIndex: number,
): GameError | null {
  const card = findCard(state, playerId, cardId)
  if (!card) return turnError(state, playerId) ?? "cardNotInHand"
  const error = numberPlayError(state, playerId, card, ovenIndex)
  if (error || card.type !== "number") return error

  const oven = state.ovens[ovenIndex]
  const turn = state.turn
  if (opensScorch(oven.cards.at(-1), card)) turn.scorchPlays++
  removeFromHand(state, playerId, cardId)
  oven.cards.push(card)
  turn.cardsPlayed++
  turn.values.push(card.value)
  state.stats.players[playerId].played++
  pushLog(state, { type: "play", player: playerId, card, oven: ovenIndex })
  burnIfFull(state, playerId, ovenIndex)
  winIfEmpty(state, playerId)
  return null
}

// Chefs lose the colour they were given so they come back wild when reshuffled.
function emptyOven(state: GameState, oven: Oven) {
  for (const card of oven.cards) {
    state.discard.push(
      card.type === "cook" && card.cook === "chef"
        ? { ...card, pastry: null }
        : card,
    )
  }
  oven.cards = []
}

function burnIfFull(state: GameState, playerId: number, ovenIndex: number) {
  const oven = state.ovens[ovenIndex]
  if (oven.cards.length < OVEN_CAPACITY) return
  emptyOven(state, oven)
  state.stats.players[playerId].burns++
  pushLog(state, { type: "burn", player: playerId, oven: ovenIndex })
  drawCards(state, playerId, BURN_PENALTY, "burn")
}

function playCook(
  state: GameState,
  action: Extract<Action, { type: "playCook" }>,
): GameError | null {
  const { player: playerId, cardId, target } = action
  const card = findCard(state, playerId, cardId)
  if (!card) return turnError(state, playerId) ?? "cardNotInHand"
  const error = cookPlayError(state, playerId, card)
  if (error || card.type !== "cook") return error
  if (card.cook !== target.cook) return "invalidTarget"

  const targetError =
    ovenError(state, playerId, card, target.oven) ??
    validateCookTarget(state, playerId, target)
  if (targetError) return targetError

  // The cook goes into the oven like any other card and counts towards the
  // burn limit; its effect applies afterwards.
  const oven = state.ovens[target.oven]
  removeFromHand(state, playerId, cardId)
  oven.cards.push(
    target.cook === "chef" ? { ...card, pastry: target.pastry } : card,
  )
  state.turn.cardsPlayed++
  state.stats.players[playerId].played++
  pushLog(state, {
    type: "cook",
    player: playerId,
    cook: card.cook,
    oven: target.oven,
    opponent: target.cook === "spy" ? target.opponent : undefined,
    pastry: target.cook === "chef" ? target.pastry : undefined,
  })
  burnIfFull(state, playerId, target.oven)

  switch (target.cook) {
    case "clean":
      emptyOven(state, oven)
      break
    case "lock":
      oven.lockedBy = playerId
      break
    case "spy":
      swapRandomCards(state, playerId, target.opponent)
      break
    case "carousel":
      state.pending = { kind: "carousel", choices: {} }
      resolveCarouselIfReady(state)
      break
    case "chef":
      // The colour it now shows is the whole effect.
      break
  }
  winIfEmpty(state, playerId)
  return null
}

// A player wins the moment their last card is played and its effect leaves
// them empty-handed (a burn penalty refills the hand), even mid-turn.
function winIfEmpty(state: GameState, playerId: number) {
  if (state.players[playerId].hand.length > 0) return
  pushLog(state, { type: "win", player: playerId })
  state.pending = { kind: "gameOver", winner: playerId }
}

function validateCookTarget(
  state: GameState,
  playerId: number,
  target: Extract<Action, { type: "playCook" }>["target"],
): GameError | null {
  if (target.cook === "chef") {
    return PASTRIES.includes(target.pastry) ? null : "invalidTarget"
  }
  if (target.cook !== "spy") return null
  const opponent = state.players[target.opponent]
  return !opponent || opponent.id === playerId ? "invalidTarget" : null
}

function randomIndex(state: GameState, length: number) {
  const [random, rng] = nextRandom(state.rng)
  state.rng = rng
  return Math.floor(random * length)
}

function swapRandomCards(
  state: GameState,
  playerId: number,
  opponentId: number,
) {
  const own = state.players[playerId].hand
  const their = state.players[opponentId].hand
  if (own.length === 0 || their.length === 0) return
  const given = own.splice(randomIndex(state, own.length), 1)[0]
  const taken = their.splice(randomIndex(state, their.length), 1)[0]
  own.push(taken)
  their.push(given)
}

// Only players holding cards take part.
function carouselParticipants(state: GameState) {
  return state.players
    .filter((player) => player.hand.length > 0)
    .map((p) => p.id)
}

function resolveCarouselIfReady(state: GameState) {
  const pending = state.pending
  if (pending?.kind !== "carousel") return
  const participants = carouselParticipants(state)
  if (!participants.every((id) => pending.choices[id] !== undefined)) return

  const passed = participants.map((id, i) => ({
    to: participants[(i + 1) % participants.length],
    card: removeFromHand(state, id, pending.choices[id]),
  }))
  for (const { to, card } of passed) state.players[to].hand.push(card)
  state.pending = null
  pushLog(state, { type: "carouselDone" })
}

function submitCarousel(
  state: GameState,
  playerId: number,
  cardId: string,
): GameError | null {
  const pending = state.pending
  if (pending?.kind !== "carousel") return "noPending"
  if (pending.choices[playerId] !== undefined) return "alreadySubmitted"
  if (!findCard(state, playerId, cardId)) return "cardNotInHand"
  pending.choices[playerId] = cardId
  resolveCarouselIfReady(state)
  return null
}

function endTurn(state: GameState, playerId: number): GameError | null {
  const error = turnError(state, playerId)
  if (error) return error
  const turn = state.turn

  if (turn.cardsPlayed === 0) {
    pushLog(state, { type: "pass", player: playerId })
  }

  const signatureRecipe =
    turn.values.length === CARDS_PER_TURN &&
    turn.values.every((value) => value === turn.values[0])
  if (signatureRecipe) {
    for (const player of state.players) {
      if (player.id !== playerId) drawCards(state, player.id, 1, "recipe")
    }
  }

  // Top up the unplayed quota.
  const missing = cardsShort(turn)
  if (missing > 0) drawCards(state, playerId, missing, "shortfall")

  if (turn.scorchPlays > 0) {
    state.pending = { kind: "scorch", offender: playerId }
    return null
  }
  finishTurn(state)
  return null
}

function slap(state: GameState, playerId: number): GameError | null {
  const pending = state.pending
  if (pending?.kind !== "scorch") return "noPending"
  if (!state.players[playerId] || playerId === pending.offender) {
    return "invalidTarget"
  }
  state.pending = null
  drawCards(state, pending.offender, 1, "scorch")
  finishTurn(state)
  return null
}

function closeScorch(state: GameState): GameError | null {
  if (state.pending?.kind !== "scorch") return "noPending"
  state.pending = null
  finishTurn(state)
  return null
}

function finishTurn(state: GameState) {
  state.current = (state.current + 1) % state.players.length
  state.turn = emptyTurn()
  state.stats.turns++
  for (const oven of state.ovens) {
    if (oven.lockedBy === state.current) oven.lockedBy = null
  }
}

function hiddenCard(id: string): HiddenCard {
  return { id, type: "hidden" }
}

// What `playerId` may see; safe to send to a remote player.
export function viewFor(state: GameState, playerId: number): GameState {
  const view = structuredClone(state)
  // Once the game is over, everyone may see what the others were left with.
  const over = view.pending?.kind === "gameOver"
  for (const player of view.players) {
    if (player.id === playerId || over) continue
    player.hand = player.hand.map((_, i) =>
      hiddenCard(`hidden-${player.id}-${i}`),
    )
  }
  view.deck = view.deck.map((_, i) => hiddenCard(`hidden-deck-${i}`))
  view.rng = 0
  const pending = view.pending
  if (pending?.kind === "carousel") {
    for (const id of Object.keys(pending.choices)) {
      if (Number(id) !== playerId) pending.choices[Number(id)] = "hidden"
    }
  }
  return view
}

export function handOverToBot(state: GameState, playerId: number): GameState {
  const next = structuredClone(state)
  const player = next.players[playerId]
  if (player) player.isBot = true
  return next
}

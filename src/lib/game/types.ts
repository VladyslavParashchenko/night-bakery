export const PASTRIES = ["croissant", "bagel", "pretzel", "donut"] as const
export type Pastry = (typeof PASTRIES)[number]

export const COOKS = ["clean", "lock", "spy", "carousel", "chef"] as const
export type CookKind = (typeof COOKS)[number]
// Every coloured cook comes once in each colour; the chef has no colour.
export const COLOURED_COOKS = ["clean", "lock", "spy", "carousel"] as const
export const CHEF_COPIES = 4

// Ranks follow a standard 52-card deck, numbered 2-14 (11-13 are the face
// cards, 14 is the ace).
export const MIN_VALUE = 2
export const MAX_VALUE = 14
export const HAND_SIZE = 7
export const OVEN_COUNT = 3
export const OVEN_CAPACITY = 5
export const BURN_PENALTY = 2
// At most this many cards (pastries and cooks alike) per turn; ending a turn
// with fewer played draws the difference.
export const CARDS_PER_TURN = 3
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 5

export type NumberCard = {
  id: string
  type: "number"
  pastry: Pastry
  value: number
}

export type CookCard = {
  id: string
  type: "cook"
  cook: CookKind
  // Cooks have a colour too and can only go on an oven of that colour. The
  // chef is null in hand and takes the colour its player picks when played.
  pastry: Pastry | null
}

// A card hidden by `viewFor`; the engine and bots never see one.
export type HiddenCard = { id: string; type: "hidden"; pastry?: undefined }

export type VisibleCard = NumberCard | CookCard
export type Card = VisibleCard | HiddenCard

export type Oven = {
  cards: VisibleCard[]
  lockedBy: number | null
}

export type Player = {
  id: number
  name: string
  isBot: boolean
  hand: Card[]
}

export type TurnState = {
  cardsPlayed: number
  scorchPlays: number
  values: number[]
}

export type Pending =
  | { kind: "carousel"; choices: Record<number, string> }
  | { kind: "scorch"; offender: number }
  | { kind: "gameOver"; winner: number }

export type LogEntry =
  | { type: "play"; player: number; card: NumberCard; oven: number }
  | { type: "burn"; player: number; oven: number }
  | {
      type: "cook"
      player: number
      cook: CookKind
      oven?: number
      opponent?: number
      pastry?: Pastry
    }
  | { type: "draw"; player: number; count: number; reason: DrawReason }
  | { type: "pass"; player: number }
  | { type: "carouselDone" }
  | { type: "win"; player: number }

export type DrawReason = "shortfall" | "burn" | "recipe" | "scorch"

export type GameState = {
  players: Player[]
  ovens: Oven[]
  deck: Card[]
  discard: VisibleCard[]
  current: number
  turn: TurnState
  pending: Pending | null
  rng: number
  log: LogEntry[]
}

export type CookTarget =
  | { cook: "clean"; oven: number }
  | { cook: "lock"; oven: number }
  | { cook: "spy"; oven: number; opponent: number }
  | { cook: "carousel"; oven: number }
  | { cook: "chef"; oven: number; pastry: Pastry }

export type Action =
  | { type: "playNumber"; player: number; cardId: string; oven: number }
  | { type: "playCook"; player: number; cardId: string; target: CookTarget }
  | { type: "submitCarousel"; player: number; cardId: string }
  | { type: "endTurn"; player: number }
  | { type: "slap"; player: number }
  | { type: "closeScorch" }

export type GameError =
  | "pending"
  | "notYourTurn"
  | "cardNotInHand"
  | "wrongCardType"
  | "tooManyCards"
  | "ovenLocked"
  | "doesNotFit"
  | "invalidTarget"
  | "noPending"
  | "alreadySubmitted"

export type ActionResult =
  { ok: true; state: GameState } | { ok: false; error: GameError }

export type PlayerSetup = { name: string; isBot: boolean }

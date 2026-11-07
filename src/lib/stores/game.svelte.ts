import { chooseBotAction } from "$lib/game/bot"
import {
  applyAction,
  createGame,
  gameOptions,
  handOverToBot,
} from "$lib/game/engine"
import {
  DEFAULT_OPTIONS,
  type Action,
  type GameError,
  type GameOptions,
  type GameState,
  type PlayerSetup,
} from "$lib/game/types"

export const HUMAN_ID = 0

const BOT_DELAY_MS = 800
const CAROUSEL_DELAY_MS = 350
export const SCORCH_WINDOW_MS = 2200

// Chance that each bot notices a matching value, depending on who played it.
const BOT_SLAP_CHANCE_VS_HUMAN = 0.55
const BOT_SLAP_CHANCE_VS_BOT = 0.3

type Timer = ReturnType<typeof setTimeout>

// Online play: the host runs the game and publishes each state; a guest
// shows what it receives and forwards its actions.
export type Link =
  | { role: "host"; publish: (state: GameState) => void; close: () => void }
  | { role: "guest"; send: (action: Action) => void; close: () => void }

class GameStore {
  state = $state.raw<GameState | null>(null)
  // The seat this device plays.
  me = $state(HUMAN_ID)
  link = $state.raw<Link | null>(null)
  error = $state<GameError | null>(null)
  // Bumped on every reported error so the same message can show again.
  errorKey = $state(0)
  // Wins per seat at this table; rematches keep counting.
  wins = $state<number[]>([])
  // When the current game started and, once it is over, ended.
  startedAt = $state(0)
  endedAt = $state(0)
  #timers = new Set<Timer>()

  // A new table: the score starts over.
  start(
    setups: PlayerSetup[],
    options: GameOptions = DEFAULT_OPTIONS,
    seed = Date.now(),
  ) {
    this.#clearTimers()
    this.state = null
    this.#begin(setups, options, seed)
  }

  #begin(setups: PlayerSetup[], options: GameOptions, seed = Date.now()) {
    this.me = HUMAN_ID
    this.#set(createGame(setups, seed >>> 0, options))
    this.error = null
  }

  connect(link: Link) {
    this.link = link
  }

  receive(state: GameState, me: number) {
    this.#track(this.state, state)
    this.state = state
    this.me = me
    this.error = null
  }

  rematch() {
    if (!this.state || this.link?.role === "guest") return
    this.#begin(
      this.state.players.map(({ name, isBot }) => ({ name, isBot })),
      gameOptions(this.state),
    )
  }

  quit() {
    this.#clearTimers()
    this.state = null
    const link = this.link
    this.link = null
    link?.close()
  }

  showError(error: GameError) {
    this.error = error
    this.errorKey++
  }

  clearError() {
    this.error = null
  }

  dispatch(action: Action) {
    if (this.link?.role === "guest") {
      this.link.send(action)
      return true
    }
    if (!this.state) return false
    return this.#apply(action, true) === null
  }

  // The host's check of a remote action; the error goes back to the sender.
  applyRemote(action: Action): GameError | null {
    return this.#apply(action, false)
  }

  replaceWithBot(playerId: number) {
    if (!this.state) return
    this.#set(handOverToBot(this.state, playerId))
  }

  // Bots and timers act through here; their rejected moves are not the
  // player's mistakes, so they never show an error.
  #auto(action: Action) {
    this.#apply(action, false)
  }

  #apply(action: Action, report: boolean): GameError | null {
    // The game has just ended; nothing to do.
    if (!this.state) return null
    const result = applyAction(this.state, action)
    if (!result.ok) {
      if (report) this.showError(result.error)
      return result.error
    }
    this.error = null
    this.#set(result.state)
    return null
  }

  #set(state: GameState) {
    this.#track(this.state, state)
    this.state = state
    this.#schedule()
    if (this.link?.role === "host") this.link.publish(state)
  }

  // Keeps the score and the clock; guests see the same states, so this works
  // on both ends of an online game.
  #track(previous: GameState | null, next: GameState) {
    const wasOver = previous?.pending?.kind === "gameOver"
    if (!previous) this.wins = next.players.map(() => 0)
    if (!previous || (wasOver && next.pending?.kind !== "gameOver")) {
      this.startedAt = Date.now()
      this.endedAt = 0
    }
    if (next.pending?.kind === "gameOver" && !wasOver) {
      this.wins[next.pending.winner]++
      this.endedAt = Date.now()
    }
  }

  #clearTimers() {
    for (const timer of this.#timers) clearTimeout(timer)
    this.#timers.clear()
  }

  #later(delay: number, fn: () => void) {
    const timer = setTimeout(() => {
      this.#timers.delete(timer)
      fn()
    }, delay)
    this.#timers.add(timer)
  }

  // Every state change cancels outstanding timers and schedules what comes
  // next, so a timer never acts on a stale state.
  #schedule() {
    this.#clearTimers()
    const state = this.state
    if (!state) return
    const pending = state.pending

    if (pending?.kind === "scorch") {
      this.#scheduleScorch(state, pending.offender)
      return
    }
    if (pending?.kind === "gameOver") return

    if (pending?.kind === "carousel") {
      // One bot picks at a time; the next is scheduled after it commits.
      for (const player of state.players) {
        if (!player.isBot) continue
        const action = chooseBotAction(state, player.id)
        if (action) {
          this.#later(CAROUSEL_DELAY_MS, () => this.#auto(action))
          return
        }
      }
      return
    }

    const current = state.players[state.current]
    if (!current.isBot) return
    const action = chooseBotAction(state, current.id)
    if (action) this.#later(BOT_DELAY_MS, () => this.#auto(action))
  }

  #scheduleScorch(state: GameState, offender: number) {
    const chance = state.players[offender].isBot
      ? BOT_SLAP_CHANCE_VS_BOT
      : BOT_SLAP_CHANCE_VS_HUMAN
    for (const player of state.players) {
      if (!player.isBot || player.id === offender) continue
      if (Math.random() >= chance) continue
      const delay = 500 + Math.random() * (SCORCH_WINDOW_MS - 700)
      this.#later(delay, () => this.#auto({ type: "slap", player: player.id }))
    }
    this.#later(SCORCH_WINDOW_MS, () => this.#auto({ type: "closeScorch" }))
  }
}

export const game = new GameStore()

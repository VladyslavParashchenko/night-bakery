import { chooseBotAction } from "$lib/game/bot"
import { applyAction, createGame } from "$lib/game/engine"
import type { Action, GameError, GameState, PlayerSetup } from "$lib/game/types"

export const HUMAN_ID = 0

const BOT_DELAY_MS = 800
const CAROUSEL_DELAY_MS = 350
export const SCORCH_WINDOW_MS = 2200

// Chance that each bot notices a matching value, depending on who played it.
const BOT_SLAP_CHANCE_VS_HUMAN = 0.55
const BOT_SLAP_CHANCE_VS_BOT = 0.3

type Timer = ReturnType<typeof setTimeout>

class GameStore {
  state = $state.raw<GameState | null>(null)
  error = $state<GameError | null>(null)
  // Bumped on every reported error so the same message can show again.
  errorKey = $state(0)
  #timers = new Set<Timer>()

  start(setups: PlayerSetup[], seed = Date.now()) {
    this.state = createGame(setups, seed >>> 0)
    this.error = null
    this.#schedule()
  }

  rematch() {
    if (!this.state) return
    this.start(this.state.players.map(({ name, isBot }) => ({ name, isBot })))
  }

  quit() {
    this.#clearTimers()
    this.state = null
  }

  showError(error: GameError) {
    this.error = error
    this.errorKey++
  }

  clearError() {
    this.error = null
  }

  dispatch(action: Action) {
    return this.#apply(action, true)
  }

  // Bots and timers act through here; their rejected moves are not the
  // player's mistakes, so they never show an error.
  #auto(action: Action) {
    this.#apply(action, false)
  }

  #apply(action: Action, report: boolean) {
    if (!this.state) return false
    const result = applyAction(this.state, action)
    if (!result.ok) {
      if (report) this.showError(result.error)
      return false
    }
    this.state = result.state
    this.error = null
    this.#schedule()
    return true
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
    const chance =
      offender === HUMAN_ID ? BOT_SLAP_CHANCE_VS_HUMAN : BOT_SLAP_CHANCE_VS_BOT
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

import { m } from "$lib/i18n/messages"
import {
  type NumberCard,
  type CookKind,
  type GameError,
  type GameState,
  type LogEntry,
  type Pastry,
} from "$lib/game/types"

export const PASTRY_EMOJI: Record<Pastry, string> = {
  croissant: "🥐",
  bagel: "🥯",
  pretzel: "🥨",
  donut: "🍩",
}

export const COOK_EMOJI: Record<CookKind, string> = {
  clean: "🧹",
  lock: "🔒",
  spy: "🕵️",
  carousel: "🎠",
  chef: "👨‍🍳",
}

export function pastryName(pastry: Pastry) {
  return {
    croissant: m.pastry_croissant,
    bagel: m.pastry_bagel,
    pretzel: m.pastry_pretzel,
    donut: m.pastry_donut,
  }[pastry]()
}

export function cookName(cook: CookKind) {
  return {
    clean: m.cook_clean,
    lock: m.cook_lock,
    spy: m.cook_spy,
    carousel: m.cook_carousel,
    chef: m.cook_chef,
  }[cook]()
}

export function cookHint(cook: CookKind) {
  return {
    clean: m.cookHint_clean,
    lock: m.cookHint_lock,
    spy: m.cookHint_spy,
    carousel: m.cookHint_carousel,
    chef: m.cookHint_chef,
  }[cook]()
}

export function errorMessage(error: GameError) {
  return {
    pending: m.error_pending,
    notYourTurn: m.error_notYourTurn,
    cardNotInHand: m.error_cardNotInHand,
    wrongCardType: m.error_wrongCardType,
    tooManyCards: m.error_tooManyCards,
    ovenLocked: m.error_ovenLocked,
    doesNotFit: m.error_doesNotFit,
    invalidTarget: m.error_invalidTarget,
    noPending: m.error_noPending,
    alreadySubmitted: m.error_alreadySubmitted,
  }[error]()
}

// How one log entry is shown: a mini card for plays, an icon otherwise.
export type LogView = {
  text: string
  icon: string
  card: NumberCard | null
  player: number | null
  tone: "plain" | "penalty" | "win"
}

export function logView(state: GameState, entry: LogEntry): LogView | null {
  const name = (id: number) => state.players[id].name
  const view = (
    text: string,
    icon: string,
    player: number | null,
    tone: LogView["tone"] = "plain",
  ): LogView => ({ text, icon, card: null, player, tone })

  switch (entry.type) {
    case "play":
      return {
        ...view(
          m.log_play({ name: name(entry.player), oven: entry.oven + 1 }),
          "",
          entry.player,
        ),
        card: entry.card,
      }
    case "burn":
      return view(
        m.log_burn({ name: name(entry.player), oven: entry.oven + 1 }),
        "🔥",
        entry.player,
        "penalty",
      )
    case "cook": {
      const player = name(entry.player)
      const oven = (entry.oven ?? 0) + 1
      const icon = COOK_EMOJI[entry.cook]
      switch (entry.cook) {
        case "clean":
          return view(m.log_clean({ name: player, oven }), icon, entry.player)
        case "lock":
          return view(m.log_lock({ name: player, oven }), icon, entry.player)
        case "spy":
          return view(
            m.log_spy({ name: player, opponent: name(entry.opponent ?? 0) }),
            icon,
            entry.player,
          )
        case "chef":
          return view(
            m.log_chef({
              name: player,
              oven,
              colour: entry.pastry
                ? `${PASTRY_EMOJI[entry.pastry]} ${pastryName(entry.pastry)}`
                : "",
            }),
            icon,
            entry.player,
          )
        case "carousel":
          return view(m.log_carousel({ name: player }), icon, entry.player)
      }
      break
    }
    case "carouselDone":
      return view(m.log_carouselDone(), COOK_EMOJI.carousel, null)
    case "draw":
      // Burn penalties are already announced by the burn entry.
      if (entry.reason === "burn") return null
      if (entry.reason === "recipe") {
        return view(
          m.log_draw_recipe({ name: name(entry.player) }),
          "👨‍🍳",
          entry.player,
          "penalty",
        )
      }
      if (entry.reason === "scorch") {
        return view(
          m.log_draw_scorch({ name: name(entry.player) }),
          "🔥",
          entry.player,
          "penalty",
        )
      }
      return view(
        m.log_draw_shortfall({ name: name(entry.player), count: entry.count }),
        "🃏",
        entry.player,
      )
    case "pass":
      return view(m.log_pass({ name: name(entry.player) }), "⏭️", entry.player)
    case "win":
      return view(
        m.log_win({ name: name(entry.player) }),
        "🏆",
        entry.player,
        "win",
      )
  }
  return null
}

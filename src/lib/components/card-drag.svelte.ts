import type { VisibleCard } from "$lib/game/types"

// Shorter moves stay a tap that selects the card.
const DRAG_THRESHOLD = 8
// On touch a card moves only after a short hold, so a swipe still scrolls.
const TOUCH_HOLD_MS = 200
const SCROLL_EDGE = 72
const MAX_SCROLL_STEP = 18

function ovenAt(x: number, y: number): number | null {
  const oven = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-oven]")
  return oven ? Number(oven.dataset.oven) : null
}

function edgeScrollStep(y: number) {
  const bottom = window.innerHeight - y
  if (y < SCROLL_EDGE) return -MAX_SCROLL_STEP * (1 - y / SCROLL_EDGE)
  if (bottom < SCROLL_EDGE) return MAX_SCROLL_STEP * (1 - bottom / SCROLL_EDGE)
  return 0
}

// A drag that ends on its own card still fires a click.
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
  window.addEventListener("click", swallow, { capture: true, once: true })
  setTimeout(() => window.removeEventListener("click", swallow, true))
}

type CardDragOptions = {
  onstart: (card: VisibleCard) => boolean
  // `oven` is null when dropped outside the ovens or cancelled.
  ondrop: (card: VisibleCard, oven: number | null) => void
}

// Pointer events rather than HTML drag and drop, which ignores touch.
export class CardDrag {
  card = $state<VisibleCard | null>(null)
  x = $state(0)
  y = $state(0)
  oven = $state<number | null>(null)

  private options: CardDragOptions
  private abort: (() => void) | null = null

  constructor(options: CardDragOptions) {
    this.options = options
  }

  cancel() {
    this.abort?.()
  }

  press(event: PointerEvent, card: VisibleCard) {
    if (!event.isPrimary || event.button !== 0 || this.abort) return
    const { pointerId, clientX: startX, clientY: startY } = event
    // Not the wrapper: its box misses the lift of a selected card.
    const grabbed =
      (event.target as Element).closest(".game-card") ??
      (event.currentTarget as Element)
    const rect = grabbed.getBoundingClientRect()
    const offsetX = startX - rect.left
    const offsetY = startY - rect.top
    const touch = event.pointerType === "touch"
    let pointerX = startX
    let pointerY = startY
    let held = !touch
    let frame = 0

    const update = () => {
      this.x = pointerX - offsetX
      this.y = pointerY - offsetY
      this.oven = ovenAt(pointerX, pointerY)
    }
    const tick = () => {
      const step = edgeScrollStep(pointerY)
      if (step) window.scrollBy(0, step)
      update()
      frame = requestAnimationFrame(tick)
    }
    const begin = () => {
      if (!this.options.onstart(card)) {
        finish()
        return
      }
      update()
      this.card = card
      frame = requestAnimationFrame(tick)
    }
    const holdTimer = touch
      ? setTimeout(() => {
          held = true
          begin()
        }, TOUCH_HOLD_MS)
      : undefined

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerX = e.clientX
      pointerY = e.clientY
      if (this.card) return
      if (Math.hypot(pointerX - startX, pointerY - startY) < DRAG_THRESHOLD) {
        return
      }
      // A finger that moves before the hold is scrolling.
      if (held) begin()
      else finish()
    }
    const blockScroll = (e: TouchEvent) => {
      if (this.card && e.cancelable) e.preventDefault()
    }
    const blockMenu = (e: Event) => e.preventDefault()
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      const dragging = this.card !== null
      finish()
      if (!dragging) return
      swallowNextClick()
      this.options.ondrop(card, ovenAt(e.clientX, e.clientY))
    }
    const abort = () => {
      const dragging = this.card !== null
      finish()
      if (dragging) this.options.ondrop(card, null)
    }
    const pointerCancel = (e: PointerEvent) => {
      if (e.pointerId === pointerId) abort()
    }
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") abort()
    }
    const finish = () => {
      clearTimeout(holdTimer)
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", pointerCancel)
      window.removeEventListener("touchmove", blockScroll)
      window.removeEventListener("contextmenu", blockMenu)
      window.removeEventListener("keydown", keydown)
      window.removeEventListener("blur", abort)
      this.card = null
      this.oven = null
      this.abort = null
    }

    this.abort = abort
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", pointerCancel)
    window.addEventListener("touchmove", blockScroll, { passive: false })
    if (touch) window.addEventListener("contextmenu", blockMenu)
    window.addEventListener("keydown", keydown)
    window.addEventListener("blur", abort)
  }
}

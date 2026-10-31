import { cubicOut } from "svelte/easing"
import type { TransitionConfig } from "svelte/transition"

export type LaunchPoint = { left: number; top: number; width: number }

// Our own cards' take-off points, until an oven shows them.
const launches = new Map<string, LaunchPoint>()

export function recordLaunch(cardId: string, element: Element | null) {
  if (!element) return
  const { left, top, width } = element.getBoundingClientRect()
  launches.set(cardId, { left, top, width })
}

export function takeLaunch(cardId: string): LaunchPoint | null {
  const launch = launches.get(cardId) ?? null
  launches.delete(cardId)
  return launch
}

export function flyIn(
  node: HTMLElement,
  { from }: { from: () => LaunchPoint | null },
): TransitionConfig {
  const start = from()
  const end = node.getBoundingClientRect()
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!start || !end.width || reduced) return { duration: 0 }
  const dx = start.left - end.left
  const dy = start.top - end.top
  const scale = start.width / end.width
  return {
    duration: Math.min(500, 220 + Math.hypot(dx, dy) * 0.4),
    easing: cubicOut,
    css: (_t, u) =>
      `z-index: 20; transform-origin: top left; transform: translate(${dx * u}px, ${dy * u}px) scale(${1 + (scale - 1) * u});`,
  }
}

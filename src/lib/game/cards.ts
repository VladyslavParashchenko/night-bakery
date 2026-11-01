import {
  CHEF_COPIES,
  COLOURED_COOKS,
  MAX_VALUE,
  MIN_VALUE,
  PASTRIES,
  type Card,
  type VisibleCard,
} from "./types"

// mulberry32: small deterministic PRNG so the whole game state stays
// serialisable and reproducible from a seed.
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const nextSeed = (seed + 0x6d2b79f5) | 0
  let t = nextSeed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, nextSeed]
}

export function shuffle<T>(items: T[], seed: number): [T[], number] {
  const result = [...items]
  let rng = seed
  for (let i = result.length - 1; i > 0; i--) {
    const [random, next] = nextRandom(rng)
    rng = next
    const j = Math.floor(random * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return [result, rng]
}

export function isVisible(card: Card): card is VisibleCard {
  return card.type !== "hidden"
}

// Pastries by value, then suit; cooks after them, chefs last.
export function sortHand(hand: VisibleCard[]) {
  const rank = (card: VisibleCard) =>
    (card.pastry ? PASTRIES.indexOf(card.pastry) : 10) +
    (card.type === "cook" ? 1000 : card.value * 10)
  return [...hand].sort((a, b) => rank(a) - rank(b))
}

export function createDeck(): Card[] {
  const cards: Card[] = []
  for (const pastry of PASTRIES) {
    for (let value = MIN_VALUE; value <= MAX_VALUE; value++) {
      cards.push({ id: `${pastry}-${value}`, type: "number", pastry, value })
    }
  }
  for (const cook of COLOURED_COOKS) {
    for (const pastry of PASTRIES) {
      cards.push({ id: `cook-${cook}-${pastry}`, type: "cook", cook, pastry })
    }
  }
  for (let copy = 0; copy < CHEF_COPIES; copy++) {
    cards.push({
      id: `cook-chef-${copy}`,
      type: "cook",
      cook: "chef",
      pastry: null,
    })
  }
  return cards
}

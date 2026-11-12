<script lang="ts">
  import { PASTRIES, type VisibleCard } from "$lib/game/types"
  import {
    PASTRY_EMOJI,
    cookHint,
    cookName,
    pastryName,
  } from "$lib/i18n/game-labels"

  let {
    card,
    selected = false,
    disabled = false,
    dimmed = false,
    size = "md",
    onclick,
  }: {
    card: VisibleCard
    selected?: boolean
    disabled?: boolean
    dimmed?: boolean
    size?: "sm" | "md"
    onclick?: () => void
  } = $props()

  const title = $derived(
    card.type === "number"
      ? `${pastryName(card.pastry)} ${card.value}`
      : card.pastry
        ? `${cookName(card.cook)} (${pastryName(card.pastry)}) — ${cookHint(card.cook)}`
        : `${cookName(card.cook)} — ${cookHint(card.cook)}`,
  )
  const artwork = $derived(card.type === "number" ? card.pastry : card.cook)
</script>

<svelte:element
  this={onclick ? "button" : "div"}
  type={onclick ? "button" : undefined}
  class={`game-card ${card.pastry ?? "wild"} ${size}`}
  class:cook={card.type === "cook"}
  class:interactive={onclick && !disabled}
  class:selected
  class:dimmed
  disabled={onclick ? disabled : undefined}
  {title}
  role={onclick ? undefined : "img"}
  aria-label={title}
  aria-pressed={onclick ? selected : undefined}
  {onclick}
>
  {#if card.type === "number"}
    <span class="corner">{card.value}</span>
    <img
      class="artwork"
      src={`/cards/${artwork}.webp`}
      alt=""
      draggable="false"
    />
    <span class="value">{card.value}</span>
  {:else}
    {#if card.pastry}
      <span class="corner">{PASTRY_EMOJI[card.pastry]}</span>
    {/if}
    <img
      class="artwork"
      src={`/cards/${artwork}.webp`}
      alt=""
      draggable="false"
    />
    <span class="cook-name">{cookName(card.cook)}</span>
    {#if !card.pastry}
      <span class="suits" aria-hidden="true">
        {#each PASTRIES as pastry (pastry)}
          <span class={`dot ${pastry}`}></span>
        {/each}
      </span>
    {/if}
  {/if}
</svelte:element>

<style>
  .game-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 6.25rem;
    height: 9rem;
    padding: 0.5rem;
    color: var(--color-ink);
    border: 0;
    border-radius: 0.875rem;
    box-shadow: 0 0.375rem 0.875rem rgb(58 31 15 / 0.2);
    user-select: none;
    -webkit-touch-callout: none;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
  }
  .game-card.sm {
    width: 4.75rem;
    height: 6.75rem;
    border-radius: 0.6875rem;
  }
  .game-card.interactive {
    cursor: pointer;
  }
  .game-card.interactive:hover {
    transform: translateY(-0.375rem);
  }
  .game-card.selected {
    transform: translateY(-1rem);
    box-shadow:
      0 0 0 0.1875rem var(--color-oven-accent),
      0 0.75rem 1.375rem rgb(58 31 15 / 0.3);
  }
  /* Faded by a veil in the colour around it (--card-veil, the panel colour
     by default) rather than by opacity, so a dimmed card in an overlapping
     hand does not show the cards beneath it. */
  .game-card.dimmed::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: color-mix(
      in srgb,
      var(--card-veil, var(--color-oven-surface)) 55%,
      transparent
    );
    pointer-events: none;
  }
  .croissant {
    background: var(--color-suit-croissant);
  }
  .bagel {
    background: var(--color-suit-bagel);
  }
  .pretzel {
    background: var(--color-suit-pretzel);
    color: var(--color-ink-light);
  }
  .donut {
    background: var(--color-suit-donut);
  }
  /* A chef in hand has no colour yet: dark card with the four suit dots. */
  .wild {
    color: var(--color-ink-light);
    background: var(--color-ink);
  }
  /* A little printed-paper texture and a warm spotlight behind the artwork. */
  .game-card {
    background-image:
      radial-gradient(
        ellipse at 50% 38%,
        rgb(255 244 205 / 32%),
        transparent 55%
      ),
      linear-gradient(
        145deg,
        rgb(255 255 255 / 14%),
        transparent 45%,
        rgb(58 31 15 / 16%)
      ),
      repeating-linear-gradient(
        45deg,
        transparent 0 0.55rem,
        rgb(58 31 15 / 4%) 0.55rem 0.6rem
      );
  }
  .game-card.wild {
    background-image:
      radial-gradient(
        ellipse at 50% 38%,
        rgb(255 184 76 / 25%),
        transparent 58%
      ),
      linear-gradient(
        145deg,
        rgb(255 235 193 / 10%),
        transparent 55%,
        rgb(0 0 0 / 22%)
      );
  }
  .suits {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.375rem;
  }
  .dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 62.4375rem;
  }
  .sm .dot {
    width: 0.4375rem;
    height: 0.4375rem;
  }
  .dot.croissant {
    background: var(--color-suit-croissant);
  }
  .dot.bagel {
    background: var(--color-suit-bagel);
  }
  .dot.pretzel {
    background: var(--color-suit-pretzel);
  }
  .dot.donut {
    background: var(--color-suit-donut);
  }
  .corner {
    position: absolute;
    top: 0.375rem;
    left: 0.5625rem;
    font-size: 1rem;
    font-weight: 800;
  }
  .artwork {
    width: 115%;
    height: 4.2rem;
    object-fit: contain;
    pointer-events: none;
  }
  .sm .artwork {
    height: 3rem;
  }
  .value {
    margin-top: 0.375rem;
    font-size: 2.1rem;
    font-weight: 800;
    line-height: 1;
  }
  .sm .value {
    font-size: 1.5rem;
  }
  .sm .corner {
    display: none;
  }
  .cook-name {
    margin-top: 0.5rem;
    max-width: 100%;
    font-size: 0.72rem;
    font-weight: 800;
    text-align: center;
    text-transform: uppercase;
  }
  .sm .cook-name {
    font-size: 0.62rem;
  }
  @media (max-width: 600px) {
    .game-card {
      width: 4.375rem;
      height: 6.375rem;
      padding: 0.375rem;
    }
    .game-card.sm {
      width: 3.75rem;
      height: 5.375rem;
    }
    .artwork {
      height: 3rem;
    }
    .sm .artwork {
      height: 2.4rem;
    }
    .value {
      font-size: 1.55rem;
    }
    .sm .value {
      font-size: 1.25rem;
    }
    .cook-name {
      font-size: 0.6rem;
    }
    .corner {
      top: 0.25rem;
      left: 0.375rem;
      font-size: 0.8rem;
    }
    .sm .cook-name {
      font-size: 0.52rem;
    }
  }
</style>

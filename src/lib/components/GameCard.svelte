<script lang="ts">
  import { PASTRIES, type VisibleCard } from "$lib/game/types"
  import {
    COOK_EMOJI,
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
    <span class="emoji">{PASTRY_EMOJI[card.pastry]}</span>
    <span class="value">{card.value}</span>
  {:else}
    {#if card.pastry}
      <span class="corner">{PASTRY_EMOJI[card.pastry]}</span>
    {/if}
    <span class="emoji">{COOK_EMOJI[card.cook]}</span>
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
    border: 0.125rem solid rgb(58 31 15 / 0.15);
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
    border-color: var(--color-ink);
    box-shadow:
      0 0 0 0.1875rem var(--color-oven-accent),
      0 0.75rem 1.375rem rgb(58 31 15 / 0.3);
  }
  .game-card.dimmed {
    opacity: 0.45;
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
  .cook {
    border: 0.25rem solid var(--color-ink);
  }
  /* A chef in hand has no colour yet: dark card with the four suit dots. */
  .wild {
    color: var(--color-ink-light);
    background: var(--color-ink);
    border-color: var(--color-oven-accent);
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
  .emoji {
    font-size: 2.8rem;
    line-height: 1;
  }
  .sm .emoji {
    font-size: 2rem;
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
    .emoji {
      font-size: 2rem;
    }
    .sm .emoji {
      font-size: 1.6rem;
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

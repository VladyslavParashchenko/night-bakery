<script lang="ts">
  import { PASTRIES, type Card } from "$lib/game/types"
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
    card: Card
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
    width: 100px;
    height: 144px;
    padding: 8px;
    color: var(--color-ink);
    border: 2px solid rgb(58 31 15 / 0.15);
    border-radius: 14px;
    box-shadow: 0 6px 14px rgb(58 31 15 / 0.2);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
  }
  .game-card.sm {
    width: 76px;
    height: 108px;
    border-radius: 11px;
  }
  .game-card.interactive {
    cursor: pointer;
  }
  .game-card.interactive:hover {
    transform: translateY(-6px);
  }
  .game-card.selected {
    transform: translateY(-16px);
    border-color: var(--color-ink);
    box-shadow:
      0 0 0 3px var(--color-oven-accent),
      0 12px 22px rgb(58 31 15 / 0.3);
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
    border: 4px solid var(--color-ink);
  }
  /* A chef in hand has no colour yet: dark card with the four suit dots. */
  .wild {
    color: var(--color-ink-light);
    background: var(--color-ink);
    border-color: var(--color-oven-accent);
  }
  .suits {
    display: flex;
    gap: 4px;
    margin-top: 6px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }
  .sm .dot {
    width: 7px;
    height: 7px;
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
    top: 6px;
    left: 9px;
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
    margin-top: 6px;
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
    margin-top: 8px;
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
      width: 70px;
      height: 102px;
      padding: 6px;
    }
    .game-card.sm {
      width: 60px;
      height: 86px;
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
      top: 4px;
      left: 6px;
      font-size: 0.8rem;
    }
    .sm .cook-name {
      font-size: 0.52rem;
    }
  }
</style>

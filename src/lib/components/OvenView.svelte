<script lang="ts">
  import { Lock } from "lucide-svelte"
  import GameCard from "$lib/components/GameCard.svelte"
  import { flyIn, type LaunchPoint } from "$lib/components/card-flight"
  import { OVEN_CAPACITY, type Oven } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    oven,
    index,
    lockedByName,
    target = false,
    over = false,
    clickable = false,
    launch,
    onclick,
  }: {
    oven: Oven
    index: number
    lockedByName: string | null
    target?: boolean
    // A dragged card is over this oven.
    over?: boolean
    // Clickable even when not a legal target, so the UI can explain why.
    clickable?: boolean
    launch?: (cardId: string) => LaunchPoint | null
    onclick?: () => void
  } = $props()
</script>

<button
  type="button"
  class="oven"
  class:target
  class:over
  data-oven={index}
  disabled={!clickable}
  aria-label={m.ovenLabel({ number: index + 1 })}
  {onclick}
>
  <header>
    <span class="title">{m.ovenLabel({ number: index + 1 })}</span>
    {#if lockedByName}
      <span class="lock"
        ><Lock size={16} />{m.ovenLocked({ name: lockedByName })}</span
      >
    {/if}
  </header>

  <div class="stack">
    {#each oven.cards as card (card.id)}
      <div class="stacked" in:flyIn={{ from: () => launch?.(card.id) ?? null }}>
        <GameCard {card} size="sm" disabled />
      </div>
    {:else}
      <span class="empty">{m.ovenEmpty()}</span>
    {/each}
  </div>

  <div class="slots" aria-hidden="true">
    {#each [...Array(OVEN_CAPACITY).keys()] as i (i)}
      <span
        class="slot"
        class:filled={i < oven.cards.length}
        class:danger={i === OVEN_CAPACITY - 1}
      ></span>
    {/each}
  </div>
</button>

<style>
  .oven {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    width: 100%;
    min-width: 0;
    padding: 1rem;
    color: inherit;
    text-align: left;
    background: var(--color-oven-surface);
    border: 0.125rem solid var(--color-oven-border);
    border-radius: 1.125rem;
    transition:
      border-color 0.15s ease,
      transform 0.15s ease;
  }
  .oven:disabled {
    cursor: default;
  }
  .oven.target {
    cursor: pointer;
    border-color: var(--color-oven-accent);
    box-shadow: 0 0 0 0.25rem rgb(255 216 3 / 0.45);
  }
  .oven.target:hover {
    transform: translateY(-0.125rem);
  }
  .oven.over {
    border-color: var(--color-oven-fire);
  }
  .oven.target.over {
    border-color: var(--color-oven-accent);
    box-shadow: 0 0 0 0.5rem rgb(255 216 3 / 0.6);
    transform: scale(1.02);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
  }
  .title {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .lock {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-ink);
    background: var(--color-oven-accent);
    border-radius: 62.4375rem;
  }
  .stack {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 7.25rem;
  }
  .stacked {
    position: relative;
  }
  .stacked:not(:first-child) {
    margin-left: -2.75rem;
  }
  .empty {
    width: 100%;
    color: var(--color-oven-muted);
    font-size: 1rem;
    text-align: center;
  }
  @media (max-width: 600px) {
    .oven {
      gap: 0.625rem;
      padding: 0.625rem;
      border-radius: 0.875rem;
    }
    .title {
      font-size: 0.95rem;
    }
    .lock {
      padding: 0.125rem 0.375rem;
      font-size: 0.7rem;
    }
    .stack {
      min-height: 5.5rem;
    }
    .stacked:not(:first-child) {
      margin-left: -3.25rem;
    }
    .slots {
      gap: 0.1875rem;
    }
  }
  .slots {
    display: flex;
    gap: 0.375rem;
  }
  .slot {
    flex: 1;
    height: 0.5rem;
    background: var(--color-oven-border);
    border-radius: 62.4375rem;
  }
  .slot.filled {
    background: var(--color-oven-fire);
  }
  .slot.danger {
    outline: 1px dashed rgb(242 95 76 / 0.7);
  }
  .slot.filled.danger {
    background: var(--color-oven-fire);
  }
</style>

<script lang="ts">
  import { Lock } from "lucide-svelte"
  import GameCard from "$lib/components/GameCard.svelte"
  import { OVEN_CAPACITY, type Oven } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    oven,
    index,
    lockedByName,
    target = false,
    clickable = false,
    onclick,
  }: {
    oven: Oven
    index: number
    lockedByName: string | null
    target?: boolean
    // Clickable even when not a legal target, so the UI can explain why.
    clickable?: boolean
    onclick?: () => void
  } = $props()
</script>

<button
  type="button"
  class="oven"
  class:target
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
    {#if oven.cards.length === 0}
      <span class="empty">{m.ovenEmpty()}</span>
    {:else}
      {#each oven.cards as card (card.id)}
        <div class="stacked">
          <GameCard {card} size="sm" disabled />
        </div>
      {/each}
    {/if}
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
    gap: 14px;
    width: 100%;
    min-width: 0;
    padding: 16px;
    color: inherit;
    text-align: left;
    background: var(--color-oven-surface);
    border: 2px solid var(--color-oven-border);
    border-radius: 18px;
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
    box-shadow: 0 0 0 4px rgb(255 216 3 / 0.45);
  }
  .oven.target:hover {
    transform: translateY(-2px);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .title {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .lock {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-ink);
    background: var(--color-oven-accent);
    border-radius: 999px;
  }
  .stack {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 116px;
  }
  .stacked:not(:first-child) {
    margin-left: -44px;
  }
  .empty {
    width: 100%;
    color: var(--color-oven-muted);
    font-size: 1rem;
    text-align: center;
  }
  @media (max-width: 600px) {
    .oven {
      gap: 10px;
      padding: 10px;
      border-radius: 14px;
    }
    .title {
      font-size: 0.95rem;
    }
    .lock {
      padding: 2px 6px;
      font-size: 0.7rem;
    }
    .stack {
      min-height: 88px;
    }
    .stacked:not(:first-child) {
      margin-left: -52px;
    }
    .slots {
      gap: 3px;
    }
  }
  .slots {
    display: flex;
    gap: 6px;
  }
  .slot {
    flex: 1;
    height: 8px;
    background: var(--color-oven-border);
    border-radius: 999px;
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

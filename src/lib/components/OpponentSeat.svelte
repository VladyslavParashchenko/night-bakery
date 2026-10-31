<script lang="ts">
  import type { Player } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let { player, active = false }: { player: Player; active?: boolean } =
    $props()

  const visibleBacks = $derived(Math.min(player.hand.length, 8))
</script>

<div class="seat" class:active>
  <div class="head">
    <span class="name">{player.name}</span>
  </div>
  <div
    class="backs"
    data-seat={player.id}
    aria-label={m.cardsCount({ count: player.hand.length })}
  >
    {#each [...Array(visibleBacks).keys()] as i (i)}
      <span class="back"></span>
    {/each}
    <span class="count">{player.hand.length}</span>
  </div>
</div>

<style>
  .seat {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    min-width: 0;
    padding: 0.875rem 1rem;
    background: var(--color-oven-surface);
    border: 0.125rem solid var(--color-oven-border);
    border-radius: 1rem;
    transition: border-color 0.15s ease;
  }
  .seat.active {
    border-color: var(--color-oven-accent);
    box-shadow: 0 0 0 0.1875rem rgb(255 216 3 / 0.35);
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 1rem;
  }
  .name {
    overflow: hidden;
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .backs {
    display: flex;
    align-items: center;
  }
  .back {
    width: 1.875rem;
    height: 2.75rem;
    background: var(--color-ink);
    border: 0.0938rem solid var(--color-oven-accent);
    border-radius: 0.3125rem;
  }
  .back:not(:first-child) {
    margin-left: -1.125rem;
  }
  @media (max-width: 600px) {
    .head {
      flex-direction: column;
      gap: 0.125rem;
      font-size: 0.9rem;
    }
  }
  .count {
    margin-left: 0.75rem;
    font-size: 1.25rem;
    font-weight: 800;
  }
</style>

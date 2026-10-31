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
  <div class="backs" aria-label={m.cardsCount({ count: player.hand.length })}>
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
    gap: 10px;
    min-width: 0;
    padding: 14px 16px;
    background: var(--color-oven-surface);
    border: 2px solid var(--color-oven-border);
    border-radius: 16px;
    transition: border-color 0.15s ease;
  }
  .seat.active {
    border-color: var(--color-oven-accent);
    box-shadow: 0 0 0 3px rgb(255 216 3 / 0.35);
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
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
    width: 30px;
    height: 44px;
    background: var(--color-ink);
    border: 1.5px solid var(--color-oven-accent);
    border-radius: 5px;
  }
  .back:not(:first-child) {
    margin-left: -18px;
  }
  @media (max-width: 600px) {
    .head {
      flex-direction: column;
      gap: 2px;
      font-size: 0.9rem;
    }
  }
  .count {
    margin-left: 12px;
    font-size: 1.25rem;
    font-weight: 800;
  }
</style>

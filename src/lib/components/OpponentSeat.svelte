<script lang="ts">
  import type { Player } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let { player, active = false }: { player: Player; active?: boolean } =
    $props()

  const visibleBacks = $derived(Math.min(player.hand.length, 8))
</script>

<div class="seat" class:active>
  <div class="inner">
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
</div>

<style>
  /* One short row: the name, then the backs and the count. A seat too
     narrow for that (phones, or four seats on a tablet) puts the name above
     the backs instead, so it does not shrink to an ellipsis. */
  .seat {
    min-width: 0;
    padding: 0.5rem 0.875rem;
    container-type: inline-size;
    background: var(--color-oven-surface);
    border: 0.125rem solid var(--color-oven-border);
    border-radius: 1rem;
    transition: border-color 0.15s ease;
  }
  .seat.active {
    border-color: var(--color-oven-accent);
    box-shadow: 0 0 0 0.1875rem rgb(255 216 3 / 0.35);
  }
  .inner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .head {
    flex: 1;
    min-width: 0;
    font-size: 1rem;
  }
  .name {
    display: block;
    overflow: hidden;
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .backs {
    display: flex;
    flex-shrink: 0;
    align-items: center;
  }
  .back {
    position: relative;
    flex-shrink: 0;
    width: 1.5rem;
    height: 2.125rem;
    background:
      radial-gradient(
        ellipse at 50% 35%,
        rgb(255 179 71 / 27%),
        transparent 65%
      ),
      repeating-linear-gradient(
        45deg,
        transparent 0 0.3rem,
        rgb(255 216 150 / 8%) 0.3rem 0.35rem
      ),
      linear-gradient(145deg, #68402a, #26140e);
    border: 1px solid #c88d4b;
    border-radius: 0.3rem;
    box-shadow: 0 0.125rem 0.25rem rgb(0 0 0 / 30%);
  }
  .back::after {
    content: "";
    position: absolute;
    inset: 32% 25%;
    background: radial-gradient(circle, #ffd18a 0 18%, transparent 23%);
    border: 1px solid rgb(255 210 138 / 70%);
    border-radius: 50% 50% 45% 45%;
  }
  .back:not(:first-child) {
    margin-left: -1rem;
  }
  .count {
    margin-left: 0.5rem;
    font-size: 1.2rem;
    font-weight: 800;
  }
  @container (max-width: 14rem) {
    .inner {
      flex-direction: column;
      align-items: stretch;
      gap: 0.25rem;
    }
  }
  /* Phones: smaller seats with a few backs, so four fit in a row. */
  @media (max-width: 600px) {
    .seat {
      padding: 0.375rem 0.5rem;
      border-radius: 0.75rem;
    }
    .head {
      font-size: 0.85rem;
    }
    .back {
      width: 1.125rem;
      height: 1.625rem;
    }
    .back:not(:first-child) {
      margin-left: -0.8125rem;
    }
    .back:nth-child(n + 5) {
      display: none;
    }
    .count {
      margin-left: 0.375rem;
      font-size: 1rem;
    }
  }
</style>

<script lang="ts">
  import type { GameState } from "$lib/game/types"
  import { logView, type LogView } from "$lib/i18n/game-labels"
  import { m } from "$lib/i18n/messages"
  import { game } from "$lib/stores/game.svelte"

  const VISIBLE_ENTRIES = 30

  let { state }: { state: GameState } = $props()

  // Keyed by position in the full log so rows stay stable.
  const rows = $derived(
    state.log
      .map((entry, index) => ({ index, view: logView(state, entry) }))
      .filter(
        (row): row is { index: number; view: LogView } => row.view !== null,
      )
      .reverse()
      .slice(0, VISIBLE_ENTRIES),
  )
</script>

<section class="log">
  <h2>{m.logTitle()}</h2>
  {#if rows.length === 0}
    <p class="empty">{m.logEmpty()}</p>
  {:else}
    <ol>
      {#each rows as { index, view }, i (index)}
        <li
          class={`tone-${view.tone}`}
          class:latest={i === 0}
          class:mine={view.player === game.me}
        >
          {#if view.card}
            <span class={`chip ${view.card.pastry}`} aria-hidden="true">
              {view.card.value}
            </span>
          {:else}
            <span class="chip icon" aria-hidden="true">{view.icon}</span>
          {/if}
          <span class="text">{view.text}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .log {
    padding: 1rem 1.125rem;
    background: var(--color-oven-surface);
    border: 1px solid var(--color-oven-border);
    border-radius: 1rem;
  }
  h2 {
    margin: 0 0 0.625rem;
    font-size: 0.9rem;
    color: var(--color-oven-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .empty {
    margin: 0;
    color: var(--color-oven-muted);
  }
  ol {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 20rem;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.375rem 0.625rem;
    color: var(--color-oven-muted);
    border-left: 0.1875rem solid transparent;
    border-radius: 0.625rem;
  }
  li.mine {
    border-left-color: var(--color-oven-accent);
  }
  li.latest {
    color: var(--color-oven-text);
    font-weight: 700;
    background: var(--color-oven-surface-raised);
  }
  li.tone-penalty .text {
    color: var(--color-oven-fire);
  }
  li.tone-win {
    color: var(--color-oven-text);
    font-weight: 800;
  }
  .chip {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 1.75rem;
    height: 2.25rem;
    color: var(--color-ink);
    font-size: 0.85rem;
    font-weight: 800;
    border-radius: 0.375rem;
  }
  .chip.icon {
    font-size: 1.1rem;
    background: var(--color-oven-surface-raised);
  }
  .chip.croissant {
    background: var(--color-suit-croissant);
  }
  .chip.bagel {
    background: var(--color-suit-bagel);
  }
  .chip.pretzel {
    color: var(--color-ink-light);
    background: var(--color-suit-pretzel);
  }
  .chip.donut {
    background: var(--color-suit-donut);
  }
  .text {
    min-width: 0;
  }
</style>

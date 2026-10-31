<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import type { GameState } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    open,
    gameState,
    playerId,
    onconfirm,
    onclose,
  }: {
    open: boolean
    gameState: GameState
    playerId: number
    onconfirm: (opponent: number) => void
    onclose: () => void
  } = $props()

  const opponents = $derived(gameState.players.filter((p) => p.id !== playerId))
</script>

<Modal {open} {onclose}>
  <h2>🕵️ {m.spyTitle()}</h2>
  <p class="hint">{m.spyRandomHint()}</p>

  <p class="label">{m.spyChooseOpponent()}</p>
  <div class="opponents">
    {#each opponents as player (player.id)}
      <Button variant="secondary" onclick={() => onconfirm(player.id)}>
        {player.name} · {m.cardsCount({ count: player.hand.length })}
      </Button>
    {/each}
  </div>

  <div class="actions">
    <Button variant="secondary" onclick={onclose}>{m.cancel()}</Button>
  </div>
</Modal>

<style>
  h2 {
    margin: 0 0 12px;
  }
  .hint {
    margin: 0;
    color: var(--color-oven-muted);
  }
  .label {
    margin: 16px 0 8px;
    color: var(--color-oven-muted);
    font-weight: 700;
  }
  .opponents {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
</style>

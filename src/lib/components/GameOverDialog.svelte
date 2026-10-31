<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import type { Player } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    players,
    winnerId,
    onrematch,
    onmenu,
  }: {
    players: Player[]
    winnerId: number
    // Online guests have none: the host starts rematches.
    onrematch?: () => void
    onmenu: () => void
  } = $props()

  const winner = $derived(players[winnerId])
  const standings = $derived(
    [...players].sort((a, b) => a.hand.length - b.hand.length),
  )
</script>

<Modal open>
  <div class="result">
    <div class="trophy" aria-hidden="true">👑</div>
    <h2>{m.gameOverTitle({ name: winner.name })}</h2>
    <p class="muted">{m.cardsLeftTitle()}</p>
    <ol class="standings">
      {#each standings as player (player.id)}
        <li class:winner={player.id === winnerId}>
          <span>{player.name}</span>
          <strong>{player.hand.length}</strong>
        </li>
      {/each}
    </ol>
    {#if onrematch}
      <Button size="large" onclick={onrematch}>{m.playAgain()}</Button>
    {:else}
      <p class="muted">{m.waitingForHost()}</p>
    {/if}
    <Button size="large" variant="secondary" onclick={onmenu}>
      {m.backToMenu()}
    </Button>
  </div>
</Modal>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  .trophy {
    font-size: 3rem;
  }
  h2 {
    margin: 0;
  }
  .muted {
    margin: 0;
    color: var(--color-oven-muted);
  }
  .standings {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 8px 0;
    padding: 0;
    list-style: none;
  }
  .standings li {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--color-oven-bg);
    border-radius: 10px;
  }
  .standings li.winner {
    outline: 2px solid var(--color-oven-accent);
  }
</style>

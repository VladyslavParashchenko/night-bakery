<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { PASTRIES, type Pastry } from "$lib/game/types"
  import { PASTRY_EMOJI, pastryName } from "$lib/i18n/game-labels"
  import { m } from "$lib/i18n/messages"

  let {
    open,
    onconfirm,
    onclose,
  }: {
    open: boolean
    onconfirm: (pastry: Pastry) => void
    onclose: () => void
  } = $props()
</script>

<Modal {open} {onclose}>
  <h2>👨‍🍳 {m.chefTitle()}</h2>
  <p class="hint">{m.chefHint()}</p>

  <div class="colours">
    {#each PASTRIES as pastry (pastry)}
      <button
        type="button"
        class={`colour ${pastry}`}
        onclick={() => onconfirm(pastry)}
      >
        <span class="emoji" aria-hidden="true">{PASTRY_EMOJI[pastry]}</span>
        {pastryName(pastry)}
      </button>
    {/each}
  </div>

  <div class="actions">
    <Button variant="secondary" onclick={onclose}>{m.cancel()}</Button>
  </div>
</Modal>

<style>
  h2 {
    margin: 0 0 0.75rem;
  }
  .hint {
    margin: 0 0 1rem;
    color: var(--color-oven-muted);
  }
  .colours {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
  }
  .colour {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 4rem;
    color: var(--color-ink);
    font-weight: 800;
    border: 0.125rem solid rgb(58 31 15 / 0.15);
    border-radius: 0.875rem;
    cursor: pointer;
  }
  .colour:hover {
    border-color: var(--color-ink);
  }
  .colour:focus-visible {
    outline: 0.125rem solid var(--color-oven-text);
    outline-offset: 0.125rem;
  }
  .emoji {
    font-size: 1.6rem;
  }
  .croissant {
    background: var(--color-suit-croissant);
  }
  .bagel {
    background: var(--color-suit-bagel);
  }
  .pretzel {
    color: var(--color-ink-light);
    background: var(--color-suit-pretzel);
  }
  .donut {
    background: var(--color-suit-donut);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.25rem;
  }
</style>

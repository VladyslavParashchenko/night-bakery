<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { PASTRIES, type Pastry } from "$lib/game/types"
  import { pastryName } from "$lib/i18n/game-labels"
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
  <h2>
    <img class="chef-art" src="/cards/chef.webp" alt="" />
    {m.chefTitle()}
  </h2>
  <p class="hint">{m.chefHint()}</p>

  <div class="colours">
    {#each PASTRIES as pastry (pastry)}
      <button
        type="button"
        class={`colour ${pastry}`}
        onclick={() => onconfirm(pastry)}
      >
        <img class="pastry-art" src={`/cards/${pastry}.webp`} alt="" />
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
  }
  .chef-art {
    width: 2.25rem;
    height: 2.25rem;
    object-fit: contain;
    flex-shrink: 0;
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
  .pastry-art {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
    flex-shrink: 0;
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
  .colour {
    background-image:
      radial-gradient(
        ellipse at 50% 40%,
        rgb(255 244 205 / 32%),
        transparent 60%
      ),
      linear-gradient(
        145deg,
        rgb(255 255 255 / 14%),
        transparent 45%,
        rgb(58 31 15 / 16%)
      ),
      repeating-linear-gradient(
        45deg,
        transparent 0 0.55rem,
        rgb(58 31 15 / 4%) 0.55rem 0.6rem
      );
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.25rem;
  }
</style>

<script lang="ts">
  import { ChevronRight, SlidersHorizontal, X } from "lucide-svelte"
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import {
    DEFAULT_OPTIONS,
    MAX_OVEN_CAPACITY,
    MAX_OVENS,
    MIN_OVEN_CAPACITY,
    MIN_OVENS,
    type GameOptions,
  } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"
  import { saveTableOptions } from "$lib/stores/table-options"

  let {
    options = $bindable(),
    readonly = false,
  }: {
    options: GameOptions
    // A guest only sees the table the host picked.
    readonly?: boolean
  } = $props()

  let open = $state(false)

  const range = (min: number, max: number) =>
    Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const standard = $derived(
    options.ovens === DEFAULT_OPTIONS.ovens &&
      options.ovenCapacity === DEFAULT_OPTIONS.ovenCapacity,
  )

  function set(next: Partial<GameOptions>) {
    options = { ...options, ...next }
    saveTableOptions(options)
  }
</script>

<!-- A single row in the menu; the choices live in a dialog so the menu
     still fits short screens. -->
{#snippet face()}
  <SlidersHorizontal class="icon" size="1.25rem" />
  <span class="text">
    <span class="label">
      {readonly ? m.tableOptionsHost() : m.tableOptionsOpen()}
    </span>
    <span class="summary">
      {m.tableOptionsSummary({
        ovens: options.ovens,
        capacity: options.ovenCapacity,
      })}
    </span>
  </span>
{/snippet}

{#if readonly}
  <div class="open readonly" class:custom={!standard}>
    {@render face()}
  </div>
{:else}
  <button
    type="button"
    class="open"
    class:custom={!standard}
    onclick={() => (open = true)}
  >
    {@render face()}
    <ChevronRight class="chevron" size="1.25rem" />
  </button>
{/if}

<Modal {open} onclose={() => (open = false)}>
  {#snippet header()}
    <div class="head">
      <h2>{m.tableOptions()}</h2>
      <button
        type="button"
        class="close"
        aria-label={m.close()}
        onclick={() => (open = false)}
      >
        <X size="1.375rem" />
      </button>
    </div>
  {/snippet}

  <p class="hint">{m.tableOptionsHint()}</p>

  <!-- A live sketch of the table: one arch per oven, one ember per card
       it holds; the last ember is the one that burns it. -->
  <div class="preview" aria-hidden="true">
    {#each range(1, options.ovens) as oven (oven)}
      <div class="mini-oven">
        <div class="mouth"></div>
        <div class="embers">
          {#each range(1, options.ovenCapacity) as ember (ember)}
            <span class="ember" class:last={ember === options.ovenCapacity}
            ></span>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="field">
    <span>{m.tableOvens()}</span>
    <div class="choices" style:--count={MAX_OVENS - MIN_OVENS + 1}>
      {#each range(MIN_OVENS, MAX_OVENS) as count (count)}
        <Button
          class="option"
          variant={options.ovens === count ? "primary" : "secondary"}
          onclick={() => set({ ovens: count })}
        >
          {count}
        </Button>
      {/each}
    </div>
  </div>

  <div class="field">
    <span>{m.tableOvenCapacity()}</span>
    <div
      class="choices"
      style:--count={MAX_OVEN_CAPACITY - MIN_OVEN_CAPACITY + 1}
    >
      {#each range(MIN_OVEN_CAPACITY, MAX_OVEN_CAPACITY) as count (count)}
        <Button
          class="option"
          variant={options.ovenCapacity === count ? "primary" : "secondary"}
          onclick={() => set({ ovenCapacity: count })}
        >
          {count}
        </Button>
      {/each}
    </div>
  </div>

  <div class="actions">
    <Button
      variant="secondary"
      disabled={standard}
      onclick={() => set({ ...DEFAULT_OPTIONS })}
    >
      {m.tableOptionsReset()}
    </Button>
    <Button onclick={() => (open = false)}>{m.tableOptionsDone()}</Button>
  </div>
</Modal>

<style>
  .open {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 3.25rem;
    padding: 0.5rem 0.75rem 0.5rem 1rem;
    color: var(--color-oven-text);
    font: inherit;
    text-align: left;
    background: var(--color-oven-bg);
    border: 1px solid var(--color-oven-border);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }
  .readonly {
    cursor: default;
  }
  button.open:hover,
  button.open:focus-visible {
    border-color: var(--color-oven-accent);
  }
  .open :global(.icon) {
    flex-shrink: 0;
  }
  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .label {
    font-weight: 700;
  }
  .summary {
    overflow: hidden;
    color: var(--color-oven-muted);
    font-size: 0.85rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* A non-standard table stands out, so nobody starts one by accident. */
  .custom {
    border-color: var(--color-oven-accent);
  }
  .custom .summary {
    color: var(--color-oven-text);
    font-weight: 700;
  }
  .custom .summary::before {
    content: "";
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.375rem;
    vertical-align: 0.0625rem;
    background: var(--color-oven-accent);
    border-radius: 50%;
  }
  .open :global(.chevron) {
    flex-shrink: 0;
    color: var(--color-oven-muted);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    color: var(--color-oven-text);
  }
  .close {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-oven-muted);
    background: transparent;
    border: none;
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .close:hover {
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
  }
  .hint {
    margin: 0 0 1rem;
    color: var(--color-oven-muted);
  }
  .preview {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    background: var(--color-oven-bg);
    border: 1px solid var(--color-oven-border);
    border-radius: 1rem;
  }
  .mini-oven {
    flex: 0 1 4rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3125rem;
  }
  .mouth {
    height: 2.25rem;
    background:
      radial-gradient(
        120% 70% at 50% 110%,
        color-mix(in srgb, var(--color-ember) 55%, transparent),
        transparent 70%
      ),
      linear-gradient(var(--color-chamber-deep), var(--color-chamber));
    border: 0.1875rem solid var(--color-oven-border);
    border-radius: 50% 50% 0.375rem 0.375rem / 1.25rem 1.25rem 0.375rem 0.375rem;
  }
  .embers {
    display: flex;
    gap: 0.125rem;
  }
  .ember {
    flex: 1;
    height: 0.3125rem;
    background: linear-gradient(
      90deg,
      var(--color-ember),
      var(--color-oven-fire)
    );
    border-radius: 62.4375rem;
    opacity: 0.55;
  }
  .ember.last {
    background: var(--color-oven-fire);
    opacity: 1;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1.125rem;
    font-weight: 700;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    gap: 0.5rem;
  }
  /* Six numbers in a row must fit a phone. */
  .choices :global(.ui-button.option) {
    min-width: 0;
    padding: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }
</style>

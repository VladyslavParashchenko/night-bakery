<script lang="ts">
  import type { Snippet } from "svelte"
  let {
    open,
    hidden = false,
    wide = false,
    onclose,
    header,
    children,
  }: {
    open: boolean
    // Out of sight but still mounted, so its state and animations survive.
    hidden?: boolean
    wide?: boolean
    onclose?: () => void
    // With a header, only the body scrolls and the header stays in place.
    header?: Snippet
    children: Snippet
  } = $props()
  function close(event: MouseEvent) {
    if (event.target === event.currentTarget) onclose?.()
  }

  // Keep the page behind the dialog from scrolling while it is open.
  $effect(() => {
    if (!open || hidden) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  })
</script>

{#if open}<div
    class="ui-modal-backdrop"
    class:hidden
    role="presentation"
    onclick={close}
  >
    <section
      class="ui-modal"
      class:wide
      class:split={header !== undefined}
      role="dialog"
      aria-modal="true"
    >
      {#if header}
        <header class="ui-modal-header">{@render header()}</header>
        <div class="ui-modal-body">{@render children()}</div>
      {:else}
        {@render children()}
      {/if}
    </section>
  </div>{/if}

<style>
  .ui-modal-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    padding: 1rem;
    place-items: center;
    background: rgb(58 31 15 / 0.45);
  }
  /* Visibility, unlike display, does not restart CSS animations. */
  .ui-modal-backdrop.hidden {
    visibility: hidden;
  }
  .ui-modal {
    width: min(100%, 32.5rem);
    max-height: calc(100dvh - 2rem);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 1.5rem;
    color: var(--color-oven-text);
    background: var(--color-oven-surface);
    border: 1px solid var(--color-oven-border);
    border-radius: 1.5rem;
    box-shadow: 0 1.5rem 4rem rgb(58 31 15 / 0.25);
  }
  .ui-modal.wide {
    width: min(100%, 53.75rem);
  }
  .ui-modal.split {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
  }
  .ui-modal-header {
    flex-shrink: 0;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-oven-border);
  }
  .ui-modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.25rem 1.5rem 1.5rem;
  }
</style>

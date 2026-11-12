<script lang="ts">
  import { X } from "lucide-svelte"
  import type { Snippet } from "svelte"
  import { m } from "$lib/i18n/messages"

  let {
    open,
    hidden = false,
    wide = false,
    title,
    onclose,
    children,
  }: {
    open: boolean
    // Out of sight but still mounted, so its state and animations survive.
    hidden?: boolean
    wide?: boolean
    // With a title, a header with it and a close button stays in place and
    // only the body scrolls.
    title?: string
    onclose?: () => void
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
    <div
      class="ui-modal"
      class:wide
      class:split={title !== undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {#if title !== undefined}
        <header class="ui-modal-header">
          <h2>{title}</h2>
          {#if onclose}
            <button
              type="button"
              class="ui-modal-close"
              aria-label={m.close()}
              onclick={onclose}
            >
              <X size="1.375rem" />
            </button>
          {/if}
        </header>
        <div class="ui-modal-body">{@render children()}</div>
      {:else}
        {@render children()}
      {/if}
    </div>
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
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-oven-border);
  }
  .ui-modal-header h2 {
    margin: 0;
    color: var(--color-oven-text);
  }
  .ui-modal-close {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-oven-muted);
    background: transparent;
    border: none;
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .ui-modal-close:hover {
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
  }
  .ui-modal-close:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
  }
  .ui-modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.25rem 1.5rem 1.5rem;
  }
</style>

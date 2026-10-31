<script lang="ts">
  import type { Snippet } from "svelte"
  let {
    open,
    wide = false,
    onclose,
    header,
    children,
  }: {
    open: boolean
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
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  })
</script>

{#if open}<div class="ui-modal-backdrop" role="presentation" onclick={close}>
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
    padding: 16px;
    place-items: center;
    background: rgb(58 31 15 / 0.45);
  }
  .ui-modal {
    width: min(100%, 520px);
    max-height: calc(100dvh - 32px);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 24px;
    color: var(--color-oven-text);
    background: var(--color-oven-surface);
    border: 1px solid var(--color-oven-border);
    border-radius: 24px;
    box-shadow: 0 24px 64px rgb(58 31 15 / 0.25);
  }
  .ui-modal.wide {
    width: min(100%, 860px);
  }
  .ui-modal.split {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
  }
  .ui-modal-header {
    flex-shrink: 0;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-oven-border);
  }
  .ui-modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 20px 24px 24px;
  }
</style>

<script lang="ts">
  import { CircleAlert } from "lucide-svelte"
  import { fly } from "svelte/transition"

  let {
    message,
    key,
    duration = 2600,
    onexpire,
  }: {
    message: string | null
    // Changes on every new message, so a repeated message shows again.
    key: number
    duration?: number
    onexpire: () => void
  } = $props()

  $effect(() => {
    void key
    if (!message) return
    const timer = setTimeout(onexpire, duration)
    return () => clearTimeout(timer)
  })
</script>

<div class="toast-region" aria-live="polite">
  {#key key}
    {#if message}
      <div
        class="toast"
        role="status"
        transition:fly={{ y: 24, duration: 180 }}
      >
        <CircleAlert size="1.25rem" />
        <span>{message}</span>
      </div>
    {/if}
  {/key}
</div>

<style>
  .toast-region {
    position: fixed;
    z-index: 1100;
    right: 1rem;
    bottom: 1.5rem;
    left: 1rem;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    max-width: 30rem;
    padding: 0.75rem 1.125rem;
    color: var(--color-oven-bg);
    font-weight: 700;
    background: var(--color-oven-text);
    border-radius: 0.875rem;
    box-shadow: 0 0.75rem 2rem rgb(58 31 15 / 0.3);
  }
  .toast :global(svg) {
    flex-shrink: 0;
    color: var(--color-oven-fire);
  }
</style>

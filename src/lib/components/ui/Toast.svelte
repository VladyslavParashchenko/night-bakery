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
        <CircleAlert size={20} />
        <span>{message}</span>
      </div>
    {/if}
  {/key}
</div>

<style>
  .toast-region {
    position: fixed;
    z-index: 1100;
    right: 16px;
    bottom: 24px;
    left: 16px;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 480px;
    padding: 12px 18px;
    color: var(--color-oven-bg);
    font-weight: 700;
    background: var(--color-oven-text);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgb(58 31 15 / 0.3);
  }
  .toast :global(svg) {
    flex-shrink: 0;
    color: var(--color-oven-fire);
  }
</style>

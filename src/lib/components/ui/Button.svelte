<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    variant = "primary",
    size = "default",
    type = "button",
    disabled = false,
    class: className = "",
    onclick,
    children,
  }: {
    variant?: "primary" | "secondary" | "fire"
    size?: "default" | "large"
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    class?: string
    onclick?: (event: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

<button
  {type}
  {disabled}
  {onclick}
  class={`ui-button ${variant} ${size} ${className}`}
>
  {@render children()}
</button>

<style>
  .ui-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 3.25rem;
    padding: 0 1.375rem;
    border: 1px solid transparent;
    border-radius: 0.75rem;
    font: inherit;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      filter 0.16s ease,
      transform 0.16s ease;
  }
  .ui-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  .ui-button.primary {
    color: var(--color-ink);
    background: var(--color-oven-accent);
  }
  .ui-button.secondary {
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border-color: var(--color-oven-border);
  }
  .ui-button.fire {
    color: #fff;
    background: var(--color-oven-fire);
  }
  .ui-button.large {
    width: 100%;
    min-height: 3.75rem;
    border-radius: 1rem;
    font-size: 1.15rem;
  }
  @media (max-width: 600px) {
    .ui-button {
      padding: 0 0.75rem;
      white-space: nowrap;
    }
  }
  .ui-button:not(:disabled):hover {
    filter: brightness(1.08);
  }
  .ui-button:not(:disabled):active {
    transform: scale(0.98);
  }
  .ui-button:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
    outline-offset: 0.125rem;
  }
</style>

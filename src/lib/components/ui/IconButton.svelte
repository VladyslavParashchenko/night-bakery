<script lang="ts">
  import type { Snippet } from "svelte"

  // A round button with only an icon; the label names it for screen
  // readers and shows as a tooltip.
  let {
    label,
    pressed,
    onclick,
    children,
  }: {
    label: string
    pressed?: boolean
    onclick: () => void
    children: Snippet
  } = $props()
</script>

<button
  type="button"
  class="ui-icon-button"
  aria-label={label}
  aria-pressed={pressed}
  title={label}
  {onclick}
>
  {@render children()}
</button>

<style>
  .ui-icon-button {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-border);
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .ui-icon-button:hover {
    border-color: var(--color-oven-accent);
  }
  .ui-icon-button:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
    outline-offset: 0.125rem;
  }
</style>

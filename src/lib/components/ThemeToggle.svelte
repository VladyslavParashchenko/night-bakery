<script lang="ts">
  import { Monitor, Moon, Sun } from "lucide-svelte"
  import { m } from "$lib/i18n/messages"
  import { theme } from "$lib/theme/theme.svelte"

  const label = $derived(
    m.themeButton({
      theme:
        theme.choice === "system"
          ? m.themeSystem()
          : theme.choice === "dark"
            ? m.themeDark()
            : m.themeLight(),
    }),
  )
</script>

<button
  type="button"
  class="theme-toggle"
  aria-label={label}
  title={label}
  onclick={() => theme.cycle()}
>
  {#if theme.choice === "system"}
    <Monitor size="1.125rem" />
  {:else if theme.choice === "dark"}
    <Moon size="1.125rem" />
  {:else}
    <Sun size="1.125rem" />
  {/if}
</button>

<style>
  .theme-toggle {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-border);
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .theme-toggle:hover {
    border-color: var(--color-oven-accent);
  }
  .theme-toggle:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
    outline-offset: 0.125rem;
  }
</style>

<script lang="ts">
  import { Moon, Sun } from "lucide-svelte"
  import { m } from "$lib/i18n/messages"
  import { theme } from "$lib/theme/theme.svelte"

  const label = $derived(
    theme.current === "dark" ? m.themeLight() : m.themeDark(),
  )
</script>

<button
  type="button"
  class="theme-toggle"
  aria-label={label}
  title={label}
  onclick={() => theme.toggle()}
>
  {#if theme.current === "dark"}
    <Sun size={18} />
  {:else}
    <Moon size={18} />
  {/if}
</button>

<style>
  .theme-toggle {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-border);
    border-radius: 999px;
    cursor: pointer;
  }
  .theme-toggle:hover {
    border-color: var(--color-oven-accent);
  }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-oven-accent);
    outline-offset: 2px;
  }
</style>

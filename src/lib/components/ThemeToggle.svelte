<script lang="ts">
  import { Monitor, Moon, Sun } from "lucide-svelte"
  import IconButton from "$lib/components/ui/IconButton.svelte"
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

<IconButton {label} onclick={() => theme.cycle()}>
  {#if theme.choice === "system"}
    <Monitor size="1.125rem" />
  {:else if theme.choice === "dark"}
    <Moon size="1.125rem" />
  {:else}
    <Sun size="1.125rem" />
  {/if}
</IconButton>

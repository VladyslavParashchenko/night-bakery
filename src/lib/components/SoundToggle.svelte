<script lang="ts">
  import { Volume2, VolumeX } from "lucide-svelte"
  import { m } from "$lib/i18n/messages"
  import { sound } from "$lib/sound/sound.svelte"

  const label = $derived(sound.enabled ? m.soundOff() : m.soundOn())
</script>

<button
  type="button"
  class="sound-toggle"
  aria-label={label}
  aria-pressed={sound.enabled}
  title={label}
  onclick={() => sound.toggle()}
>
  {#if sound.enabled}
    <Volume2 size="1.125rem" />
  {:else}
    <VolumeX size="1.125rem" />
  {/if}
</button>

<style>
  .sound-toggle {
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
  .sound-toggle:hover {
    border-color: var(--color-oven-accent);
  }
  .sound-toggle:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
    outline-offset: 0.125rem;
  }
</style>

<script lang="ts">
  import { Volume2, VolumeX } from "lucide-svelte"
  import IconButton from "$lib/components/ui/IconButton.svelte"
  import { m } from "$lib/i18n/messages"
  import { sound } from "$lib/sound/sound.svelte"

  const label = $derived(sound.enabled ? m.soundOff() : m.soundOn())
</script>

<IconButton {label} pressed={sound.enabled} onclick={() => sound.toggle()}>
  {#if sound.enabled}
    <Volume2 size="1.125rem" />
  {:else}
    <VolumeX size="1.125rem" />
  {/if}
</IconButton>

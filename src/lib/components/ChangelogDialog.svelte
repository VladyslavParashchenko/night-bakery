<script lang="ts">
  import Markdown from "$lib/components/Markdown.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { getLocale, m, type Locale } from "$lib/i18n/messages"
  import changelogEn from "../../../CHANGELOG-EN.md?raw"
  import changelogUa from "../../../CHANGELOG-UA.md?raw"

  const sources: Record<Locale, string> = { uk: changelogUa, en: changelogEn }

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
</script>

<Modal {open} wide {onclose} title={m.changelogTitle()}>
  <Markdown source={sources[getLocale()]} />
</Modal>

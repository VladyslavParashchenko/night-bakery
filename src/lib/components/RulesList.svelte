<script lang="ts">
  import Markdown from "$lib/components/Markdown.svelte"
  import { getLocale, type Locale } from "$lib/i18n/messages"
  import rulesEn from "../../../RULES-EN.md?raw"
  import rulesUa from "../../../RULES-UA.md?raw"

  const sources: Record<Locale, string> = { uk: rulesUa, en: rulesEn }
</script>

<Markdown source={sources[getLocale()]} />

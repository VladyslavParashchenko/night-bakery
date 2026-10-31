<script lang="ts">
  import { marked } from "marked"
  import { getLocale, type Locale } from "$lib/i18n/messages"
  import rulesEn from "../../../RULES-EN.md?raw"
  import rulesUa from "../../../RULES-UA.md?raw"

  const sources: Record<Locale, string> = { uk: rulesUa, en: rulesEn }

  // The page or dialog shows its own title, so the document's `#` heading is
  // dropped and the rest move one level down to sit under it.
  const html = marked.parse(sources[getLocale()].replace(/^# .*\n/, ""), {
    async: false,
    walkTokens(token) {
      if (token.type === "heading") token.depth += 1
    },
  })
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own rules files -->
<div class="rules-md">{@html html}</div>

<style>
  .rules-md {
    line-height: 1.55;
  }
  .rules-md :global(h3) {
    margin: 28px 0 12px;
    font-size: 1.2rem;
    font-weight: 800;
  }
  .rules-md :global(h3:first-child) {
    margin-top: 0;
  }
  .rules-md :global(h4) {
    margin: 16px 0 4px;
    font-size: 1rem;
    font-weight: 800;
  }
  .rules-md :global(p) {
    margin: 0 0 12px;
  }
  .rules-md :global(ul),
  .rules-md :global(ol) {
    margin: 0 0 12px;
    padding-left: 24px;
  }
  .rules-md :global(li) {
    margin-bottom: 4px;
  }
  .rules-md :global(table) {
    width: 100%;
    margin: 0 0 16px;
    border-collapse: collapse;
  }
  .rules-md :global(th),
  .rules-md :global(td) {
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--color-oven-border);
  }
  .rules-md :global(thead th) {
    color: var(--color-oven-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>

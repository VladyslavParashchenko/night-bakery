<script lang="ts">
  import { marked } from "marked"

  let { source }: { source: string } = $props()

  // The page or dialog shows its own title, so the document's `#` heading is
  // dropped and the rest move one level down to sit under it.
  const html = $derived(
    marked.parse(source.replace(/^# .*\n/, ""), {
      async: false,
      walkTokens(token) {
        if (token.type === "heading") token.depth += 1
      },
    }),
  )
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own Markdown files -->
<div class="markdown">{@html html}</div>

<style>
  .markdown {
    line-height: 1.55;
  }
  .markdown :global(h3) {
    margin: 28px 0 12px;
    font-size: 1.2rem;
    font-weight: 800;
  }
  .markdown :global(h3:first-child) {
    margin-top: 0;
  }
  .markdown :global(h4) {
    margin: 16px 0 4px;
    font-size: 1rem;
    font-weight: 800;
  }
  .markdown :global(p) {
    margin: 0 0 12px;
  }
  .markdown :global(ul),
  .markdown :global(ol) {
    margin: 0 0 12px;
    padding-left: 24px;
  }
  .markdown :global(li) {
    margin-bottom: 4px;
  }
  .markdown :global(table) {
    width: 100%;
    margin: 0 0 16px;
    border-collapse: collapse;
  }
  .markdown :global(th),
  .markdown :global(td) {
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--color-oven-border);
  }
  .markdown :global(thead th) {
    color: var(--color-oven-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>

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
    margin: 1.75rem 0 0.75rem;
    font-size: 1.2rem;
    font-weight: 800;
  }
  .markdown :global(h3:first-child) {
    margin-top: 0;
  }
  .markdown :global(h4) {
    margin: 1rem 0 0.25rem;
    font-size: 1rem;
    font-weight: 800;
  }
  .markdown :global(p) {
    margin: 0 0 0.75rem;
  }
  .markdown :global(ul),
  .markdown :global(ol) {
    margin: 0 0 0.75rem;
    padding-left: 1.5rem;
  }
  .markdown :global(li) {
    margin-bottom: 0.25rem;
  }
  .markdown :global(table) {
    width: 100%;
    margin: 0 0 1rem;
    border-collapse: collapse;
  }
  .markdown :global(th),
  .markdown :global(td) {
    padding: 0.625rem 0.75rem;
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

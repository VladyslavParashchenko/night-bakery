<script lang="ts">
  import { X } from "lucide-svelte"
  import Markdown from "$lib/components/Markdown.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { getLocale, m, type Locale } from "$lib/i18n/messages"
  import changelogEn from "../../../CHANGELOG-EN.md?raw"
  import changelogUa from "../../../CHANGELOG-UA.md?raw"

  const sources: Record<Locale, string> = { uk: changelogUa, en: changelogEn }

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
</script>

<Modal {open} wide {onclose}>
  {#snippet header()}
    <div class="head">
      <h2>{m.changelogTitle()}</h2>
      <button
        type="button"
        class="close"
        aria-label={m.close()}
        onclick={onclose}
      >
        <X size="1.375rem" />
      </button>
    </div>
  {/snippet}
  <Markdown source={sources[getLocale()]} />
</Modal>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    color: var(--color-oven-text);
  }
  .close {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-oven-muted);
    background: transparent;
    border: none;
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .close:hover {
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
  }
</style>

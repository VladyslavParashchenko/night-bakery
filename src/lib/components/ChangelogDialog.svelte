<script lang="ts">
  import { X } from "lucide-svelte"
  import Markdown from "$lib/components/Markdown.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { m } from "$lib/i18n/messages"
  import changelog from "../../../CHANGELOG.md?raw"

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
        <X size={22} />
      </button>
    </div>
  {/snippet}
  <Markdown source={changelog} />
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
    width: 40px;
    height: 40px;
    color: var(--color-oven-muted);
    background: transparent;
    border: none;
    border-radius: 999px;
    cursor: pointer;
  }
  .close:hover {
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
  }
</style>

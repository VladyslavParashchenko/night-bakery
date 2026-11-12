<script lang="ts">
  import RulesList from "$lib/components/RulesList.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { m } from "$lib/i18n/messages"

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
</script>

<Modal {open} wide {onclose} title={m.rulesTitle()}>
  <RulesList />
</Modal>

<script lang="ts">
  import GameLog from "$lib/components/GameLog.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import type { GameState } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    open,
    state,
    onclose,
  }: { open: boolean; state: GameState; onclose: () => void } = $props()
</script>

<!-- The log lives in a dialog so the table keeps its height. -->
<Modal {open} {onclose} title={m.logTitle()}>
  <GameLog {state} />
</Modal>

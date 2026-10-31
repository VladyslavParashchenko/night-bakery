<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte"
  import { m } from "$lib/i18n/messages"
  import { SCORCH_WINDOW_MS } from "$lib/stores/game.svelte"

  let {
    offenderName,
    isHumanOffender,
    onslap,
  }: { offenderName: string; isHumanOffender: boolean; onslap: () => void } =
    $props()
</script>

<div class="scorch" role="alert" style={`--window: ${SCORCH_WINDOW_MS}ms`}>
  <strong>{m.scorchTitle()}</strong>
  <p>
    {isHumanOffender
      ? m.scorchYouPlayed()
      : m.scorchBotPlayed({ name: offenderName })}
  </p>
  {#if !isHumanOffender}
    <Button variant="fire" size="large" onclick={onslap}
      >{m.scorchButton()}</Button
    >
  {/if}
  <div class="timer"></div>
</div>

<style>
  .scorch {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    background: rgb(242 95 76 / 0.15);
    border: 2px solid var(--color-oven-fire);
    border-radius: 16px;
    animation: pulse 0.6s ease-in-out infinite alternate;
  }
  strong {
    font-size: 1.1rem;
  }
  p {
    margin: 0;
  }
  .timer {
    height: 5px;
    background: var(--color-oven-fire);
    border-radius: 999px;
    transform-origin: left;
    animation: shrink var(--window) linear forwards;
  }
  @keyframes shrink {
    to {
      transform: scaleX(0);
    }
  }
  @keyframes pulse {
    to {
      box-shadow: 0 0 24px rgb(242 95 76 / 0.45);
    }
  }
</style>

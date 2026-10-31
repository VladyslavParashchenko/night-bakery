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
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: rgb(242 95 76 / 0.15);
    border: 0.125rem solid var(--color-oven-fire);
    border-radius: 1rem;
    animation: pulse 0.6s ease-in-out infinite alternate;
  }
  strong {
    font-size: 1.1rem;
  }
  p {
    margin: 0;
  }
  .timer {
    height: 0.3125rem;
    background: var(--color-oven-fire);
    border-radius: 62.4375rem;
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
      box-shadow: 0 0 1.5rem rgb(242 95 76 / 0.45);
    }
  }
</style>

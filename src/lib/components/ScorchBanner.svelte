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
  /* Floats over the top of the screen instead of pushing the table down,
     and leaves the ovens with the matching cards in sight. */
  .scorch {
    --shadow: 0 1rem 2.5rem rgb(0 0 0 / 0.35);
    position: fixed;
    top: max(0.75rem, env(safe-area-inset-top));
    left: 50%;
    z-index: var(--z-scorch);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(calc(100% - 2rem), 26rem);
    padding: 1rem 1.125rem;
    color: var(--color-oven-text);
    background: color-mix(
      in srgb,
      var(--color-oven-fire) 15%,
      var(--color-oven-surface)
    );
    border: 0.125rem solid var(--color-oven-fire);
    border-radius: 1rem;
    box-shadow: var(--shadow);
    transform: translateX(-50%);
    animation:
      appear 0.18s ease-out,
      pulse 0.6s ease-in-out infinite alternate;
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
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-0.75rem);
    }
  }
  @keyframes pulse {
    to {
      box-shadow:
        var(--shadow),
        0 0 1.5rem color-mix(in srgb, var(--color-oven-fire) 55%, transparent);
    }
  }
</style>

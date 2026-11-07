<script lang="ts">
  import { Lock } from "lucide-svelte"
  import GameCard from "$lib/components/GameCard.svelte"
  import { flyIn, type LaunchPoint } from "$lib/components/card-flight"
  import { OVEN_CAPACITY, type Oven } from "$lib/game/types"
  import { m } from "$lib/i18n/messages"

  let {
    oven,
    index,
    lockedByName,
    target = false,
    over = false,
    clickable = false,
    launch,
    onclick,
  }: {
    oven: Oven
    index: number
    lockedByName: string | null
    target?: boolean
    over?: boolean
    clickable?: boolean
    launch?: (cardId: string) => LaunchPoint | null
    onclick?: () => void
  } = $props()

  const FLAMES = 7
</script>

<button
  type="button"
  class="oven"
  class:target
  class:over
  class:hot={oven.cards.length === OVEN_CAPACITY - 1}
  class:cold={oven.cards.length === 0}
  style:--heat={oven.cards.length / (OVEN_CAPACITY - 1)}
  data-oven={index}
  disabled={!clickable}
  aria-label={m.ovenLabel({ number: index + 1 })}
  {onclick}
>
  <header>
    <span class="title">{m.ovenLabel({ number: index + 1 })}</span>
    {#if lockedByName}
      <span class="lock"
        ><Lock size={16} />{m.ovenLocked({ name: lockedByName })}</span
      >
    {/if}
  </header>

  <!-- The oven's mouth: cards bake on a bed of embers that glows brighter
       with every card, as the oven gets closer to burning. -->
  <div class="chamber">
    <div class="fire" aria-hidden="true">
      {#each [...Array(FLAMES).keys()] as i (i)}
        <span class="flame" style:--i={i}></span>
      {/each}
    </div>
    <div class="stack">
      {#each oven.cards as card (card.id)}
        <div
          class="stacked"
          in:flyIn={{ from: () => launch?.(card.id) ?? null }}
        >
          <GameCard {card} size="sm" disabled />
        </div>
      {:else}
        <span class="empty">{m.ovenEmpty()}</span>
      {/each}
    </div>
  </div>

  <div class="embers" aria-hidden="true">
    {#each [...Array(OVEN_CAPACITY).keys()] as i (i)}
      <span
        class="ember"
        class:lit={i < oven.cards.length}
        class:last={i === OVEN_CAPACITY - 1}
      ></span>
    {/each}
  </div>
</button>

<style>
  .oven {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
    padding: 0.875rem 0.875rem 1rem;
    color: inherit;
    text-align: left;
    background: linear-gradient(
      var(--color-oven-surface),
      var(--color-oven-surface-raised)
    );
    border: 0.125rem solid var(--color-oven-border);
    border-radius: 1.5rem 1.5rem 1rem 1rem;
    box-shadow: 0 0.25rem 0 var(--color-oven-border);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease,
      --heat 0.4s ease;
  }
  .oven:disabled {
    cursor: default;
  }
  .oven.target {
    cursor: pointer;
    border-color: var(--color-oven-accent);
    box-shadow:
      0 0.25rem 0 var(--color-oven-accent),
      0 0 0 0.25rem rgb(255 216 3 / 0.45);
  }
  .oven.target:hover {
    transform: translateY(-0.125rem);
  }
  .oven.over {
    border-color: var(--color-oven-fire);
    box-shadow: 0 0.25rem 0 var(--color-oven-fire);
  }
  .oven.target.over {
    border-color: var(--color-oven-accent);
    box-shadow:
      0 0.25rem 0 var(--color-oven-accent),
      0 0 0 0.5rem rgb(255 216 3 / 0.6);
    transform: scale(1.02);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    padding: 0 0.25rem;
  }
  .title {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .lock {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-ink);
    background: var(--color-oven-accent);
    border-radius: 62.4375rem;
  }
  /* An arched brick mouth with a glow rising from the embers below. */
  .chamber {
    position: relative;
    padding: 1.25rem 0.625rem 0.625rem;
    background:
      radial-gradient(
        120% calc(50% + var(--heat) * 40%) at 50% 110%,
        color-mix(
          in srgb,
          var(--color-ember) calc(15% + var(--heat) * 60%),
          transparent
        ),
        transparent 70%
      ),
      linear-gradient(var(--color-chamber-deep), var(--color-chamber));
    border: 0.25rem solid var(--color-oven-border);
    border-bottom-width: 0.125rem;
    /* 50% wide corners make a true arch; 999px would be scaled down to flat. */
    border-radius: 50% 50% 0.625rem 0.625rem / 2.75rem 2.75rem 0.625rem 0.625rem;
    box-shadow: inset 0 0.5rem 1rem rgb(0 0 0 / 0.45);
  }
  /* Flames grow taller and brighter with every card in the oven. Only this
     layer is clipped to the arch: the chamber itself must not clip, or cards
     flying in from the hand would be hidden until they land. */
  .fire {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
    opacity: calc(0.45 + var(--heat) * 0.55);
  }
  .flame {
    position: absolute;
    bottom: -0.5rem;
    left: calc(var(--i) * 15% - 5%);
    width: 20%;
    height: calc(35% + var(--heat) * 55%);
    background: radial-gradient(
      ellipse 50% 90% at 50% 100%,
      var(--color-flame-core) 0%,
      var(--color-ember) 30%,
      var(--color-oven-fire) 60%,
      transparent 100%
    );
    border-radius: 50% 50% 40% 40% / 80% 80% 20% 20%;
    filter: blur(0.1875rem);
    transform-origin: 50% 100%;
    /* Its own layer: the blur is drawn once and only the transform moves. */
    will-change: transform;
    animation: lick 1.6s ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * -0.37s);
  }
  /* Every other tongue, both edge ones included, is shorter and out of step,
     so the fire looks ragged. */
  .flame:nth-child(odd) {
    height: calc(25% + var(--heat) * 40%);
    animation-duration: 1.2s;
  }
  @keyframes lick {
    from {
      transform: scale(0.9, 0.85) translateX(-4%);
    }
    50% {
      transform: scale(1.05, 1.1) translateX(3%);
    }
    to {
      transform: scale(0.95, 0.95) translateX(-2%);
    }
  }
  /* Painted over the fire by source order; a z-index here would trap the
     flying card's z-index and let it slide under the neighbouring ovens. */
  .stack {
    position: relative;
    display: flex;
    align-items: center;
    /* A stack wider than a narrow oven overflows to the right, not off the
       left edge. */
    justify-content: safe center;
    min-height: 7.25rem;
  }
  .stacked {
    position: relative;
    filter: drop-shadow(0 0.25rem 0.375rem rgb(0 0 0 / 0.45));
  }
  .stacked:not(:first-child) {
    margin-left: -2.75rem;
  }
  .empty {
    width: 100%;
    color: var(--color-chamber-text);
    font-size: 1rem;
    text-align: center;
    opacity: 0.75;
  }
  /* Five embers on the hearth: one lights up per card, and the last one
     flickers while the oven is a card away from burning. */
  .embers {
    display: flex;
    gap: 0.375rem;
    padding: 0 0.25rem;
  }
  .ember {
    flex: 1;
    height: 0.5rem;
    background: var(--color-oven-border);
    border-radius: 62.4375rem;
    transition:
      background 0.3s ease,
      box-shadow 0.3s ease;
  }
  .ember.lit {
    background: linear-gradient(
      90deg,
      var(--color-ember),
      var(--color-oven-fire)
    );
    box-shadow: 0 0 0.5rem
      color-mix(in srgb, var(--color-oven-fire) 60%, transparent);
  }
  .ember.last {
    outline: 1px dashed
      color-mix(in srgb, var(--color-oven-fire) 70%, transparent);
    outline-offset: 1px;
  }
  .hot .ember.last {
    animation: flicker 0.9s ease-in-out infinite alternate;
  }
  @keyframes flicker {
    from {
      background: var(--color-oven-border);
      box-shadow: none;
    }
    to {
      background: color-mix(in srgb, var(--color-oven-fire) 55%, transparent);
      box-shadow: 0 0 0.625rem
        color-mix(in srgb, var(--color-oven-fire) 70%, transparent);
    }
  }
  @media (max-width: 600px) {
    .oven {
      gap: 0.5rem;
      padding: 0.5rem 0.5rem 0.625rem;
      border-radius: 1rem 1rem 0.75rem 0.75rem;
    }
    .title {
      font-size: 0.95rem;
    }
    .lock {
      padding: 0.125rem 0.375rem;
      font-size: 0.7rem;
    }
    .chamber {
      padding: 0.875rem 0.25rem 0.375rem;
      border-width: 0.1875rem 0.1875rem 0.125rem;
      border-radius: 50% 50% 0.5rem 0.5rem / 1.75rem 1.75rem 0.5rem 0.5rem;
    }
    .stack {
      min-height: 5.5rem;
    }
    .stacked:not(:first-child) {
      margin-left: -3.25rem;
    }
    .embers {
      gap: 0.1875rem;
    }
  }
  /* An empty oven only smoulders: no need to keep its flames moving. */
  .cold .flame {
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .flame {
      animation: none;
    }
    .hot .ember.last {
      animation: none;
      background: color-mix(in srgb, var(--color-oven-fire) 55%, transparent);
    }
  }
</style>

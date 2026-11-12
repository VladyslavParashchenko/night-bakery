<script lang="ts">
  import {
    ArrowLeft,
    BookOpen,
    Layers,
    Recycle,
    ScrollText,
  } from "lucide-svelte"
  import SoundToggle from "$lib/components/SoundToggle.svelte"
  import ThemeToggle from "$lib/components/ThemeToggle.svelte"
  import IconButton from "$lib/components/ui/IconButton.svelte"
  import { m } from "$lib/i18n/messages"

  let {
    deckCount,
    discardCount,
    onrules,
    onlog,
  }: {
    deckCount: number
    discardCount: number
    onrules: () => void
    // Opens the event log, which is kept off the table to save height.
    onlog: () => void
  } = $props()

  const piles = $derived(
    `${m.deckLabel({ count: deckCount })} · ${m.discardLabel({ count: discardCount })}`,
  )
</script>

<!-- One row everywhere, so the table below gets the height. -->
<header class="topbar">
  <a class="back" href="/" aria-label={m.actionMenu()}>
    <ArrowLeft size={18} /><span class="wide-only">{m.actionMenu()}</span>
  </a>
  <span class="piles" title={piles}>
    <span class="wide-only">{piles}</span>
    <span class="narrow-only" role="img" aria-label={piles}>
      <span class="pile"><Layers size={16} />{deckCount}</span>
      <span class="pile"><Recycle size={16} />{discardCount}</span>
    </span>
  </span>
  <div class="actions">
    <IconButton label={m.logTitle()} onclick={onlog}>
      <ScrollText size="1.125rem" />
    </IconButton>
    <SoundToggle />
    <ThemeToggle />
    <button
      type="button"
      class="rules-button"
      aria-label={m.menuRules()}
      onclick={onrules}
    >
      <BookOpen size={18} /><span class="wide-only">{m.menuRules()}</span>
    </button>
  </div>
</header>

<style>
  .topbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-oven-muted);
    font-size: 1rem;
  }
  .back {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-oven-text);
    font-weight: 700;
    text-decoration: none;
  }
  .piles {
    min-width: 0;
    overflow: hidden;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .narrow-only {
    display: none;
  }
  .pile {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0 0.375rem;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .rules-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-width: 2.5rem;
    min-height: 2.5rem;
    padding: 0 0.875rem;
    color: var(--color-oven-text);
    font-weight: 700;
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-border);
    border-radius: 62.4375rem;
    cursor: pointer;
  }
  .rules-button:hover {
    border-color: var(--color-oven-accent);
  }
  .rules-button:focus-visible {
    outline: 0.125rem solid var(--color-oven-accent);
    outline-offset: 0.125rem;
  }
  @media (max-width: 600px) {
    .topbar {
      gap: 0.375rem;
      font-size: 0.9rem;
    }
    .wide-only {
      display: none;
    }
    .narrow-only {
      display: inline;
    }
    .actions {
      gap: 0.375rem;
    }
    .rules-button {
      padding: 0;
    }
  }
</style>

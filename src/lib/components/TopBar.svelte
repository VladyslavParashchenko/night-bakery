<script lang="ts">
  import { ArrowLeft, BookOpen } from "lucide-svelte"
  import ThemeToggle from "$lib/components/ThemeToggle.svelte"
  import { m } from "$lib/i18n/messages"

  let {
    deckCount,
    discardCount,
    onrules,
  }: { deckCount: number; discardCount: number; onrules: () => void } = $props()
</script>

<header class="topbar">
  <a class="back" href="/"><ArrowLeft size={18} />{m.actionMenu()}</a>
  <span class="piles">
    {m.deckLabel({ count: deckCount })} · {m.discardLabel({
      count: discardCount,
    })}
  </span>
  <div class="actions">
    <ThemeToggle />
    <button type="button" class="rules-button" onclick={onrules}>
      <BookOpen size={18} />{m.menuRules()}
    </button>
  </div>
</header>

<style>
  /* Menu link left, buttons right; the pile counts sit between them, or on
     their own row on narrow screens. */
  .topbar {
    display: grid;
    grid-template-areas: "back piles actions";
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px 12px;
    color: var(--color-oven-muted);
    font-size: 1rem;
  }
  .back {
    grid-area: back;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-oven-text);
    font-weight: 700;
    text-decoration: none;
  }
  .piles {
    grid-area: piles;
    text-align: center;
  }
  .actions {
    grid-area: actions;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @media (max-width: 600px) {
    .topbar {
      grid-template-areas:
        "back actions"
        "piles piles";
      grid-template-columns: 1fr auto;
    }
    .piles {
      text-align: left;
    }
  }
  .rules-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    color: var(--color-oven-text);
    font-weight: 700;
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-border);
    border-radius: 999px;
    cursor: pointer;
  }
  .rules-button:hover {
    border-color: var(--color-oven-accent);
  }
</style>

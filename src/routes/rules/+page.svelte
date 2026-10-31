<script lang="ts">
  import { ArrowLeft } from "lucide-svelte"
  import RulesList from "$lib/components/RulesList.svelte"
  import { m } from "$lib/i18n/messages"
</script>

<main class="rules">
  <a class="back" href="/"><ArrowLeft size={18} />{m.backToMenu()}</a>
  <h1>{m.rulesTitle()}</h1>
  <RulesList />
</main>

<style>
  .rules {
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 16px 48px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-oven-text);
    font-weight: 700;
    text-decoration: none;
  }
  h1 {
    margin: 16px 0;
    color: var(--color-oven-text);
  }
</style>

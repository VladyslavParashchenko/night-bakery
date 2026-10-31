<script lang="ts">
  import { goto } from "$app/navigation"
  import ThemeToggle from "$lib/components/ThemeToggle.svelte"
  import Button from "$lib/components/ui/Button.svelte"
  import { MAX_PLAYERS, MIN_PLAYERS } from "$lib/game/types"
  import { getLocale, locales, m, setLocale } from "$lib/i18n/messages"
  import { game } from "$lib/stores/game.svelte"

  const NAME_KEY = "night-bakery:name"
  const botNames = [m.botName1, m.botName2, m.botName3, m.botName4]

  function loadName() {
    try {
      return localStorage.getItem(NAME_KEY) ?? ""
    } catch {
      return ""
    }
  }

  // Coming back to the menu ends any game in progress.
  game.quit()

  let name = $state(loadName())
  let bots = $state(2)

  function start() {
    const playerName = name.trim() || m.menuDefaultName()
    try {
      localStorage.setItem(NAME_KEY, playerName)
    } catch {
      // Remembering the name is only a convenience.
    }
    const setups = [
      { name: playerName, isBot: false },
      ...botNames
        .slice(0, bots)
        .map((botName) => ({ name: botName(), isBot: true })),
    ]
    game.start(setups)
    goto("/play")
  }
</script>

<main class="menu">
  <div class="hero">
    <h1>
      <img
        class="logo"
        src={`/brand/logo-${getLocale()}.webp`}
        alt={m.appName()}
        width="720"
        height="720"
      />
    </h1>
    <p>{m.appTagline()}</p>
  </div>

  <section class="panel">
    <label class="field">
      <span>{m.menuYourName()}</span>
      <input
        bind:value={name}
        placeholder={m.menuDefaultName()}
        maxlength="20"
      />
    </label>

    <div class="field">
      <span>{m.menuOpponents()}</span>
      <div class="choices">
        {#each Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => i + MIN_PLAYERS - 1) as count (count)}
          <Button
            variant={bots === count ? "primary" : "secondary"}
            onclick={() => (bots = count)}
          >
            {count}
          </Button>
        {/each}
      </div>
    </div>

    <Button size="large" onclick={start}>{m.menuStart()}</Button>
    <a class="rules-link" href="/rules">{m.menuRules()}</a>
  </section>

  <div class="settings">
    <div class="lang" role="group" aria-label={m.languageLabel()}>
      {#each locales as locale (locale)}
        <button
          type="button"
          class:active={getLocale() === locale}
          onclick={() => setLocale(locale)}
        >
          {locale.toUpperCase()}
        </button>
      {/each}
    </div>
    <ThemeToggle />
  </div>
</main>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    max-width: 440px;
    margin: 0 auto;
    padding: 48px 16px;
  }
  .hero {
    text-align: center;
  }
  .logo {
    display: block;
    width: min(100%, 320px);
    height: auto;
    margin: 0 auto;
  }
  h1 {
    margin: 8px 0;
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--color-oven-text);
  }
  .hero p {
    margin: 0;
    color: var(--color-oven-muted);
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    padding: 24px;
    background: var(--color-oven-surface);
    border: 1px solid var(--color-oven-border);
    border-radius: 24px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-weight: 700;
  }
  input {
    min-height: 44px;
    padding: 0 14px;
    color: var(--color-oven-text);
    background: var(--color-oven-bg);
    border: 1px solid var(--color-oven-border);
    border-radius: 12px;
  }
  input:focus {
    outline: 2px solid var(--color-oven-accent);
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .rules-link {
    color: var(--color-oven-text);
    font-weight: 700;
    text-align: center;
  }
  .settings {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lang {
    display: flex;
    gap: 6px;
  }
  .lang button {
    padding: 6px 12px;
    color: var(--color-oven-muted);
    background: transparent;
    border: 1px solid var(--color-oven-border);
    border-radius: 999px;
    cursor: pointer;
  }
  .lang button.active {
    color: var(--color-ink);
    background: var(--color-oven-accent);
    border-color: var(--color-oven-accent);
  }
</style>

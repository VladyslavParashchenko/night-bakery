<script lang="ts">
  import { goto } from "$app/navigation"
  import ChangelogDialog from "$lib/components/ChangelogDialog.svelte"
  import SoundToggle from "$lib/components/SoundToggle.svelte"
  import ThemeToggle from "$lib/components/ThemeToggle.svelte"
  import Button from "$lib/components/ui/Button.svelte"
  import { MAX_PLAYERS, MIN_PLAYERS } from "$lib/game/types"
  import { botSetups } from "$lib/i18n/game-labels"
  import { getLocale, locales, m, setLocale } from "$lib/i18n/messages"
  import { room } from "$lib/net/room.svelte"
  import { game } from "$lib/stores/game.svelte"
  import { loadName, saveName } from "$lib/stores/player-name"
  import { APP_VERSION } from "$lib/version"

  // Coming back to the menu ends any game in progress.
  game.quit()
  room.leave()
  room.problem = null

  let name = $state(loadName())
  let bots = $state(2)
  let changelogOpen = $state(false)

  function playerName() {
    const playerName = name.trim() || m.menuDefaultName()
    saveName(playerName)
    return playerName
  }

  function start() {
    game.start([{ name: playerName(), isBot: false }, ...botSetups(bots)])
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
    <Button
      size="large"
      variant="secondary"
      onclick={() => {
        playerName()
        goto("/lobby")
      }}
    >
      {m.menuOnline()}
    </Button>
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
    <SoundToggle />
    <ThemeToggle />
  </div>

  <button
    type="button"
    class="version"
    aria-label={m.changelogOpen({ version: APP_VERSION })}
    onclick={() => (changelogOpen = true)}
  >
    v{APP_VERSION}
  </button>
</main>

<ChangelogDialog open={changelogOpen} onclose={() => (changelogOpen = false)} />

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
  .version {
    padding: 4px 10px;
    color: var(--color-oven-muted);
    font: inherit;
    font-size: 0.85rem;
    background: transparent;
    border: none;
    border-radius: 999px;
    cursor: pointer;
  }
  .version:hover {
    color: var(--color-oven-text);
    text-decoration: underline;
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

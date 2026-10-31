<script lang="ts">
  import { ArrowLeft } from "lucide-svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import Button from "$lib/components/ui/Button.svelte"
  import { MAX_PLAYERS } from "$lib/game/types"
  import { botSetups } from "$lib/i18n/game-labels"
  import { m } from "$lib/i18n/messages"
  import { normalizeCode, room } from "$lib/net/room.svelte"
  import { game } from "$lib/stores/game.svelte"
  import { loadName } from "$lib/stores/player-name"

  const name = loadName() || m.menuDefaultName()

  const invite = normalizeCode(page.url.searchParams.get("join") ?? "")
  let code = $state(invite)
  let pickedBots = $state(0)
  let copied = $state(false)

  const link = $derived(
    room.code ? `${page.url.origin}/lobby?join=${room.code}` : "",
  )

  // An invite link joins straight away.
  if (invite && room.status === "idle" && !room.problem) room.join(invite, name)

  $effect(() => {
    if (room.status === "playing" && game.state) goto("/play")
  })

  // Friends who join after the pick take seats from the bots.
  const bots = $derived(Math.min(pickedBots, room.seatsLeft))

  function join() {
    const value = normalizeCode(code)
    if (value) room.join(value, name)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      copied = true
      setTimeout(() => (copied = false), 1500)
    } catch {
      // The link is on screen to copy by hand.
    }
  }

  function back() {
    room.problem = null
    room.leave()
    goto("/")
  }
</script>

<main class="lobby">
  <button type="button" class="back" onclick={back}>
    <ArrowLeft size={18} />{m.backToMenu()}
  </button>
  <h1>{m.lobbyTitle()}</h1>

  {#if room.problem}
    <p class="problem" role="alert">
      {{
        notFound: m.roomProblem_notFound,
        full: m.roomProblem_full,
        started: m.roomProblem_started,
        hostLeft: m.roomProblem_hostLeft,
        network: m.roomProblem_network,
      }[room.problem]()}
    </p>
  {/if}

  <section class="panel">
    {#if room.status === "idle"}
      <Button size="large" onclick={() => room.host(name)}>
        {m.lobbyHost()}
      </Button>
      <p class="muted">{m.lobbyHostHint()}</p>
      <p class="or">{m.lobbyOr()}</p>
      <form
        class="join"
        onsubmit={(event) => {
          event.preventDefault()
          join()
        }}
      >
        <label class="field">
          <span>{m.lobbyCodeLabel()}</span>
          <input
            bind:value={code}
            maxlength="5"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <Button type="submit" variant="secondary" disabled={!code.trim()}>
          {m.lobbyJoin()}
        </Button>
      </form>
    {:else if room.status === "connecting"}
      <p class="muted">{m.lobbyConnecting()}</p>
    {:else}
      {#if room.role === "host"}
        <div class="code">{room.code}</div>
        <p class="muted">{m.lobbyShare()}</p>
        <div class="link">
          <input readonly value={link} aria-label={m.lobbyCopyLink()} />
          <Button variant="secondary" onclick={copyLink}>
            {copied ? m.lobbyCopied() : m.lobbyCopyLink()}
          </Button>
        </div>
      {/if}

      <div class="field">
        <span>
          {m.lobbyPlayers({ count: room.names.length, max: MAX_PLAYERS })}
        </span>
        <ul class="players">
          {#each room.names as playerName, i (i)}
            <li>
              {playerName}
              {#if i === 0}<span class="badge">{m.lobbyHostBadge()}</span>{/if}
            </li>
          {/each}
        </ul>
      </div>

      {#if room.role === "host"}
        {#if room.seatsLeft > 0}
          <div class="field">
            <span>{m.lobbyBots()}</span>
            <div class="choices">
              {#each Array.from({ length: room.seatsLeft + 1 }, (_, i) => i) as count (count)}
                <Button
                  variant={bots === count ? "primary" : "secondary"}
                  onclick={() => (pickedBots = count)}
                >
                  {count}
                </Button>
              {/each}
            </div>
          </div>
        {/if}
        <Button
          size="large"
          disabled={!room.canStart}
          onclick={() => room.start(botSetups(bots))}
        >
          {m.lobbyStart()}
        </Button>
        {#if !room.canStart}
          <p class="muted">{m.lobbyNeedFriend()}</p>
        {/if}
      {:else}
        <p class="muted">{m.lobbyWaitingHost()}</p>
      {/if}

      <Button variant="secondary" onclick={back}>{m.lobbyLeave()}</Button>
    {/if}
  </section>
</main>

<style>
  .lobby {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 440px;
    margin: 0 auto;
    padding: 32px 16px 48px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 6px;
    padding: 0;
    color: var(--color-oven-text);
    font: inherit;
    font-weight: 700;
    background: none;
    border: none;
    cursor: pointer;
  }
  h1 {
    margin: 0;
    color: var(--color-oven-text);
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px;
    background: var(--color-oven-surface);
    border: 1px solid var(--color-oven-border);
    border-radius: 24px;
  }
  .muted {
    margin: 0;
    color: var(--color-oven-muted);
  }
  .problem {
    margin: 0;
    padding: 12px 16px;
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border: 1px solid var(--color-oven-accent);
    border-radius: 12px;
    font-weight: 700;
  }
  .or {
    margin: 4px 0;
    color: var(--color-oven-muted);
    text-align: center;
  }
  .join {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-weight: 700;
  }
  input {
    min-width: 0;
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
  .join input {
    font-size: 1.3rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }
  .code {
    color: var(--color-oven-text);
    font-size: 2.6rem;
    font-weight: 800;
    letter-spacing: 0.25em;
    text-align: center;
  }
  .link {
    display: flex;
    gap: 8px;
  }
  .link input {
    flex: 1;
  }
  .players {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-weight: 400;
  }
  .players li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--color-oven-bg);
    border-radius: 12px;
  }
  .badge {
    padding: 2px 8px;
    color: var(--color-ink);
    font-size: 0.8rem;
    font-weight: 700;
    background: var(--color-oven-accent);
    border-radius: 999px;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
</style>

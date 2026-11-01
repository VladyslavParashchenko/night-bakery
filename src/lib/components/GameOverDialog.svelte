<script lang="ts">
  import { onMount, tick } from "svelte"
  import { Tween } from "svelte/motion"
  import { cubicOut } from "svelte/easing"
  import Button from "$lib/components/ui/Button.svelte"
  import Modal from "$lib/components/ui/Modal.svelte"
  import { isVisible, sortHand } from "$lib/game/cards"
  import type { GameState, Player } from "$lib/game/types"
  import { COOK_EMOJI, PASTRY_EMOJI } from "$lib/i18n/game-labels"
  import { m } from "$lib/i18n/messages"

  let {
    gameState,
    winnerId,
    me,
    wins,
    duration,
    ready,
    hidden = false,
    onrematch,
    onready,
    onpeek,
    onmenu,
  }: {
    gameState: GameState
    winnerId: number
    me: number
    // Wins per seat at this table, this game included.
    wins: number[]
    duration: number
    // Seats that asked the host for a rematch.
    ready: number[]
    // Hidden rather than closed, so its entrance does not play again.
    hidden?: boolean
    // Online guests have none: the host starts rematches.
    onrematch?: () => void
    // Only online guests ask for one.
    onready?: () => void
    onpeek: () => void
    onmenu: () => void
  } = $props()

  const MEDALS = ["🥇", "🥈", "🥉"]
  const FLOUR_COLOURS = [
    "#fff8ed",
    "#f6ebda",
    "var(--color-suit-croissant)",
    "var(--color-suit-bagel)",
    "var(--color-suit-pretzel)",
    "var(--color-suit-donut)",
  ]

  const reducedMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches

  const won = $derived(winnerId === me)
  const winner = $derived(gameState.players[winnerId])
  // The winner comes first even if someone else was left empty-handed too.
  const standings = $derived(
    [...gameState.players].sort(
      (a, b) =>
        Number(b.id === winnerId) - Number(a.id === winnerId) ||
        a.hand.length - b.hand.length,
    ),
  )
  // A host on an older version of the game sends no stats.
  const stats = $derived(gameState.stats as GameState["stats"] | undefined)
  const totalBurns = $derived(
    stats?.players.reduce((sum, player) => sum + player.burns, 0) ?? 0,
  )
  const gamesPlayed = $derived(wins.reduce((sum, count) => sum + count, 0))
  const series = $derived(
    gameState.players
      .filter((player) => wins[player.id] > 0)
      .sort((a, b) => wins[b.id] - wins[a.id]),
  )
  // Pressed here; the host's list only shows the request once it arrives.
  let asked = $state(false)

  // Ties share a place.
  function place(player: Player) {
    if (player.id === winnerId) return 1
    return (
      1 +
      gameState.players.filter(
        (other) =>
          other.id === winnerId || other.hand.length < player.hand.length,
      ).length
    )
  }

  const rows = $derived(
    standings.map((player) => ({
      player,
      rank: place(player),
      own: stats?.players[player.id],
      left: sortHand(player.hand.filter(isVisible)),
    })),
  )

  function formatDuration(ms: number) {
    const seconds = Math.round(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
  }

  // Flour and crumbs falling over the table when we win.
  const flour = Array.from({ length: 28 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.9,
    fall: 1.8 + Math.random() * 1.4,
    size: 0.3 + Math.random() * 0.45,
    spin: Math.round(Math.random() * 720 - 360),
    colour: FLOUR_COLOURS[i % FLOUR_COLOURS.length],
  }))

  // Card counts climb from zero as the standings appear.
  const progress = new Tween(reducedMotion ? 1 : 0, {
    duration: 700,
    delay: 250,
    easing: cubicOut,
  })

  let root = $state<HTMLElement>()
  // Focus goes to the next step: playing again, or waiting for the host.
  function focusNext() {
    root?.querySelector<HTMLElement>(".main-action, .waiting")?.focus()
  }
  onMount(() => {
    progress.target = 1
    focusNext()
  })
  let wasHidden = false
  $effect(() => {
    if (wasHidden && !hidden) focusNext()
    wasHidden = hidden
  })

  async function askForRematch() {
    asked = true
    onready?.()
    await tick()
    focusNext()
  }
</script>

<Modal open {hidden}>
  {#if won && !reducedMotion}
    <div class="flour" aria-hidden="true">
      {#each flour as speck, i (i)}
        <span
          style:left={`${speck.left}%`}
          style:width={`${speck.size}rem`}
          style:height={`${speck.size}rem`}
          style:background={speck.colour}
          style:animation-delay={`${speck.delay}s`}
          style:animation-duration={`${speck.fall}s`}
          style:--spin={`${speck.spin}deg`}
        ></span>
      {/each}
    </div>
  {/if}

  <div class="result" bind:this={root}>
    <div class="trophy" class:lost={!won} aria-hidden="true">
      {won ? "👑" : "🔥"}
    </div>
    <h2>
      {won ? m.gameOverYouWin() : m.gameOverTitle({ name: winner.name })}
    </h2>
    <p class="muted">
      {won
        ? m.gameOverYouWinHint()
        : m.gameOverPlace({
            place: place(gameState.players[me]),
            total: gameState.players.length,
          })}
    </p>

    <dl class="stats">
      {#if stats}
        <div>
          <dt>{m.statTurns()}</dt>
          <dd>{stats.turns}</dd>
        </div>
        <div>
          <dt>{m.statBurns()}</dt>
          <dd>{totalBurns}</dd>
        </div>
      {/if}
      {#if duration > 0}
        <div>
          <dt>{m.statTime()}</dt>
          <dd>{formatDuration(duration)}</dd>
        </div>
      {/if}
    </dl>

    <div class="standings-head" aria-hidden="true">
      <span>{m.standingsPlayer()}</span>
      <span>{m.cardsLeftTitle()}</span>
    </div>
    <ol class="standings">
      {#each rows as { player, rank, own, left }, i (player.id)}
        <li
          class:winner={player.id === winnerId}
          class:mine={player.id === me}
          style:--i={i}
        >
          <span class="place" aria-label={String(rank)}>
            {MEDALS[rank - 1] ?? rank}
          </span>
          <div class="who">
            <div class="name">
              <strong>{player.name}</strong>
              {#if player.id === me}
                <span class="pill">{m.you()}</span>
              {/if}
              {#if ready.includes(player.id)}
                <span class="pill ready">✓ {m.readyBadge()}</span>
              {/if}
            </div>
            {#if own}
              <span class="player-stats">
                {m.playerStats({ played: own.played, drawn: own.drawn })}
              </span>
            {/if}
            {#if left.length > 0}
              <div class="leftovers">
                {#each left as card (card.id)}
                  <span
                    class={`mini ${card.pastry ?? "wild"}`}
                    title={card.type === "number"
                      ? `${PASTRY_EMOJI[card.pastry]} ${card.value}`
                      : COOK_EMOJI[card.cook]}
                  >
                    {card.type === "number"
                      ? card.value
                      : COOK_EMOJI[card.cook]}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
          {#if player.hand.length === 0}
            <span class="count done">{m.noCardsLeft()}</span>
          {:else}
            <strong class="count">
              <span class="sr-only">{player.hand.length}</span>
              <span aria-hidden="true">
                {Math.round(player.hand.length * progress.current)}
              </span>
            </strong>
          {/if}
        </li>
      {/each}
    </ol>

    {#if gamesPlayed > 1}
      <div class="series">
        <span class="muted">{m.seriesTitle()}</span>
        {#each series as player (player.id)}
          <span class="series-score">
            {player.id === me ? m.you() : player.name}
            <strong>{wins[player.id]}</strong>
          </span>
        {/each}
      </div>
    {/if}

    <div class="actions">
      {#if onrematch}
        <Button size="large" class="main-action" onclick={onrematch}>
          {m.playAgain()}
        </Button>
      {:else if onready && !asked}
        <Button size="large" class="main-action" onclick={askForRematch}>
          {m.playAgain()}
        </Button>
      {:else}
        <p class="muted waiting" tabindex="-1">{m.waitingForHost()}</p>
      {/if}
      <div class="secondary">
        <Button variant="ghost" onclick={onpeek}>{m.viewTable()}</Button>
        <Button variant="ghost" onclick={onmenu}>{m.backToMenu()}</Button>
      </div>
    </div>
  </div>
</Modal>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  .trophy {
    font-size: 3.5rem;
    line-height: 1;
    animation: crown-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .trophy.lost {
    animation-name: fade-up;
  }
  h2 {
    margin: 0;
  }
  .muted {
    margin: 0;
    color: var(--color-oven-muted);
  }
  .stats {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 0.5rem;
    margin: 0.25rem 0 0;
  }
  .stats div {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.125rem;
    padding: 0.5rem;
    background: var(--color-oven-bg);
    border-radius: 0.75rem;
  }
  .stats dt {
    font-size: 0.8rem;
    color: var(--color-oven-muted);
  }
  .stats dd {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
  }
  .standings-head {
    display: flex;
    justify-content: space-between;
    margin-top: 0.25rem;
    padding: 0 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-oven-muted);
  }
  .standings {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: left;
  }
  .standings li {
    display: grid;
    grid-template-columns: 1.75rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-oven-bg);
    border-radius: 0.75rem;
    animation: fade-up 0.4s ease-out both;
    animation-delay: calc(0.15s + var(--i) * 0.08s);
  }
  .standings li.winner {
    background: color-mix(in srgb, var(--color-oven-accent) 16%, transparent);
    outline: 0.125rem solid var(--color-oven-accent);
  }
  .place {
    font-size: 1.5rem;
    font-weight: 800;
    text-align: center;
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
  }
  .pill {
    padding: 0.0625rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-oven-text);
    background: var(--color-oven-surface-raised);
    border-radius: 999px;
  }
  .pill.ready {
    color: var(--color-ink);
    background: var(--color-suit-bagel);
  }
  .player-stats {
    font-size: 0.8rem;
    color: var(--color-oven-muted);
  }
  .leftovers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .mini {
    display: grid;
    place-items: center;
    min-width: 1.375rem;
    height: 1.875rem;
    padding: 0 0.125rem;
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--color-ink);
    border-radius: 0.3rem;
  }
  .mini.croissant {
    background: var(--color-suit-croissant);
  }
  .mini.bagel {
    background: var(--color-suit-bagel);
  }
  .mini.pretzel {
    background: var(--color-suit-pretzel);
    color: var(--color-ink-light);
  }
  .mini.donut {
    background: var(--color-suit-donut);
  }
  .mini.wild {
    background: conic-gradient(
      var(--color-suit-croissant) 0 25%,
      var(--color-suit-bagel) 0 50%,
      var(--color-suit-pretzel) 0 75%,
      var(--color-suit-donut) 0
    );
  }
  .count {
    min-width: 1.5rem;
    font-size: 1.25rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .count.done {
    font-size: 0.85rem;
    font-weight: 700;
  }
  .series {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.95rem;
  }
  .series-score {
    padding: 0.125rem 0.625rem;
    background: var(--color-oven-surface-raised);
    border-radius: 999px;
  }
  .series-score strong {
    margin-left: 0.25rem;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .waiting {
    padding: 0.75rem 0;
  }
  .secondary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .flour {
    position: fixed;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
  }
  .flour span {
    position: absolute;
    top: -1rem;
    border-radius: 50%;
    opacity: 0;
    animation-name: flour-fall;
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
  }
  @keyframes crown-drop {
    from {
      opacity: 0;
      transform: translateY(-2rem) scale(0.6) rotate(-12deg);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes fade-up {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes flour-fall {
    10% {
      opacity: 0.9;
    }
    80% {
      opacity: 0.9;
    }
    to {
      opacity: 0;
      transform: translateY(105dvh) rotate(var(--spin));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .trophy,
    .standings li {
      animation: none;
    }
  }
</style>

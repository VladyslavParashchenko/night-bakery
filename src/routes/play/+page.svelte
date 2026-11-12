<script lang="ts">
  import { onDestroy } from "svelte"
  import { goto } from "$app/navigation"
  import GameCard from "$lib/components/GameCard.svelte"
  import LogDialog from "$lib/components/LogDialog.svelte"
  import OpponentSeat from "$lib/components/OpponentSeat.svelte"
  import OvenView from "$lib/components/OvenView.svelte"
  import { CardDrag } from "$lib/components/card-drag.svelte"
  import {
    recordLaunch,
    takeLaunch,
    type LaunchPoint,
  } from "$lib/components/card-flight"
  import ChefDialog from "$lib/components/ChefDialog.svelte"
  import SpyDialog from "$lib/components/SpyDialog.svelte"
  import GameOverDialog from "$lib/components/GameOverDialog.svelte"
  import RulesDialog from "$lib/components/RulesDialog.svelte"
  import ScorchBanner from "$lib/components/ScorchBanner.svelte"
  import TopBar from "$lib/components/TopBar.svelte"
  import Button from "$lib/components/ui/Button.svelte"
  import Toast from "$lib/components/ui/Toast.svelte"
  import {
    canEndTurn,
    cardsShort,
    cookPlayError,
    legalOvens,
    ovenCapacity,
    playError,
  } from "$lib/game/engine"
  import { isVisible, sortHand } from "$lib/game/cards"
  import type { Card, GameState, VisibleCard } from "$lib/game/types"
  import { errorMessage } from "$lib/i18n/game-labels"
  import { m } from "$lib/i18n/messages"
  import { room } from "$lib/net/room.svelte"
  import { gameSounds } from "$lib/sound/game-sounds"
  import { sound } from "$lib/sound/sound.svelte"
  import { game } from "$lib/stores/game.svelte"

  let selectedId = $state<string | null>(null)
  // A Spy or Chef chosen for an oven, waiting for its dialog.
  let spy = $state<{ cardId: string; oven: number } | null>(null)
  let chef = $state<{ cardId: string; oven: number } | null>(null)
  let rulesOpen = $state(false)
  let logOpen = $state(false)
  // The results are tucked away so the final table can be seen.
  let peeking = $state(false)
  let resultsBar = $state<HTMLElement>()
  // The results dialog hides with the focus in it, so hand it to the bar.
  $effect(() => {
    if (peeking) resultsBar?.querySelector("button")?.focus()
  })
  $effect(() => {
    if (game.state?.pending?.kind !== "gameOver") peeking = false
  })

  // An online game that ended under us goes back to the lobby to say why.
  $effect(() => {
    if (!game.state) goto(room.problem ? "/lobby" : "/")
  })

  let previous: GameState | null = null
  $effect(() => {
    const state = game.state
    if (state && previous) {
      for (const name of gameSounds(previous, state, game.me)) sound.play(name)
    }
    previous = state
  })

  let errorKey = game.errorKey
  $effect(() => {
    if (game.errorKey === errorKey) return
    errorKey = game.errorKey
    sound.play("error")
  })

  // Our own hand is never hidden; the filter only narrows the type.

  function ovenTargets(state: GameState, card: Card | null): number[] {
    return card ? legalOvens(state, game.me, card) : []
  }

  function isMyTurn(state: GameState) {
    return !state.pending && state.current === game.me
  }

  function isPlayable(state: GameState, card: Card) {
    return legalOvens(state, game.me, card).length > 0
  }

  // The card flies into the oven from `from`.
  function playOn(
    state: GameState,
    card: VisibleCard,
    oven: number,
    from: Element | null,
  ) {
    const error = playError(state, game.me, card, oven)
    if (error) {
      game.showError(error)
      return
    }
    recordLaunch(card.id, from)
    playSelected(card, oven)
  }

  function handCard(cardId: string) {
    return document.querySelector(
      `[data-card="${CSS.escape(cardId)}"] .game-card`,
    )
  }

  // Ours fly from where they were played, others' from their seat.
  function launchPoint(oven: number, cardId: string): LaunchPoint | null {
    const own = takeLaunch(cardId)
    if (own || !game.state) return own
    const play = game.state.log.findLast(
      (entry) => "oven" in entry && entry.oven === oven,
    )
    if (!play || !("player" in play) || play.player === game.me) return null
    const seat = document.querySelector(`[data-seat="${play.player}"]`)
    if (!seat) return null
    const { left, top, height } = seat.getBoundingClientRect()
    return { left, top, width: height / 1.42 }
  }

  let ghost = $state<HTMLElement>()

  // Restored when the card is dropped outside the ovens.
  let selectedBeforeDrag: string | null = null
  const drag = new CardDrag({
    onstart: (card) => {
      const state = game.state
      if (!state || !isMyTurn(state) || !isPlayable(state, card)) return false
      selectedBeforeDrag = selectedId
      selectedId = card.id
      return true
    },
    ondrop: (card, oven) => {
      if (oven === null) {
        selectedId = selectedBeforeDrag
        return
      }
      selectedId = null
      if (game.state) playOn(game.state, card, oven, ghost ?? null)
    },
  })
  onDestroy(() => drag.cancel())

  function playSelected(card: VisibleCard, oven: number) {
    if (card.type === "number") {
      game.dispatch({
        type: "playNumber",
        player: game.me,
        cardId: card.id,
        oven,
      })
    } else if (card.cook === "spy") {
      spy = { cardId: card.id, oven }
    } else if (card.cook === "chef") {
      chef = { cardId: card.id, oven }
    } else {
      game.dispatch({
        type: "playCook",
        player: game.me,
        cardId: card.id,
        target: { cook: card.cook, oven },
      })
    }
  }
</script>

{#if game.state}
  {@const state = game.state}
  {@const me = state.players[game.me]}
  {@const hand = sortHand(me.hand.filter(isVisible))}
  {@const pending = state.pending}
  {@const myTurn = isMyTurn(state)}
  {@const carouselPick =
    pending?.kind === "carousel" &&
    pending.choices[game.me] === undefined &&
    me.hand.length > 0}
  {@const selected = myTurn
    ? (hand.find((c) => c.id === selectedId) ?? null)
    : null}
  {@const targets = ovenTargets(state, selected)}
  {@const opponents = [
    ...state.players.slice(game.me + 1),
    ...state.players.slice(0, game.me),
  ]}

  <main class="table">
    <TopBar
      deckCount={state.deck.length}
      discardCount={state.discard.length}
      onrules={() => (rulesOpen = true)}
      onlog={() => (logOpen = true)}
    />

    <section class="opponents">
      {#each opponents as player (player.id)}
        <OpponentSeat
          {player}
          active={state.current === player.id && !pending}
        />
      {/each}
    </section>

    <!-- The banner floats over the top of the screen; the line here keeps
         its height, so nothing below it jumps. -->
    {#if pending?.kind === "scorch"}
      <ScorchBanner
        offenderName={state.players[pending.offender].name}
        isHumanOffender={pending.offender === game.me}
        onslap={() => game.dispatch({ type: "slap", player: game.me })}
      />
    {/if}

    <section class="status">
      {#if pending?.kind === "scorch"}
        <p class="hint">{m.scorchWaiting()}</p>
      {:else if pending?.kind === "carousel"}
        <p class="hint strong">
          {carouselPick ? m.hintCarousel() : m.hintCarouselWait()}
        </p>
      {:else if myTurn}
        <p class="hint strong">
          {m.yourTurn()} ·
          {selected ? m.hintSelectOven() : m.hintSelectCard()}
        </p>
      {:else if !pending}
        <p class="hint">
          {m.botTurn({ name: state.players[state.current].name })}
        </p>
      {/if}
    </section>

    <!-- Ovens stand in one row where the screen is wide enough; otherwise
         in rows of three. On a phone four make a 2 × 2 square, or one row
         when the screen is too short for two. -->
    <section
      class="ovens"
      style:--ovens={state.ovens.length}
      style:--medium-columns={state.ovens.length <= 4 ? state.ovens.length : 3}
      style:--phone-columns={state.ovens.length === 4
        ? 2
        : Math.min(state.ovens.length, 3)}
    >
      {#each state.ovens as oven, index (index)}
        <OvenView
          {oven}
          {index}
          capacity={ovenCapacity(state)}
          lockedByName={oven.lockedBy === null
            ? null
            : state.players[oven.lockedBy].name}
          target={targets.includes(index)}
          launch={(cardId) => launchPoint(index, cardId)}
          over={drag.oven === index}
          clickable={selected !== null}
          onclick={() => {
            if (!selected) return
            playOn(state, selected, index, handCard(selected.id))
            selectedId = null
          }}
        />
      {/each}
    </section>

    <section class="me" class:active={myTurn}>
      <!-- Name, progress and the end turn button share one row. -->
      <div class="me-head">
        <div class="me-info">
          <strong>{me.name}</strong>
          <span class="muted">{m.cardsCount({ count: me.hand.length })}</span>
          {#if myTurn}
            <span class="muted">
              {m.turnProgress({
                played: state.turn.cardsPlayed,
              })}
            </span>
          {/if}
        </div>
        <Button
          disabled={!canEndTurn(state, game.me)}
          onclick={() => {
            selectedId = null
            game.dispatch({ type: "endTurn", player: game.me })
          }}
        >
          {myTurn && me.hand.length > 0 && cardsShort(state.turn) > 0
            ? m.actionEndTurnDraw({ count: cardsShort(state.turn) })
            : m.actionEndTurn()}
        </Button>
      </div>

      <div class="hand" style:--count={hand.length}>
        {#each hand as card (card.id)}
          <div
            class="hand-card"
            role="presentation"
            data-card={card.id}
            class:dragging={drag.card?.id === card.id}
            onpointerdown={(event) => drag.press(event, card)}
          >
            <GameCard
              {card}
              selected={selected?.id === card.id}
              dimmed={myTurn && !isPlayable(state, card)}
              disabled={!myTurn && !carouselPick}
              onclick={() => {
                if (carouselPick) {
                  game.dispatch({
                    type: "submitCarousel",
                    player: game.me,
                    cardId: card.id,
                  })
                  return
                }
                if (!myTurn) return
                if (card.type === "cook") {
                  const error = cookPlayError(state, game.me, card)
                  if (error) {
                    game.showError(error)
                    return
                  }
                }
                selectedId = selectedId === card.id ? null : card.id
              }}
            />
          </div>
        {/each}
      </div>
    </section>
  </main>

  {#if drag.card}
    <div
      bind:this={ghost}
      class="drag-ghost"
      style:transform={`translate(${drag.x}px, ${drag.y}px) rotate(-4deg)`}
      aria-hidden="true"
    >
      <GameCard card={drag.card} />
    </div>
  {/if}

  <Toast
    message={game.error ? errorMessage(game.error) : null}
    key={game.errorKey}
    onexpire={() => game.clearError()}
  />

  {#if spy}
    <SpyDialog
      open
      gameState={state}
      playerId={game.me}
      onclose={() => (spy = null)}
      onconfirm={(opponent) => {
        if (spy) {
          game.dispatch({
            type: "playCook",
            player: game.me,
            cardId: spy.cardId,
            target: { cook: "spy", oven: spy.oven, opponent },
          })
        }
        spy = null
      }}
    />
  {/if}

  {#if chef}
    <ChefDialog
      open
      onclose={() => (chef = null)}
      onconfirm={(pastry) => {
        if (chef) {
          game.dispatch({
            type: "playCook",
            player: game.me,
            cardId: chef.cardId,
            target: { cook: "chef", oven: chef.oven, pastry },
          })
        }
        chef = null
      }}
    />
  {/if}

  <RulesDialog open={rulesOpen} onclose={() => (rulesOpen = false)} />
  <LogDialog open={logOpen} {state} onclose={() => (logOpen = false)} />

  {#if pending?.kind === "gameOver"}
    {#if peeking}
      <div class="results-bar" bind:this={resultsBar}>
        <Button onclick={() => (peeking = false)}>{m.backToResults()}</Button>
      </div>
    {/if}
    <GameOverDialog
      hidden={peeking}
      gameState={state}
      winnerId={pending.winner}
      me={game.me}
      wins={game.wins}
      duration={game.endedAt - game.startedAt}
      ready={room.ready}
      onrematch={game.link?.role === "guest" ? undefined : () => game.rematch()}
      onready={game.link?.role === "guest" ? () => room.sendReady() : undefined}
      onpeek={() => (peeking = true)}
      onmenu={() => {
        game.quit()
        goto("/")
      }}
    />
  {/if}
{/if}

<style>
  /* The whole table fits the window: the ovens take whatever height is
     left after the seats, the status line and the hand. On a screen too
     small even for that, the page scrolls. */
  .table {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto 1fr auto;
    gap: 0.75rem;
    max-width: 80rem;
    min-height: 100dvh;
    margin: 0 auto;
    padding: 0.75rem 1rem 1rem;
  }
  /* Taps and drags on the table should not flash the text-selection
     highlight. */
  .table :global(::selection) {
    background: transparent;
  }
  .opponents {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10.625rem, 1fr));
    gap: 0.75rem;
  }
  .status {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 1.75rem;
  }
  .hint {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.35;
    color: var(--color-oven-muted);
  }
  .hint.strong {
    color: var(--color-oven-text);
    font-weight: 700;
  }
  .ovens {
    display: grid;
    grid-template-columns: repeat(var(--medium-columns), minmax(0, 1fr));
    align-items: center;
    gap: 1rem;
  }
  @media (min-width: 1200px) {
    .ovens {
      grid-template-columns: repeat(var(--ovens), minmax(0, 1fr));
    }
  }
  .me {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem 0.875rem;
    background: var(--color-oven-surface);
    border: 0.125rem solid var(--color-oven-border);
    border-radius: 1.25rem;
  }
  .me.active {
    border-color: var(--color-oven-accent);
  }
  .me-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .me-info {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.125rem 0.75rem;
    min-width: 0;
  }
  .me-head strong {
    font-size: 1.25rem;
  }
  .muted {
    color: var(--color-oven-muted);
    font-size: 1rem;
  }
  /* One row of cards: they spread out while there is room and overlap
     more as the hand grows, always leaving the corner value of each in
     sight. --card-w must match GameCard's width. Past that the row
     scrolls sideways. */
  .hand {
    --card-w: 6.25rem;
    --spread: 0.75rem;
    --peek: 1.75rem;
    display: flex;
    /* Scrolling sideways clips the row, so the padding leaves room for a
       picked card lifted 1rem with its ring and shadow. */
    padding: 1.5rem 0.25rem 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    /* Only a very long hand scrolls; a thin bar lets a mouse reach the end,
       since pressing a card starts a drag. */
    scrollbar-width: thin;
    container-type: inline-size;
  }
  .hand-card {
    position: relative;
    flex-shrink: 0;
  }
  .hand-card:not(:first-child) {
    margin-left: clamp(
      calc(var(--peek) - var(--card-w)),
      calc((100cqw - var(--card-w)) / (var(--count) - 1) - var(--card-w)),
      var(--spread)
    );
  }
  /* The picked card comes to the front. */
  .hand-card:has(:global(.selected)) {
    z-index: 1;
  }
  .hand-card.dragging {
    opacity: 0.3;
  }
  .drag-ghost {
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--z-drag);
    pointer-events: none;
    filter: drop-shadow(0 1rem 1.5rem rgb(58 31 15 / 0.35));
  }
  .results-bar {
    position: fixed;
    right: 0;
    bottom: 1rem;
    left: 0;
    z-index: var(--z-results);
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .results-bar :global(.ui-button) {
    pointer-events: auto;
    box-shadow: 0 0.75rem 2rem rgb(58 31 15 / 0.3);
  }
  @media (max-width: 600px) {
    /* Seats shrink on phones, so up to four fit side by side. */
    .opponents {
      grid-template-columns: repeat(auto-fit, minmax(4.75rem, 1fr));
      gap: 0.375rem;
    }
    .ovens {
      grid-template-columns: repeat(var(--phone-columns), minmax(0, 1fr));
      gap: 0.5rem;
    }
    .table {
      gap: 0.5rem;
      padding: 0.5rem 0.75rem 0.75rem;
    }
    .hint {
      font-size: 0.95rem;
    }
    /* Two lines, so a long hint does not change the height. */
    .status {
      min-height: 2.6rem;
    }
    .me {
      padding: 0.5rem 0.625rem 0.625rem;
    }
    .me-head strong {
      font-size: 1.05rem;
    }
    .muted {
      font-size: 0.85rem;
    }
    .hand {
      --card-w: 4.375rem;
      --spread: 0.375rem;
      --peek: 1.5rem;
      padding-top: 1.375rem;
    }
  }
  @media (max-width: 600px) and (max-height: 759px) {
    .ovens {
      grid-template-columns: repeat(min(var(--ovens), 4), minmax(0, 1fr));
      gap: 0.375rem;
    }
    /* Four in a row are narrow: trim the oven's padding so a card still
       fits its chamber. */
    .ovens :global(.oven) {
      padding-inline: 0.25rem;
    }
    .ovens :global(.chamber) {
      padding-inline: 0;
    }
  }
</style>

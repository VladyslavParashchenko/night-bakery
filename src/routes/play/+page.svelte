<script lang="ts">
  import { onDestroy } from "svelte"
  import { goto } from "$app/navigation"
  import GameCard from "$lib/components/GameCard.svelte"
  import GameLog from "$lib/components/GameLog.svelte"
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
    playError,
  } from "$lib/game/engine"
  import { isVisible } from "$lib/game/cards"
  import {
    PASTRIES,
    type Card,
    type GameState,
    type VisibleCard,
  } from "$lib/game/types"
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
  function sortHand(hand: Card[]) {
    const rank = (card: VisibleCard) =>
      (card.pastry ? PASTRIES.indexOf(card.pastry) : 10) +
      (card.type === "cook" ? 1000 : card.value * 10)
    return hand.filter(isVisible).sort((a, b) => rank(a) - rank(b))
  }

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
  {@const hand = sortHand(me.hand)}
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
    />

    <section class="opponents">
      {#each opponents as player (player.id)}
        <OpponentSeat
          {player}
          active={state.current === player.id && !pending}
        />
      {/each}
    </section>

    <section class="status">
      {#if pending?.kind === "scorch"}
        <ScorchBanner
          offenderName={state.players[pending.offender].name}
          isHumanOffender={pending.offender === game.me}
          onslap={() => game.dispatch({ type: "slap", player: game.me })}
        />
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

    <section class="ovens">
      {#each state.ovens as oven, index (index)}
        <OvenView
          {oven}
          {index}
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
      <div class="me-head">
        <div>
          <strong>{me.name}</strong>
          <span class="muted">{m.cardsCount({ count: me.hand.length })}</span>
        </div>
        {#if myTurn}
          <span class="muted">
            {m.turnProgress({
              played: state.turn.cardsPlayed,
            })}
          </span>
        {/if}
      </div>

      <div class="hand">
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

      <div class="actions">
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
    </section>

    <GameLog {state} />
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

  {#if pending?.kind === "gameOver"}
    <GameOverDialog
      players={state.players}
      winnerId={pending.winner}
      onrematch={game.link?.role === "guest" ? undefined : () => game.rematch()}
      onmenu={() => {
        game.quit()
        goto("/")
      }}
    />
  {/if}
{/if}

<style>
  .table {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 16px 40px;
  }
  .opponents {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
  }
  .status {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 32px;
  }
  .hint {
    margin: 0;
    font-size: 1.15rem;
    color: var(--color-oven-muted);
  }
  .hint.strong {
    color: var(--color-oven-text);
    font-weight: 700;
  }
  .ovens {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .me {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
    background: var(--color-oven-surface);
    border: 2px solid var(--color-oven-border);
    border-radius: 20px;
  }
  .me.active {
    border-color: var(--color-oven-accent);
  }
  .me-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }
  .me-head strong {
    margin-right: 10px;
    font-size: 1.25rem;
  }
  .muted {
    color: var(--color-oven-muted);
    font-size: 1rem;
  }
  .hand {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 18px;
  }
  .hand-card.dragging {
    opacity: 0.3;
  }
  .drag-ghost {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    pointer-events: none;
    filter: drop-shadow(0 16px 24px rgb(58 31 15 / 0.35));
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
  @media (max-width: 600px) {
    .ovens {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .me {
      gap: 14px;
      padding: 12px;
    }
    .hand {
      gap: 8px;
    }
    .actions {
      display: grid;
    }
  }
</style>

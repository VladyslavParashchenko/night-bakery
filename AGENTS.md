# Night Bakery development guide

Full game rules live in `RULES-UA.md` (Ukrainian) and `RULES-EN.md` (English).
`RulesList.svelte` renders them as-is on the rules page and in the in-game
dialog, so editing these files updates the game.

## Stack

- SvelteKit with Svelte 5 runes and TypeScript, static adapter, `vite-pwa`.
- Tailwind CSS plus scoped component styles. Theme tokens live in
  `src/app.css`: light by default, dark via `prefers-color-scheme` or
  `data-theme="dark"` on `<html>`. Card text uses the fixed `--color-ink*`
  tokens so it stays readable on suit colours in both themes.
- Ukrainian and English via a small in-house module, `src/lib/i18n/messages.ts`:
  `m.key({ param })` fills `{param}` placeholders from `messages/uk.json` and
  `messages/en.json`. The locale is picked once at startup; `setLocale` saves
  it and reloads the page.
- Vitest for unit tests (`tests/unit`); the Svelte plugin is enabled so
  `.svelte.ts` stores can be tested.

## Project structure

- `src/lib/game` is the pure rules engine. It has no Svelte or browser
  dependencies.
  - `types.ts` holds the constants, state, actions and error codes.
  - `engine.ts` exposes `createGame` and `applyAction(state, action)`, which
    returns a new state or an error code. All randomness goes through the
    seeded `rng` stored in the state. `playError` / `legalOvens` explain and
    list where a card may go; the UI uses them for highlighting.
    `viewFor(state, playerId)` hides what that player may not see (other
    hands, the deck, the seed) behind `HiddenCard`s; never send a remote
    player anything else. Components that draw cards take `VisibleCard`.
  - `bot.ts` exposes `chooseBotAction(state, botId)`, which returns the bot's
    next single action.
- `src/lib/stores/game.svelte.ts` holds the current game in memory (nothing
  is persisted) and schedules bot moves and the scorch window with timers.
  Player actions go through `dispatch`, which reports errors as a toast;
  bot and timer actions never do. `game.me` is the seat this device plays.
- `src/lib/net/room.svelte.ts` runs online games peer to peer over WebRTC
  (PeerJS and its public signalling server). The host's browser runs the game
  through the store and sends each guest `viewFor` its seat; guests only send
  actions, which the host checks with the engine for the sender's seat. A
  guest who drops out is handed to a bot; if the host leaves, the game ends.
  Both sides ping, and a long silence counts as leaving, because WebRTC does
  not always report a vanished peer.
- `src/lib/theme/theme.svelte.ts` stores the chosen theme; `src/app.html`
  applies it before first paint.
- `src/lib/i18n/game-labels.ts` maps cards, log entries and error codes to
  messages.
- Routes: `/` is the menu, `/lobby` creates or joins an online room,
  `/play` is the table, `/rules` is the rules page.
  The table is split into components under `src/lib/components`.

## Conventions

- Every rule change goes into `engine.ts` together with a unit test. UI code
  never mutates the game state directly.
- Add user-facing strings to both message files.
- The Spy cook is `spy` in code (it used to be `peek`).
- Run `npm run quality` before handing work off.
- Git hooks are managed by prek (`.pre-commit-config.yaml`, installed by
  `npm install`): Prettier and ESLint on commit, `svelte-check` and tests on
  push. Commit messages follow Conventional Commits (checked by commitlint).
- The Vite dev server can cache a half-written module while files are being
  rewritten; if the page goes blank with a missing-export error, restart
  `npm run dev` (add `--force` after changing `vite.config.ts`).

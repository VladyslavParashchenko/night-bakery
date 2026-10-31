<p align="center">
  <img src="static/brand/logo-en.webp" alt="Night Bakery" width="360" />
</p>

A cozy shedding card game about three hot ovens. Play your pastries into the
ovens, use cooks to scrub, lock and shuffle things around, and be the first to
empty your hand.

- 2 to 5 players: against bots on one device, or online with friends.
- Ukrainian and English, light and dark themes.
- Installs as a PWA and works offline (except online games).

Full rules: [English](RULES-EN.md) · [Українською](RULES-UA.md).
What changed: [English](CHANGELOG-EN.md) · [Українською](CHANGELOG-UA.md).

## Running locally

You need Node.js 20.19+ or 22.12+.

```sh
npm install      # also installs the git hooks
npm run dev      # http://localhost:5173
```

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run build`   | Builds the static site into `build/`                 |
| `npm run preview` | Serves the production build                          |
| `npm run test`    | Runs the unit tests (Vitest)                         |
| `npm run quality` | Formatting, lint, type check and tests; run it first |

## How it works

- SvelteKit with Svelte 5 and TypeScript, built as a static site, so any
  static host (for example Cloudflare Pages) can serve `build/`.
- The rules engine in `src/lib/game` is pure TypeScript with seeded
  randomness, so games are reproducible and easy to test.
- Online games are peer to peer over WebRTC via [PeerJS](https://peerjs.com).
  The host's browser runs the game and sends each guest only what that player
  may see. There is no game server; the public PeerJS server only introduces
  the players to each other.

[AGENTS.md](AGENTS.md) has the full development guide: project structure,
conventions and how to make changes.

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).
Every rule change goes into the engine together with a unit test, and every
player-facing change gets an entry in both changelogs.

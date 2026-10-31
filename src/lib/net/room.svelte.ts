import type { DataConnection, Peer } from "peerjs"
import { viewFor } from "$lib/game/engine"
import {
  MAX_PLAYERS,
  type Action,
  type GameError,
  type GameState,
  type PlayerSetup,
} from "$lib/game/types"
import { m } from "$lib/i18n/messages"
import { game } from "$lib/stores/game.svelte"

// Peer ids share the public PeerJS server, hence the prefix.
const ID_PREFIX = "night-bakery-"
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 5
const NAME_LENGTH = 20

// WebRTC may never report a vanished peer, so both sides ping and a long
// silence counts as leaving. It also bounds how long joining may take.
const PING_MS = 3000
const SILENCE_LIMIT_MS = 15000

export type RoomStatus = "idle" | "connecting" | "lobby" | "playing"
export type RoomProblem =
  "notFound" | "full" | "started" | "hostLeft" | "network"

type GuestMessage =
  | { type: "hello"; name: string }
  | { type: "action"; action: Action }
  | { type: "ping" }

type HostMessage =
  | { type: "lobby"; names: string[] }
  | { type: "state"; state: GameState; me: number }
  | { type: "error"; error: GameError }
  | { type: "refused"; reason: "full" | "started" }
  | { type: "ping" }

// Everything but closeScorch, which only the host's timer sends.
const GUEST_ACTIONS: Action["type"][] = [
  "playNumber",
  "playCook",
  "submitCarousel",
  "endTurn",
  "slap",
]

type Guest = {
  conn: DataConnection
  name: string
  seat: number | null
  lastSeen: number
}

function newCode() {
  return Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("")
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function cleanName(name: unknown) {
  return (
    String(name ?? "")
      .trim()
      .slice(0, NAME_LENGTH) || m.menuDefaultName()
  )
}

async function createPeer(id?: string) {
  const { Peer } = await import("peerjs")
  return id ? new Peer(id) : new Peer()
}

class Room {
  status = $state<RoomStatus>("idle")
  role = $state<"host" | "guest" | null>(null)
  code = $state("")
  names = $state<string[]>([])
  problem = $state<RoomProblem | null>(null)
  #peer: Peer | null = null
  #guests: Guest[] = []
  #host: DataConnection | null = null
  #hostSeen = 0
  #ticker: ReturnType<typeof setInterval> | null = null
  // Bumped by leave(), so a peer that loads after leaving is discarded.
  #session = 0

  async host(name: string) {
    this.leave()
    const session = this.#session
    this.problem = null
    this.role = "host"
    this.status = "connecting"
    this.names = [cleanName(name)]
    const code = newCode()
    // The PeerJS chunk can fail to load (offline, or a stale dev bundle).
    const peer = await createPeer(ID_PREFIX + code).catch(() => null)
    if (session !== this.#session) {
      peer?.destroy()
      return
    }
    if (!peer) return this.#fail("network")
    this.#peer = peer
    peer.on("open", () => {
      if (this.#peer !== peer) return
      this.code = code
      this.status = "lobby"
      this.#startTicking()
    })
    peer.on("connection", (conn) => {
      if (this.#peer === peer) this.#welcome(conn)
    })
    peer.on("error", (error) => {
      if (this.#peer !== peer) return
      // Someone already holds this code; try another.
      if (error.type === "unavailable-id") this.host(name)
      // Once open, the server is only needed to let new guests in.
      else if (this.status === "connecting") this.#fail("network")
    })
  }

  async join(code: string, name: string) {
    this.leave()
    const session = this.#session
    this.problem = null
    this.role = "guest"
    this.status = "connecting"
    this.code = code
    this.#hostSeen = Date.now()
    this.#startTicking()
    // The PeerJS chunk can fail to load (offline, or a stale dev bundle).
    const peer = await createPeer().catch(() => null)
    if (session !== this.#session) {
      peer?.destroy()
      return
    }
    if (!peer) return this.#fail("network")
    this.#peer = peer
    peer.on("open", () => {
      if (this.#peer !== peer) return
      const conn = peer.connect(ID_PREFIX + code, {
        reliable: true,
        serialization: "json",
      })
      this.#host = conn
      conn.on("open", () => {
        conn.send({
          type: "hello",
          name: cleanName(name),
        } satisfies GuestMessage)
      })
      conn.on("data", (data) => {
        if (this.#host !== conn) return
        this.#hostSeen = Date.now()
        this.#fromHost(data as HostMessage)
      })
      conn.on("close", () => {
        if (this.#host === conn) this.#hostLeft()
      })
      conn.on("error", () => {
        if (this.#host === conn) this.#hostLeft()
      })
    })
    peer.on("error", (error) => {
      if (this.#peer !== peer) return
      if (error.type === "peer-unavailable") this.#fail("notFound")
      // Once connected, the host link no longer needs the server.
      else if (this.status === "connecting") this.#fail("network")
    })
  }

  start(bots: PlayerSetup[]) {
    if (this.role !== "host" || this.status !== "lobby") return
    this.#guests.forEach((guest, i) => (guest.seat = i + 1))
    game.connect({
      role: "host",
      publish: (state) => this.#publish(state),
      close: () => this.leave(),
    })
    game.start([
      { name: this.names[0], isBot: false },
      ...this.#guests.map((guest) => ({ name: guest.name, isBot: false })),
      ...bots,
    ])
    this.status = "playing"
  }

  get canStart() {
    return (
      this.role === "host" && this.status === "lobby" && this.names.length > 1
    )
  }

  get seatsLeft() {
    return MAX_PLAYERS - this.names.length
  }

  // Leaving keeps `problem`, so the lobby can still say what went wrong.
  leave() {
    this.#session++
    if (this.#ticker) clearInterval(this.#ticker)
    this.#ticker = null
    const peer = this.#peer
    this.#peer = null
    this.#host = null
    this.#guests = []
    peer?.destroy()
    this.status = "idle"
    this.role = null
    this.code = ""
    this.names = []
    if (game.link) game.quit()
  }

  #fail(problem: RoomProblem) {
    this.problem = problem
    this.leave()
  }

  #hostLeft() {
    this.#fail(this.status === "connecting" ? "network" : "hostLeft")
  }

  #startTicking() {
    if (this.#ticker) clearInterval(this.#ticker)
    this.#ticker = setInterval(() => this.#tick(), PING_MS)
  }

  #tick() {
    const now = Date.now()
    if (this.role === "host") {
      for (const guest of this.#guests) {
        if (now - guest.lastSeen > SILENCE_LIMIT_MS) {
          guest.conn.close()
          this.#guestLeft(guest.conn)
        } else if (guest.conn.open) {
          guest.conn.send({ type: "ping" } satisfies HostMessage)
        }
      }
    } else if (this.role === "guest") {
      if (now - this.#hostSeen > SILENCE_LIMIT_MS) this.#hostLeft()
      else if (this.#host?.open) {
        this.#host.send({ type: "ping" } satisfies GuestMessage)
      }
    }
  }

  #welcome(conn: DataConnection) {
    conn.on("data", (data) => this.#fromGuest(conn, data as GuestMessage))
    conn.on("close", () => this.#guestLeft(conn))
    conn.on("error", () => this.#guestLeft(conn))
    // Not a player until it says hello.
    setTimeout(() => {
      if (!this.#guests.some((g) => g.conn === conn)) conn.close()
    }, SILENCE_LIMIT_MS)
  }

  #fromGuest(conn: DataConnection, message: GuestMessage) {
    const guest = this.#guests.find((g) => g.conn === conn)
    if (guest) guest.lastSeen = Date.now()
    if (message?.type === "hello" && !guest) {
      const refusal =
        this.status === "playing"
          ? "started"
          : this.names.length >= MAX_PLAYERS
            ? "full"
            : null
      if (refusal) {
        conn.send({ type: "refused", reason: refusal } satisfies HostMessage)
        setTimeout(() => conn.close(), 500)
        return
      }
      this.#guests.push({
        conn,
        name: cleanName(message.name),
        seat: null,
        lastSeen: Date.now(),
      })
      this.#syncLobby()
      return
    }
    if (message?.type === "action" && guest?.seat != null) {
      if (!GUEST_ACTIONS.includes(message.action?.type)) return
      // Guests only ever act for their own seat.
      const action = { ...message.action, player: guest.seat } as Action
      let error: GameError | null
      try {
        error = game.applyRemote(action)
      } catch {
        error = "invalidTarget"
      }
      if (error) conn.send({ type: "error", error } satisfies HostMessage)
    }
  }

  #guestLeft(conn: DataConnection) {
    const guest = this.#guests.find((g) => g.conn === conn)
    if (!guest) return
    this.#guests = this.#guests.filter((g) => g !== guest)
    if (this.status === "playing") {
      if (guest.seat != null) game.replaceWithBot(guest.seat)
    } else {
      this.#syncLobby()
    }
  }

  #syncLobby() {
    this.names = [this.names[0], ...this.#guests.map((g) => g.name)]
    for (const guest of this.#guests) {
      guest.conn.send({
        type: "lobby",
        names: this.names,
      } satisfies HostMessage)
    }
  }

  #publish(state: GameState) {
    for (const guest of this.#guests) {
      if (guest.seat == null || !guest.conn.open) continue
      guest.conn.send({
        type: "state",
        state: viewFor(state, guest.seat),
        me: guest.seat,
      } satisfies HostMessage)
    }
  }

  #fromHost(message: HostMessage) {
    switch (message.type) {
      case "lobby":
        this.names = message.names
        this.status = "lobby"
        return
      case "state":
        if (!game.link) {
          game.quit()
          game.connect({
            role: "guest",
            send: (action) =>
              this.#host?.send({
                type: "action",
                action,
              } satisfies GuestMessage),
            close: () => this.leave(),
          })
        }
        game.receive(message.state, message.me)
        this.status = "playing"
        return
      case "error":
        game.showError(message.error)
        return
      case "refused":
        this.#fail(message.reason)
        return
      case "ping":
        return
    }
  }
}

export const room = new Room()

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createGame, viewFor } from "$lib/game/engine"
import { room } from "$lib/net/room.svelte"
import { game } from "$lib/stores/game.svelte"

// A stand-in for PeerJS: tests fire the events a real peer would.
const fake = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void

  class Emitter {
    handlers = new Map<string, Handler[]>()
    on(event: string, handler: Handler) {
      this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler])
    }
    emit(event: string, ...args: unknown[]) {
      for (const handler of this.handlers.get(event) ?? []) handler(...args)
    }
  }

  class FakeConn extends Emitter {
    open = false
    sent: unknown[] = []
    send(data: unknown) {
      this.sent.push(data)
    }
    close() {
      this.open = false
    }
    connect() {
      this.open = true
      this.emit("open")
    }
  }

  class FakePeer extends Emitter {
    static instances: FakePeer[] = []
    // Stands in for PeerJS failing to load.
    static broken = false
    destroyed = false
    conns: FakeConn[] = []
    constructor() {
      if (FakePeer.broken) throw new TypeError("Failed to fetch")
      super()
      FakePeer.instances.push(this)
    }
    connect() {
      const conn = new FakeConn()
      this.conns.push(conn)
      return conn
    }
    destroy() {
      this.destroyed = true
    }
  }

  return { FakeConn, FakePeer }
})

vi.mock("peerjs", () => ({ Peer: fake.FakePeer }))

const lastPeer = () => fake.FakePeer.instances.at(-1)!

beforeEach(() => {
  vi.useFakeTimers()
  fake.FakePeer.instances = []
  fake.FakePeer.broken = false
})
afterEach(() => {
  room.leave()
  room.problem = null
  vi.useRealTimers()
})

describe("room", () => {
  it("drops a peer that finishes loading after the room was left", async () => {
    const hosting = room.host("Host")
    room.leave()
    await hosting
    expect(lastPeer().destroyed).toBe(true)

    lastPeer().emit("open")
    expect(room.status).toBe("idle")
  })

  it("keeps a guest playing when the signalling server drops", async () => {
    await room.join("ABCDE", "Guest")
    lastPeer().emit("open")
    const conn = lastPeer().conns[0]
    conn.connect()
    const state = createGame(
      [
        { name: "Host", isBot: false },
        { name: "Guest", isBot: false },
      ],
      3,
    )
    conn.emit("data", { type: "state", state: viewFor(state, 1), me: 1 })
    expect(room.status).toBe("playing")

    lastPeer().emit("error", { type: "network" })
    expect(room.status).toBe("playing")
    expect(game.me).toBe(1)
  })

  it("reports a network problem when PeerJS fails to load", async () => {
    fake.FakePeer.broken = true
    await room.host("Host")
    expect(room.status).toBe("idle")
    expect(room.problem).toBe("network")

    room.problem = null
    await room.join("ABCDE", "Guest")
    expect(room.status).toBe("idle")
    expect(room.problem).toBe("network")
  })

  it("gives up joining when the host never answers", async () => {
    await room.join("ABCDE", "Guest")
    lastPeer().emit("open")
    vi.advanceTimersByTime(20000)
    expect(room.status).toBe("idle")
    expect(room.problem).toBe("network")
  })

  it("tells a waiting guest that the host left", async () => {
    await room.join("ABCDE", "Guest")
    lastPeer().emit("open")
    const conn = lastPeer().conns[0]
    conn.connect()
    conn.emit("data", { type: "lobby", names: ["Host", "Guest"] })
    conn.emit("close")
    expect(room.problem).toBe("hostLeft")
  })

  it("hands a guest who went silent to a bot", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const conn = new fake.FakeConn()
    conn.open = true
    lastPeer().emit("connection", conn)
    conn.emit("data", { type: "hello", name: "Guest" })
    expect(room.names).toEqual(["Host", "Guest"])

    room.start([])
    expect(game.state?.players[1].isBot).toBe(false)
    vi.advanceTimersByTime(20000)
    expect(game.state?.players[1].isBot).toBe(true)
    expect(room.status).toBe("playing")
  })

  it("starts the table the host set up and shows it to guests", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const conn = new fake.FakeConn()
    conn.open = true
    lastPeer().emit("connection", conn)
    conn.emit("data", { type: "hello", name: "Guest", tables: true })
    expect(room.outdated).toEqual([])

    room.setOptions({ ovens: 6, ovenCapacity: 3 })
    expect(conn.sent.at(-1)).toEqual({
      type: "lobby",
      names: ["Host", "Guest"],
      options: { ovens: 6, ovenCapacity: 3 },
    })
    room.start([])
    expect(game.state?.ovens).toHaveLength(6)
    expect(game.state?.ovenCapacity).toBe(3)
  })

  it("names guests too old to see a custom table", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const conn = new fake.FakeConn()
    conn.open = true
    lastPeer().emit("connection", conn)
    conn.emit("data", { type: "hello", name: "Old" })
    expect(room.outdated).toEqual(["Old"])
  })

  it("shows a guest the host's table, standard from an older host", async () => {
    await room.join("ABCDE", "Guest")
    lastPeer().emit("open")
    const conn = lastPeer().conns[0]
    conn.connect()
    expect(conn.sent[0]).toMatchObject({ type: "hello", tables: true })
    conn.emit("data", {
      type: "lobby",
      names: ["Host", "Guest"],
      options: { ovens: 4, ovenCapacity: 7 },
    })
    expect(room.options).toEqual({ ovens: 4, ovenCapacity: 7 })
    conn.emit("data", { type: "lobby", names: ["Host", "Guest"] })
    expect(room.options).toEqual({ ovens: 3, ovenCapacity: 5 })
  })

  it("plays a guest's action for the guest's own seat only", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const conn = new fake.FakeConn()
    conn.open = true
    lastPeer().emit("connection", conn)
    conn.emit("data", { type: "hello", name: "Guest" })
    room.start([])

    // Seat 0 is on turn; a guest claiming to be seat 0 still acts as seat 1.
    conn.emit("data", {
      type: "action",
      action: { type: "endTurn", player: 0 },
    })
    expect(game.state?.current).toBe(0)
    expect(conn.sent.at(-1)).toEqual({ type: "error", error: "notYourTurn" })

    conn.emit("data", { type: "action", action: { type: "closeScorch" } })
    expect(conn.sent.at(-1)).toEqual({ type: "error", error: "notYourTurn" })
  })

  it("tells everyone who wants a rematch until it starts", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const conn = new fake.FakeConn()
    conn.open = true
    lastPeer().emit("connection", conn)
    conn.emit("data", { type: "hello", name: "Guest" })
    room.start([])

    // Only a finished game takes requests.
    conn.emit("data", { type: "ready" })
    expect(room.ready).toEqual([])

    game.state = { ...game.state!, pending: { kind: "gameOver", winner: 0 } }
    conn.emit("data", { type: "ready" })
    expect(room.ready).toEqual([1])
    expect(conn.sent.at(-1)).toEqual({ type: "ready", seats: [1] })

    game.rematch()
    expect(room.ready).toEqual([])
  })

  it("shows a guest the rematch requests the host has seen", async () => {
    await room.join("ABCDE", "Guest")
    lastPeer().emit("open")
    const conn = lastPeer().conns[0]
    conn.connect()
    const state = createGame(
      [
        { name: "Host", isBot: false },
        { name: "Guest", isBot: false },
      ],
      3,
    )
    const over = { ...state, pending: { kind: "gameOver" as const, winner: 0 } }
    conn.emit("data", { type: "state", state: viewFor(over, 1), me: 1 })

    room.sendReady()
    expect(conn.sent.at(-1)).toEqual({ type: "ready" })
    // Nothing shows until the host confirms.
    expect(room.ready).toEqual([])
    conn.emit("data", { type: "ready", seats: [1] })
    expect(room.ready).toEqual([1])

    const before = room.ready
    conn.emit("data", { type: "state", state: viewFor(over, 1), me: 1 })
    expect(room.ready).toBe(before)

    conn.emit("data", { type: "state", state: viewFor(state, 1), me: 1 })
    expect(room.ready).toEqual([])
  })

  it("tells nobody about rematches when a guest leaves mid-game", async () => {
    await room.host("Host")
    lastPeer().emit("open")
    const stays = new fake.FakeConn()
    const leaves = new fake.FakeConn()
    for (const [conn, name] of [
      [stays, "Stays"],
      [leaves, "Leaves"],
    ] as const) {
      conn.open = true
      lastPeer().emit("connection", conn)
      conn.emit("data", { type: "hello", name })
    }
    room.start([])

    leaves.emit("close")
    expect(game.state?.players[2].isBot).toBe(true)
    expect(
      stays.sent.some((m) => (m as { type: string }).type === "ready"),
    ).toBe(false)
  })
})

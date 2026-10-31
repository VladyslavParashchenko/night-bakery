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
})

import type { SoundName } from "$lib/sound/game-sounds"

const STORAGE_KEY = "night-bakery:sound"

function storedEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return true
  }
}

type Voice = {
  at?: number
  duration: number
  gain: number
}
type Tone = Voice & {
  type: OscillatorType
  frequency: number
  // Glides to this frequency over the duration.
  to?: number
}
type Noise = Voice & {
  filter: BiquadFilterType
  frequency: number
}

// Every sound is synthesised, so the game needs no audio files.
const RECIPES: Record<SoundName, (Tone | Noise)[]> = {
  place: [
    { filter: "bandpass", frequency: 1800, duration: 0.08, gain: 0.5 },
    { type: "triangle", frequency: 180, to: 80, duration: 0.08, gain: 0.35 },
  ],
  draw: [{ filter: "highpass", frequency: 2500, duration: 0.16, gain: 0.25 }],
  burn: [
    { filter: "lowpass", frequency: 700, duration: 0.7, gain: 0.6 },
    { type: "sawtooth", frequency: 110, to: 45, duration: 0.6, gain: 0.12 },
    { at: 0.1, filter: "bandpass", frequency: 3200, duration: 0.03, gain: 0.4 },
    {
      at: 0.27,
      filter: "bandpass",
      frequency: 2600,
      duration: 0.03,
      gain: 0.3,
    },
    {
      at: 0.41,
      filter: "bandpass",
      frequency: 3600,
      duration: 0.03,
      gain: 0.3,
    },
  ],
  scorch: [
    { type: "square", frequency: 880, duration: 0.09, gain: 0.12 },
    { at: 0.12, type: "square", frequency: 1175, duration: 0.12, gain: 0.12 },
  ],
  slap: [
    { filter: "lowpass", frequency: 2500, duration: 0.12, gain: 0.8 },
    { type: "sine", frequency: 150, to: 55, duration: 0.14, gain: 0.6 },
  ],
  turn: [
    { type: "sine", frequency: 660, duration: 0.3, gain: 0.25 },
    { at: 0.12, type: "sine", frequency: 880, duration: 0.4, gain: 0.25 },
  ],
  win: [523, 659, 784, 1047].map((frequency, i): Tone => ({
    at: i * 0.11,
    type: "triangle",
    frequency,
    duration: i === 3 ? 0.6 : 0.2,
    gain: 0.3,
  })),
  lose: [392, 330, 262].map((frequency, i): Tone => ({
    at: i * 0.18,
    type: "triangle",
    frequency,
    duration: i === 2 ? 0.6 : 0.25,
    gain: 0.25,
  })),
  error: [{ type: "square", frequency: 160, duration: 0.12, gain: 0.08 }],
}

class SoundStore {
  enabled = $state(storedEnabled())
  #context: AudioContext | null = null
  #noise: AudioBuffer | null = null

  toggle() {
    this.enabled = !this.enabled
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled ? "on" : "off")
    } catch {
      // Remembering the choice is only a convenience.
    }
  }

  // Browsers only let audio start from a user gesture, so the first tap or
  // key press creates the context that later sounds, even bots', play on.
  unlock() {
    if (typeof AudioContext === "undefined") return
    this.#context ??= new AudioContext()
    if (this.#context.state === "suspended") void this.#context.resume()
  }

  play(name: SoundName) {
    const context = this.#context
    if (!this.enabled || context?.state !== "running") return
    const start = context.currentTime
    for (const voice of RECIPES[name]) {
      const at = start + (voice.at ?? 0)
      const end = at + voice.duration
      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0, at)
      envelope.gain.linearRampToValueAtTime(voice.gain, at + 0.005)
      envelope.gain.exponentialRampToValueAtTime(0.001, end)
      envelope.connect(context.destination)

      let source: AudioScheduledSourceNode
      if ("type" in voice) {
        const oscillator = context.createOscillator()
        oscillator.type = voice.type
        oscillator.frequency.setValueAtTime(voice.frequency, at)
        if (voice.to)
          oscillator.frequency.exponentialRampToValueAtTime(voice.to, end)
        oscillator.connect(envelope)
        source = oscillator
      } else {
        const noise = context.createBufferSource()
        noise.buffer = this.#noiseBuffer(context)
        const filter = context.createBiquadFilter()
        filter.type = voice.filter
        filter.frequency.value = voice.frequency
        noise.connect(filter).connect(envelope)
        source = noise
      }
      source.start(at)
      source.stop(end)
    }
  }

  #noiseBuffer(context: AudioContext) {
    if (!this.#noise) {
      this.#noise = context.createBuffer(
        1,
        context.sampleRate,
        context.sampleRate,
      )
      const data = this.#noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    return this.#noise
  }
}

export const sound = new SoundStore()

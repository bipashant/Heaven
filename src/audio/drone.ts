// A synthesised tanpura-like drone (Pa–Sa–Sa–Sa cycle) and temple bells.
// Everything is generated with the Web Audio API, so there are no audio files.

const SA = 130.81 // C3

class Drone {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private timer: number | null = null
  private step = 0
  private tone = 0.5

  start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.filter = this.ctx.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.value = 1800
      this.filter.Q.value = 0.6
      const delay = this.ctx.createDelay(1)
      delay.delayTime.value = 0.33
      const fb = this.ctx.createGain()
      fb.gain.value = 0.32
      const wet = this.ctx.createGain()
      wet.gain.value = 0.35
      this.filter.connect(this.master)
      this.filter.connect(delay)
      delay.connect(fb).connect(delay)
      delay.connect(wet).connect(this.master)
      this.master.connect(this.ctx.destination)
      this.pad()
    }
    void this.ctx.resume()
    this.master!.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master!.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2)
    if (this.timer === null) this.timer = window.setInterval(() => this.pluck(), 1150)
  }

  stop() {
    if (!this.ctx || !this.master) return
    this.master.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2)
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** 0 = depths (dark, muffled) … 1 = highest abodes (bright, shimmering). */
  setTone(t: number) {
    this.tone = t
    if (!this.ctx || !this.filter) return
    this.filter.frequency.linearRampToValueAtTime(400 + t * t * 3200, this.ctx.currentTime + 2.5)
  }

  bell() {
    if (!this.ctx || !this.filter || this.timer === null) return
    const now = this.ctx.currentTime
    const f = SA * 4 * (1 + this.tone * 0.5)
    for (const [ratio, amp, dec] of [
      [1, 0.12, 5],
      [2.76, 0.05, 3],
      [5.4, 0.03, 2],
      [8.93, 0.015, 1.2],
    ]) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f * ratio
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(amp, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + dec)
      o.connect(g).connect(this.master!)
      o.start(now)
      o.stop(now + dec + 0.1)
    }
  }

  private pad() {
    if (!this.ctx || !this.filter) return
    for (const [freq, amp] of [
      [SA / 2, 0.05],
      [SA, 0.035],
      [SA * 1.5, 0.02],
    ]) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq
      const g = this.ctx.createGain()
      g.gain.value = amp
      const lfo = this.ctx.createOscillator()
      lfo.frequency.value = 0.07 + Math.random() * 0.05
      const lg = this.ctx.createGain()
      lg.gain.value = amp * 0.4
      lfo.connect(lg).connect(g.gain)
      o.connect(g).connect(this.filter)
      o.start()
      lfo.start()
    }
  }

  private pluck() {
    if (!this.ctx || !this.filter) return
    // Pa, Sa', Sa', Sa
    const notes = [SA * 1.5, SA * 2, SA * 2, SA]
    const f = notes[this.step++ % 4]
    const now = this.ctx.currentTime
    for (const det of [-3, 0, 4]) {
      const o = this.ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = det
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.03, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0008, now + 4.2)
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(2600, now)
      lp.frequency.exponentialRampToValueAtTime(500, now + 3)
      o.connect(lp).connect(g).connect(this.filter)
      o.start(now)
      o.stop(now + 4.4)
    }
  }
}

export const drone = new Drone()

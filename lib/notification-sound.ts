/**
 * U Seller Store - Notification Audio & Sound Manager
 * 
 * Uses the Web Audio API to synthesize crisp, pleasant, high-fidelity notification
 * chimes without requiring external audio asset files (100% offline & zero network latency).
 * Handles browser autoplay policies by gracefully queuing audio until user interaction.
 */

let sharedAudioCtx: AudioContext | null = null
let isUnlocked = false
let hasPendingSound = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtxClass) return null
      sharedAudioCtx = new AudioCtxClass()
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Setup auto-unlock on first user interaction (click, keypress, touch).
 * Complies with modern browser autoplay policies (Chrome/Edge/Safari/Firefox).
 */
export function initAudioUnlock(): void {
  if (typeof window === 'undefined' || isUnlocked) return

  const unlock = async () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {}
    }
    isUnlocked = true

    // If a sound was queued before the user clicked, play it now
    if (hasPendingSound) {
      hasPendingSound = false
      playNotificationSound()
    }

    // Remove listeners once unlocked
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('touchstart', unlock)
    window.removeEventListener('click', unlock)
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })
  window.addEventListener('touchstart', unlock, { passive: true })
  window.addEventListener('click', unlock, { passive: true })
}

export interface SoundOptions {
  volume?: number
  tone?: 'chime' | 'gentle' | 'order'
}

/**
 * Synthesizes a crisp, elegant harmonic notification chime.
 * Default tone is a pleasant 3-note harmonic chime (D5 -> A5 -> D6).
 */
export function playNotificationSound(options: SoundOptions = {}): void {
  if (typeof window === 'undefined') return

  initAudioUnlock()

  const ctx = getAudioContext()
  if (!ctx) return

  // If browser has suspended the context and no gesture has occurred yet, queue it
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      renderChime(ctx, options)
    }).catch(() => {
      hasPendingSound = true
    })
    return
  }

  renderChime(ctx, options)
}

function renderChime(ctx: AudioContext, options: SoundOptions = {}): void {
  try {
    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    const vol = Math.min(Math.max(options.volume ?? 0.22, 0.01), 1.0)
    masterGain.gain.setValueAtTime(vol, now)
    masterGain.connect(ctx.destination)

    const toneType = options.tone || 'chime'

    if (toneType === 'order') {
      // Ascending triumphant chime for new orders: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const noteGain = ctx.createGain()
        const start = now + idx * 0.08
        const end = start + 0.35

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        noteGain.gain.setValueAtTime(0.001, start)
        noteGain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.0001, end)

        osc.connect(noteGain)
        noteGain.connect(masterGain)

        osc.start(start)
        osc.stop(end)
      })
    } else if (toneType === 'gentle') {
      // Soft 2-tone ping
      const osc = ctx.createOscillator()
      const noteGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, now) // E5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1) // A5

      noteGain.gain.setValueAtTime(0.16, now)
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

      osc.connect(noteGain)
      noteGain.connect(masterGain)

      osc.start(now)
      osc.stop(now + 0.32)
    } else {
      // Standard signature notification chime:
      // Note 1: 587.33 Hz (D5) -> Note 2: 880.00 Hz (A5) -> Note 3: 1174.66 Hz (D6 shimmer)
      const noteConfigs = [
        { freq: 587.33, startOffset: 0.0, duration: 0.28, peakGain: 0.16 },
        { freq: 880.00, startOffset: 0.09, duration: 0.38, peakGain: 0.22 },
        { freq: 1174.66, startOffset: 0.18, duration: 0.45, peakGain: 0.14 },
      ]

      noteConfigs.forEach(({ freq, startOffset, duration, peakGain }) => {
        const osc = ctx.createOscillator()
        const noteGain = ctx.createGain()
        const start = now + startOffset
        const end = start + duration

        // Triangle + sine harmonic feel
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        // Envelope: instant soft attack, exponential natural decay
        noteGain.gain.setValueAtTime(0.0001, start)
        noteGain.gain.linearRampToValueAtTime(peakGain, start + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.0001, end)

        osc.connect(noteGain)
        noteGain.connect(masterGain)

        osc.start(start)
        osc.stop(end)
      })
    }
  } catch (err) {
    console.warn('[Audio] Failed to synthesize chime:', err)
  }
}

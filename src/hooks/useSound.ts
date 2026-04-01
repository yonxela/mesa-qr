import { useCallback, useRef } from 'react'

const NOTIFICATION_FREQUENCY = 830
const NOTIFICATION_DURATION = 200

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  const playNotification = useCallback(() => {
    try {
      const ctx = getContext()

      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.value = freq
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000)

        oscillator.start(startTime)
        oscillator.stop(startTime + duration / 1000)
      }

      const now = ctx.currentTime
      playTone(NOTIFICATION_FREQUENCY, now, NOTIFICATION_DURATION)
      playTone(NOTIFICATION_FREQUENCY * 1.25, now + 0.15, NOTIFICATION_DURATION)
      playTone(NOTIFICATION_FREQUENCY * 1.5, now + 0.3, NOTIFICATION_DURATION * 1.5)

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } catch {
      // Audio not available
    }
  }, [getContext])

  const playUrgent = useCallback(() => {
    try {
      const ctx = getContext()
      const now = ctx.currentTime

      for (let i = 0; i < 3; i++) {
        const offset = i * 0.5
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 1000
        osc.type = 'square'
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.4)
        osc.start(now + offset)
        osc.stop(now + offset + 0.4)
      }

      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300])
      }
    } catch {
      // Audio not available
    }
  }, [getContext])

  return { playNotification, playUrgent }
}

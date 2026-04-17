export interface SoundPlayer {
  playAttack: () => void;
  playHit: () => void;
  dispose: () => void;
}

export function createSoundPlayer(): SoundPlayer {
  let audioContext: AudioContext | null = null;

  function getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioContext) audioContext = new window.AudioContext();
    return audioContext;
  }

  function playTone(frequency: number, durationMs: number, type: OscillatorType): void {
    const context = getContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.06;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000);
  }

  return {
    playAttack: () => playTone(240, 70, "square"),
    playHit: () => playTone(110, 130, "sawtooth"),
    dispose: () => {
      if (!audioContext) return;
      void audioContext.close();
      audioContext = null;
    },
  };
}

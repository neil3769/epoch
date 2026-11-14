import { getProgress } from './progress';

/*
 * Optional answer sounds, off by default. Two short tones made with Web Audio,
 * so there are no sound files to download.
 */

let ctx: AudioContext | null = null;

function tone(freqs: number[], step = 0.09) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = t0 + i * step;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + step + 0.08);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + step + 0.1);
    });
  } catch {
    // No audio available: sounds are optional.
  }
}

export function playResult(correct: boolean) {
  if (!getProgress().settings.sound) return;
  tone(correct ? [660, 880] : [330, 262]);
}

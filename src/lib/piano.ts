let audioCtx: AudioContext | null = null;

const pentatonicFrequencies = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playPianoNote(yRatio?: number) {
  if (!audioCtx) return;
  
  let freqIndex;
  if (yRatio !== undefined) {
    // Map yRatio (0 to 1, where 0 is top of screen) to frequencies
    // Top of screen = higher pitch (higher index)
    freqIndex = Math.floor((1 - yRatio) * (pentatonicFrequencies.length - 1));
  } else {
    freqIndex = Math.floor(Math.random() * pentatonicFrequencies.length);
  }
  
  // Clamp index
  freqIndex = Math.max(0, Math.min(pentatonicFrequencies.length - 1, freqIndex));
  const freq = pentatonicFrequencies[freqIndex];

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Soft piano / bell tone
  osc.type = 'sine';
  
  // Add some harmonics for a richer sound
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 2; // Octave higher
  const gainNode2 = audioCtx.createGain();

  osc.connect(gainNode);
  osc2.connect(gainNode2);
  gainNode.connect(audioCtx.destination);
  gainNode2.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  
  // Envelope 1 (Main tone)
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // slow decay

  // Envelope 2 (Harmonic)
  gainNode2.gain.setValueAtTime(0, now);
  gainNode2.gain.linearRampToValueAtTime(0.1, now + 0.01);
  gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  osc.frequency.setValueAtTime(freq, now);
  
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 2.0);
  osc2.stop(now + 1.0);
}

export function playChord() {
  if (!audioCtx) return;
  // Play a nice C major / A minor pentatonic arpeggio
  playPianoNote(0.8); // C4
  setTimeout(() => playPianoNote(0.6), 100); // E4
  setTimeout(() => playPianoNote(0.4), 200); // G4
  setTimeout(() => playPianoNote(0.2), 300); // C5
}

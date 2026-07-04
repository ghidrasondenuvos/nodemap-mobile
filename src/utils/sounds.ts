// Synthesize tactile UI sounds using Web Audio API so we don't need asset files
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playSound = (type: 'pop' | 'swoosh' | 'click' | 'success') => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  if (type === 'click') {
    // Sharp click
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.02);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    oscillator.start(now);
    oscillator.stop(now + 0.02);
  } else if (type === 'pop') {
    // Soft, bubbly pop
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } else if (type === 'swoosh') {
    // Air swoosh for page transitions
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } else if (type === 'success') {
    // Pleasant chime for saving/exporting
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
};

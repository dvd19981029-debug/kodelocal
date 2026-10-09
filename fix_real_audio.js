const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Sonido sintético de campanilla doble para alertar nuevas comandas web en tiempo real[\s\S]*?function playNewOrderChime\(\) \{[\s\S]*?\}\n\}/m;

const replacement = `// Singleton para el AudioContext
let globalAudioCtx: AudioContext | null = null;

export function initGlobalAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    // Despertar TTS silenciosamente para cargar las voces
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.getVoices();
    }
  } catch (err) {
    console.warn('No se pudo inicializar el audio', err);
  }
}

// Sonido sintético y Voz TTS (Text-to-Speech) para notificar comandas detalladas
function playNewOrderChime(orderDetails?: string) {
  try {
    if (globalAudioCtx) {
      if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
      const now = globalAudioCtx.currentTime;
      const osc = globalAudioCtx.createOscillator();
      const gainNode = globalAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.frequency.setValueAtTime(1108.73, now + 0.15);
      gainNode.gain.setValueAtTime(0, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.17);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gainNode);
      gainNode.connect(globalAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    }

    if (orderDetails && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(orderDetails);
      utterance.lang = 'es-US';
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      const maleVoice = spanishVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('pablo') || v.name.toLowerCase().includes('diego') || v.name.toLowerCase().includes('male'));
      if (maleVoice) utterance.voice = maleVoice;
      else if (spanishVoices.length > 0) utterance.voice = spanishVoices[0];
      
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  } catch (err) {
    console.error('Error reproduciendo sonido/voz de campanilla:', err);
  }
}`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code);
console.log('Patched real audio function');

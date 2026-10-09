const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldGlobal = `// Sonido sintético y Voz TTS (Text-to-Speech) para notificar comandas detalladas`;

const newGlobal = `// Singleton para el AudioContext
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
      // Forzar carga de voces (en Chrome es asíncrono)
      window.speechSynthesis.getVoices();
    }
  } catch (err) {
    console.warn('No se pudo inicializar el audio', err);
  }
}

// Sonido sintético y Voz TTS (Text-to-Speech) para notificar comandas detalladas`;

code = code.replace(oldGlobal, newGlobal);

const oldPlayChime = `// 1. Reproducir campanilla
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
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
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    }`;

const newPlayChime = `// 1. Reproducir campanilla usando el contexto global
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
    }`;

code = code.replace(oldPlayChime, newPlayChime);

const oldOverlayBtn = `onClick={() => {
                setHasInteracted(true);
                if (typeof window !== 'undefined') {
                  if ('Notification' in window) {
                    Notification.requestPermission();
                  }
                  if (window.speechSynthesis) {
                    const u = new SpeechSynthesisUtterance('Asistente de bodega activado');
                    u.lang = 'es-US';
                    u.rate = 1.2;
                    u.volume = 0.5;
                    window.speechSynthesis.speak(u);
                  }
                }
              }}`;

const newOverlayBtn = `onClick={async () => {
                setHasInteracted(true);
                if (typeof window !== 'undefined') {
                  // Inicializar el motor de audio de manera robusta
                  initGlobalAudio();
                  
                  if ('Notification' in window) {
                    try {
                      await Notification.requestPermission();
                    } catch (e) {
                      console.error("Error pidiendo permiso notif:", e);
                    }
                  }
                  
                  if (window.speechSynthesis) {
                    // Darle un pequeño retraso a la carga de voces
                    setTimeout(() => {
                      const u = new SpeechSynthesisUtterance('Listo para despachar');
                      u.lang = 'es-US';
                      u.rate = 1.0;
                      u.volume = 1.0;
                      
                      const voices = window.speechSynthesis.getVoices();
                      const espVoices = voices.filter(v => v.lang.includes('es'));
                      const male = espVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('male'));
                      if (male) u.voice = male;
                      else if (espVoices.length > 0) u.voice = espVoices[0];

                      window.speechSynthesis.speak(u);
                    }, 200);
                  }
                }
              }}`;

code = code.replace(oldOverlayBtn, newOverlayBtn);

fs.writeFileSync(path, code);
console.log('Patched robust audio');

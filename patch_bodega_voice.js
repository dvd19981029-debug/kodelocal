const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldChimeFunction = `// Sonido sintético de campanilla doble para alertar nuevas comandas web en tiempo real
function playNewOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Configurar oscilador de campana
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    
    // Tono 1 (Agudo)
    osc.frequency.setValueAtTime(880.00, now); // A5
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    // Tono 2 (Más agudo)
    osc.frequency.setValueAtTime(1108.73, now + 0.15); // C#6
    gainNode.gain.setValueAtTime(0, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.17);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.5);
  } catch (err) {
    console.error('Error reproduciendo sonido de campanilla:', err);
  }
}`;

const newVoiceFunction = `// Sonido sintético y Voz TTS (Text-to-Speech) para notificar comandas detalladas
function playNewOrderChime(orderDetails?: string) {
  try {
    // 1. Reproducir campanilla
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
    }
    
    // 2. Voz TTS (Masculina natural, español) si hay detalles del pedido
    if (orderDetails && window.speechSynthesis) {
      // Cancelar cualquier audio pendiente
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(orderDetails);
      utterance.lang = 'es-US';
      utterance.rate = 0.85; // Voz pausada para dar tiempo a recoger los botes
      utterance.pitch = 0.9;
      
      // Intentar encontrar una voz masculina natural en español
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      const maleVoice = spanishVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('pablo') || v.name.toLowerCase().includes('diego') || v.name.toLowerCase().includes('male'));
      if (maleVoice) utterance.voice = maleVoice;
      else if (spanishVoices.length > 0) utterance.voice = spanishVoices[0];
      
      // Delay corto para que suene la campanilla primero
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  } catch (err) {
    console.error('Error reproduciendo sonido/voz de campanilla:', err);
  }
}`;

code = code.replace(oldChimeFunction, newVoiceFunction);

// Pedir permiso de notificaciones y mostrar notificación visual
const oldNewOrdersLogic = `          if (newOrders.length > 0) {
            if (soundEnabled) playNewOrderChime();
            const first = newOrders[0];
            showToast(\`🔔 ¡Nueva comanda web recibida! #\${first.saleNumber} (\${first.cliente?.nombre || 'Cliente'})\`);
          }`;

const newNewOrdersLogic = `          if (newOrders.length > 0) {
            const first = newOrders[0];
            const clientName = first.cliente?.nombre || first.customerName || 'Cliente';
            
            // Construir el texto detallado con pausas usando comas
            let speechText = \`Nuevo pedido, cliente \${clientName}. Lléva: \`;
            if (first.items && first.items.length > 0) {
              const itemTexts = first.items.map((it: any) => \`\${it.quantity} \${it.unit === 'Onza' ? (it.quantity === 1 ? 'onza' : 'onzas') : 'unidades'} de \${it.name}, en el estante \${it.puesto || 'A1'}\`);
              speechText += itemTexts.join(', y ');
            } else {
              speechText += 'varios productos, revisar pantalla.';
            }

            if (soundEnabled) playNewOrderChime(speechText);
            
            const notificationTitle = \`Nueva comanda #\${first.saleNumber}\`;
            const notificationBody = \`Cliente: \${clientName} - \${first.items?.length || 0} productos\`;
            
            showToast(\`🔔 \${notificationTitle}\`);
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notificationTitle, { body: notificationBody, icon: '/icon.png' });
            }
          }`;

code = code.replace(oldNewOrdersLogic, newNewOrdersLogic);

// Add Notification permission request button logic to Bodega page UI
const oldHeaderRight = `{/* Toggle de Alerta Sonora */}
          <button`;

const newHeaderRight = `{/* Permiso de Notificaciones */}
          {'Notification' in window && typeof Notification.permission === 'string' && Notification.permission !== 'granted' && (
            <button
              type="button"
              onClick={() => Notification.requestPermission()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1.5"
              title="Activar notificaciones de escritorio"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Permitir Alertas</span>
            </button>
          )}
          {/* Toggle de Alerta Sonora */}
          <button`;

code = code.replace(oldHeaderRight, newHeaderRight);

fs.writeFileSync(path, code);
console.log('Patched', path);

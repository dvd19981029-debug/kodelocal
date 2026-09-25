import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guia = searchParams.get('guia') || 'C807-KOD-889922';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulador de Webhooks C807 Express - KODE</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-100 min-h-screen text-slate-800 p-4 sm:p-8 flex items-center justify-center">
  <div class="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <span class="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Simulador Oficial
        </span>
        <h1 class="text-xl font-black text-slate-900 mt-1">Simulador Webhook C807 Express</h1>
        <p class="text-xs text-slate-500">Envía eventos de prueba al webhook de KODE en tiempo real.</p>
      </div>
      <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
        C807
      </div>
    </div>

    <form id="simForm" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Número de Guía</label>
        <input 
          type="text" 
          id="guiaInput" 
          name="guia" 
          value="${guia}" 
          required 
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Evento a Simular</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 cursor-pointer transition-colors">
            <input type="radio" name="evento" value="recogido" class="text-indigo-600">
            <div>
              <span class="font-bold block text-slate-800">📦 Recogido en origen</span>
              <span class="text-[10px] text-slate-500">Código 13 (Pasa a Enviado)</span>
            </div>
          </label>

          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-colors">
            <input type="radio" name="evento" value="entregado" checked class="text-emerald-600">
            <div>
              <span class="font-bold block text-slate-800">✅ Llegó a su destino</span>
              <span class="text-[10px] text-slate-500">Código 15 (Pasa a Entregado)</span>
            </div>
          </label>

          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50/50 cursor-pointer transition-colors">
            <input type="radio" name="evento" value="ruta" class="text-amber-600">
            <div>
              <span class="font-bold block text-slate-800">🚚 En ruta de entrega</span>
              <span class="text-[10px] text-slate-500">Actualiza estatus en vivo</span>
            </div>
          </label>

          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50/50 cursor-pointer transition-colors">
            <input type="radio" name="evento" value="problema" class="text-rose-600">
            <div>
              <span class="font-bold block text-slate-800">⚠️ Problemas en gestión</span>
              <span class="text-[10px] text-slate-500">Código 16 (Alerta Telegram)</span>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones</label>
        <input 
          type="text" 
          id="observacionesInput" 
          value="Prueba técnica de sincronización de webhook" 
          class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <button 
        type="submit" 
        id="submitBtn"
        class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span>⚡ Enviar Webhook a KODE</span>
      </button>
    </form>

    <div id="resultadoBox" class="hidden space-y-2 pt-2 border-t border-slate-100">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-700">Respuesta del Webhook:</span>
        <span id="statusBadge" class="text-[10px] font-black px-2 py-0.5 rounded-full"></span>
      </div>
      <pre id="jsonOutput" class="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-48"></pre>
      <div class="text-center pt-2">
        <a href="/kode" class="text-xs font-bold text-indigo-600 hover:underline">
          → Abrir KODE para ver la tabla actualizada
        </a>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('simForm');
    const btn = document.getElementById('submitBtn');
    const resBox = document.getElementById('resultadoBox');
    const badge = document.getElementById('statusBadge');
    const output = document.getElementById('jsonOutput');

    const PAYLOADS = {
      recogido: {
        codigo: '13',
        estatus: 'Recogido en origen',
        observaciones: 'Paquete recibido en agencia C807'
      },
      entregado: {
        codigo: '15',
        estatus: 'Llegó a su destino',
        observaciones: 'Entregado a cliente con firma y foto'
      },
      ruta: {
        codigo: '14',
        estatus: 'En ruta de entrega',
        observaciones: 'Repartidor en trayecto al domicilio'
      },
      problema: {
        codigo: '16',
        estatus: 'Problemas en la gestión',
        observaciones: 'Cliente no contesta llamadas',
        razon: {
          codigo: '115',
          descripcion: 'Dirección incompleta / no contesta'
        }
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.innerHTML = 'Enviando...';

      const guia = document.getElementById('guiaInput').value.trim();
      const tipo = document.querySelector('input[name="evento"]:checked').value;
      const obs = document.getElementById('observacionesInput').value.trim();

      const base = PAYLOADS[tipo];
      const payload = {
        guia: guia,
        codigo: base.codigo,
        estatus: base.estatus,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        observaciones: obs || base.observaciones,
        latitud: '13.69294',
        longitud: '-89.21819',
        razon: base.razon || null
      };

      try {
        const res = await fetch('/api/c807/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        resBox.classList.remove('hidden');
        if (res.ok && data.success) {
          badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
          badge.textContent = '200 OK - Actualizado';
        } else {
          badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
          badge.textContent = 'Aviso: ' + (data.advertencia || data.error || 'Verificar');
        }
        output.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        resBox.classList.remove('hidden');
        badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800';
        badge.textContent = 'Error';
        output.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '⚡ Enviar Webhook a KODE';
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// src/app/api/dte/[id]/pdf/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { facturaLlama } from '@/lib/facturalama';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Falta id de DTE' }, { status: 400 });
    }

    // 1. Intentar obtener el PDF directamente de Factura Llama si está disponible
    try {
      const response = await facturaLlama.getPdfStream(id);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/pdf')) {
          const pdfBuffer = await response.arrayBuffer();
          return new Response(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="DTE-${id}.pdf"`,
            },
          });
        }
      }
    } catch (apiErr) {
      console.warn('Factura Llama PDF stream no disponible:', apiErr);
    }

    // 2. Si Factura Llama no entrega PDF directo (p. ej. restricción de póliza o endpoint no permitido),
    // consultar la base de datos y renderizar la Representación Gráfica Oficial del DTE
    let dteDoc: any = null;
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      dteDoc = await prisma.dteDocument.findFirst({
        where: {
          OR: [{ codigoGeneracion: id }, { id }],
        },
        include: {
          sale: {
            include: {
              items: true,
              customer: true,
            },
          },
        },
      });
    }

    if (!dteDoc) {
      return NextResponse.json(
        { error: 'DTE no encontrado en base de datos' },
        { status: 404 }
      );
    }

    let parsedResponse: any = {};
    let parsedRequest: any = {};
    try {
      if (dteDoc.responseJson) parsedResponse = JSON.parse(dteDoc.responseJson);
      if (dteDoc.requestJson) parsedRequest = JSON.parse(dteDoc.requestJson);
    } catch (e) {
      console.warn('Error parsing JSON in DteDocument', e);
    }

    // Extraer datos estructurados del DTE
    const dteOfficial = parsedResponse?.dte || {};
    const dteIdentificacion = dteOfficial?.identificacion || {};
    const dteEmisor = dteOfficial?.emisor || {};
    const dteReceptor = dteOfficial?.receptor || parsedRequest?.clientRequest?.cliente || {};
    const dteResumen = dteOfficial?.resumen || {};
    const mhResp = parsedResponse?.mhResponse?.data || {};

    const codGen = dteDoc.codigoGeneracion || id;
    const numControl = dteDoc.numeroControl || dteIdentificacion?.numeroControl || 'N/D';
    const sello = dteDoc.selloRecepcion || mhResp?.selloRecibido || 'N/D';
    const fechaHora = dteDoc.fhProcesamiento 
      ? new Date(dteDoc.fhProcesamiento).toLocaleString('es-SV') 
      : new Date().toLocaleString('es-SV');
    const fechaSolo = dteDoc.fhProcesamiento 
      ? new Date(dteDoc.fhProcesamiento).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    
    const tipoDocLabel = dteDoc.tipoDte === 'CREDITO_FISCAL_03' || dteIdentificacion?.tipoDte === '03'
      ? 'COMPROBANTE DE CRÉDITO FISCAL (DTE-03)'
      : 'FACTURA ELECTRÓNICA (DTE-01)';

    // Items
    let itemsList: any[] = [];
    if (Array.isArray(dteOfficial?.cuerpoDocumento) && dteOfficial.cuerpoDocumento.length > 0) {
      itemsList = dteOfficial.cuerpoDocumento.map((it: any) => ({
        cantidad: it.cantidad || 1,
        descripcion: it.descripcion || 'Producto',
        precioUnitario: Number(it.precioUni || 0),
        montoIva: Number(it.ivaItem || 0),
        total: Number(it.ventaGravada || it.ventaExenta || 0),
      }));
    } else if (dteDoc.sale?.items && dteDoc.sale.items.length > 0) {
      itemsList = dteDoc.sale.items.map((it: any) => ({
        cantidad: it.quantity || 1,
        descripcion: it.productName || 'Producto',
        precioUnitario: Number(it.unitPrice || 0),
        montoIva: Number(it.unitPrice || 0) * 0.13,
        total: Number(it.total || 0),
      }));
    } else if (parsedRequest?.clientRequest?.items) {
      itemsList = parsedRequest.clientRequest.items.map((it: any) => ({
        cantidad: it.quantity || it.cantidad || 1,
        descripcion: it.name || it.nombre || it.descripcion || 'Producto',
        precioUnitario: Number(it.price || it.precioUnitario || 0),
        montoIva: Number(it.price || it.precioUnitario || 0) * 0.13,
        total: (Number(it.quantity || 1) * Number(it.price || 0)),
      }));
    }

    const totalPagar = dteResumen?.totalPagar || dteResumen?.montoTotalOperacion || dteDoc.sale?.total || itemsList.reduce((acc, i) => acc + (Number(i.total) || 0), 0);
    const subtotalGravado = dteResumen?.subTotalVentas || dteResumen?.totalGravada || dteDoc.sale?.subtotal || (Number(totalPagar) / 1.13);
    const iva13 = dteResumen?.totalIva || dteDoc.sale?.ivaTotal || (Number(totalPagar) - Number(subtotalGravado));

    const clienteNombre = dteReceptor?.nombre || dteDoc.sale?.customer?.name || 'Consumidor Final';
    const clienteDoc = dteReceptor?.numDocumento || dteReceptor?.nit || dteDoc.sale?.customer?.dui || dteDoc.sale?.customer?.nit || 'N/D';
    const clienteNrc = dteReceptor?.nrc || dteDoc.sale?.customer?.nrc || '';
    const clienteDireccion = dteReceptor?.direccion?.complemento || dteReceptor?.direccion || dteDoc.sale?.customer?.address || 'San Salvador, El Salvador';
    const mhConsultaUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=${codGen}&fechaEmi=${fechaSolo}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mhConsultaUrl)}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DTE-${codGen.slice(0, 8)} - ${tipoDocLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 20px;
    }
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .btn-primary { background: #4f46e5; color: #ffffff; }
    .btn-primary:hover { background: #4338ca; }
    .btn-outline { background: #ffffff; color: #334155; border-color: #cbd5e1; }
    .btn-outline:hover { background: #f8fafc; color: #0f172a; }
    .btn-hacienda { background: #059669; color: #ffffff; }
    .btn-hacienda:hover { background: #047857; }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 35px 40px;
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 900;
      color: #312e81;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .company-info {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.4;
    }

    .doc-badge {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 12px 16px;
      text-align: right;
      min-width: 280px;
    }
    .doc-title {
      font-size: 13px;
      font-weight: 900;
      color: #3730a3;
      margin-bottom: 4px;
    }
    .doc-meta {
      font-size: 11px;
      font-family: monospace;
      color: #1e293b;
      line-height: 1.35;
    }

    .hacienda-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .hacienda-info {
      flex: 1;
      font-size: 11px;
      color: #166534;
      line-height: 1.4;
      font-family: monospace;
      word-break: break-all;
    }
    .qr-img {
      width: 80px;
      height: 80px;
      border-radius: 6px;
      border: 1px solid #86efac;
    }

    .client-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      font-size: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
    }
    .client-item strong { color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .client-item div { color: #0f172a; font-weight: 700; margin-top: 2px; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 10px 12px;
      font-weight: 800;
      border-bottom: 2px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }

    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
      font-size: 13px;
    }
    .totals-table td {
      padding: 6px 12px;
      border: none;
    }
    .totals-table tr.grand-total {
      background: #eef2ff;
      border-top: 2px solid #6366f1;
      font-weight: 900;
      font-size: 15px;
      color: #312e81;
    }

    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 15px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }

    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .action-bar { display: none !important; }
      .invoice-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <div style="display: flex; align-items: center; gap: 8px;">
      <a href="/pos" class="btn btn-outline">⬅ Volver al POS</a>
      <span style="font-size: 13px; font-weight: 700; color: #475569;">Representación Gráfica DTE</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <a href="/api/dte/${codGen}/json" target="_blank" class="btn btn-outline">📄 Ver JSON</a>
      <a href="${mhConsultaUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-hacienda">🏛️ Consulta Hacienda</a>
      <button onclick="window.print()" class="btn btn-primary">🖨️ Imprimir / Guardar PDF</button>
    </div>
  </div>

  <div class="invoice-container">
    
    <div class="header">
      <div>
        <h1 class="company-title">Aromaniak SV / Kode Local</h1>
        <div class="company-info">
          <strong>VENTA DE PERFUMERÍA, ESENCIAS Y FRAGANCIAS</strong><br>
          NIT: 0614-120590-101-2 • NRC: 245678-9<br>
          San Salvador, El Salvador • Tel: +503 2245-8800
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-title">${tipoDocLabel}</div>
        <div class="doc-meta">
          <strong>N° CONTROL:</strong> ${numControl}<br>
          <strong>FECHA / HORA:</strong> ${fechaHora}
        </div>
      </div>
    </div>

    <div class="hacienda-box">
      <img src="${qrUrl}" alt="QR Consulta Pública Hacienda" class="qr-img">
      <div class="hacienda-info">
        <div><strong style="color: #15803d;">DOCUMENTO TRIBUTARIO ELECTRÓNICO TRANSMITIDO A MH</strong></div>
        <div><strong>CÓDIGO DE GENERACIÓN (UUID):</strong> ${codGen}</div>
        <div><strong>SELLO DE RECEPCIÓN MH:</strong> ${sello}</div>
        <div><strong>AMBIENTE:</strong> 00 - PRUEBAS / CERTIFICACIÓN &nbsp;|&nbsp; <strong>ESTADO:</strong> ${dteDoc.estado}</div>
      </div>
    </div>

    <div class="client-section">
      <div class="client-item">
        <strong>Receptor / Cliente:</strong>
        <div>${clienteNombre}</div>
      </div>
      <div class="client-item">
        <strong>Documento (DUI/NIT):</strong>
        <div class="font-mono">${clienteDoc}</div>
      </div>
      ${clienteNrc ? `
      <div class="client-item">
        <strong>NRC Receptor:</strong>
        <div class="font-mono">${clienteNrc}</div>
      </div>` : ''}
      <div class="client-item" style="grid-column: span 2;">
        <strong>Dirección:</strong>
        <div>${clienteDireccion}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50px;" class="text-center">Cant</th>
          <th>Descripción del Producto / Servicio</th>
          <th style="width: 90px;" class="text-right">Precio Unit</th>
          <th style="width: 80px;" class="text-right">IVA (13%)</th>
          <th style="width: 90px;" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList.map(item => `
          <tr>
            <td class="text-center font-mono font-bold">${item.cantidad}</td>
            <td><strong>${item.descripcion}</strong></td>
            <td class="text-right font-mono">$${Number(item.precioUnitario).toFixed(2)}</td>
            <td class="text-right font-mono">$${Number(item.montoIva).toFixed(2)}</td>
            <td class="text-right font-mono font-bold">$${Number(item.total).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td class="text-right">Subtotal Gravado:</td>
          <td class="text-right font-mono font-bold">$${Number(subtotalGravado).toFixed(2)}</td>
        </tr>
        <tr>
          <td class="text-right">IVA (13%):</td>
          <td class="text-right font-mono font-bold">$${Number(iva13).toFixed(2)}</td>
        </tr>
        <tr class="grand-total">
          <td class="text-right">TOTAL A PAGAR:</td>
          <td class="text-right font-mono">$${Number(totalPagar).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      Representación Gráfica de Documento Tributario Electrónico (DTE) emitido según los lineamientos del Ministerio de Hacienda de la República de El Salvador.<br>
      Para verificar la autenticidad de este documento escanee el código QR o consulte en <strong>https://admin.factura.gob.sv/consultaPublica</strong>
    </div>

  </div>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Error al generar PDF/Representación de DTE:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno generando representación de DTE' },
      { status: 500 }
    );
  }
}


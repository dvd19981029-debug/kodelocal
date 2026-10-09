const fs = require('fs');
const path = 'src/lib/facturalama.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /async emitDte\(params: \{[\s\S]*?const now = new Date\(\);/;
const replace = `async emitDte(params: {
    tipoDte: string;
    saleId: string;
    items: DteItemInput[];
    cliente?: DteCustomerInput;
    metodoPago?: string;
    correlativo?: number;
  }): Promise<DteEmissionResult> {
    const { tipoDte, items, cliente, correlativo = Math.floor(Math.random() * 100000) } = params;
    const codigoGeneracion = randomUUID();
    const now = new Date();

    if (process.env.MOCK_FACTURALLAMA === 'true') {
      console.log('[FacturaLlama] MOCKED: intercepting request to avoid real emission');
      return {
        success: true,
        simulated: true,
        tipoDte: tipoDte,
        codigoGeneracion: codigoGeneracion,
        numeroControl: 'DTE-MOCK-123456',
        selloRecepcion: 'MOCK-RECEPCION-SELLO',
        fhProcesamiento: new Date().toISOString(),
        estado: 'PROCESADO',
        mensaje: 'EMISIÓN SIMULADA EXITOSA (MOCK)',
        mhDteUrl: 'https://admin.facturallama.com/mock',
      };
    }`;

code = code.replace(regex, replace);
fs.writeFileSync(path, code);

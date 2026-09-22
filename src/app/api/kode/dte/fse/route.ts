import { NextResponse } from 'next/server';
import { emitirDteFseKode } from '@/lib/facturalamaKode';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      empleado_id,
      monto,
      concepto = 'Servicios profesionales de intermediación comercial y comisiones por ventas',
      retencion_renta = 0,
      // Opcional: datos directos si se sobreescriben
      doc_tipo,
      doc_numero,
      departamento_mh,
      municipio_mh,
      direccion_complemento,
    } = body;

    if (!empleado_id) {
      return NextResponse.json(
        { success: false, error: 'empleado_id es requerido para emitir la factura de sujeto excluido' },
        { status: 400 }
      );
    }

    if (!monto || Number(monto) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto a liquidar debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // 1. Obtener datos del empleado en public.usuarios
    const empRes = await queryKode(
      `SELECT 
        id, nombre, email, telefono, rol,
        COALESCE(username, '') AS username,
        COALESCE(doc_tipo, 'DUI') AS doc_tipo,
        COALESCE(doc_numero, '') AS doc_numero,
        COALESCE(departamento_mh, '06') AS departamento_mh,
        COALESCE(municipio_mh, '14') AS municipio_mh,
        COALESCE(direccion_complemento, '') AS direccion_complemento
       FROM public.usuarios
       WHERE id = $1
       LIMIT 1`,
      [empleado_id]
    );

    if (empRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    const emp = empRes.rows[0];

    const finalDocTipo = doc_tipo || emp.doc_tipo || 'DUI';
    const finalDocNum = (doc_numero || emp.doc_numero || '').trim();
    const finalDepto = departamento_mh || emp.departamento_mh || '06';
    const finalMuni = municipio_mh || emp.municipio_mh || '14';
    const finalDireccion = (direccion_complemento || emp.direccion_complemento || '').trim();

    if (!finalDocNum) {
      return NextResponse.json(
        { success: false, error: 'El empleado no tiene configurado su número de DUI/Documento para Factura de Sujeto Excluido' },
        { status: 400 }
      );
    }

    if (!finalDireccion) {
      return NextResponse.json(
        { success: false, error: 'El empleado requiere una dirección de residencia (complemento) para el DTE-14' },
        { status: 400 }
      );
    }

    // 2. Emitir DTE de Sujeto Excluido vía Factura Llama
    const dteResult = await emitirDteFseKode({
      empleado_id: emp.id,
      empleado_nombre: emp.nombre,
      empleado_correo: emp.email,
      empleado_telefono: emp.telefono,
      doc_tipo: finalDocTipo,
      doc_numero: finalDocNum,
      departamento_mh: finalDepto,
      municipio_mh: finalMuni,
      direccion_complemento: finalDireccion,
      concepto,
      monto: Number(monto),
      retencion_renta: Number(retencion_renta),
    });

    if (!dteResult.success) {
      return NextResponse.json({
        success: false,
        error: dteResult.mensaje || 'Error al emitir DTE de Sujeto Excluido en Factura Llama',
        dteResult,
      }, { status: 422 });
    }

    // 3. Registrar o actualizar log si se desea
    return NextResponse.json({
      success: true,
      message: 'Factura de Sujeto Excluido (DTE-14) emitida exitosamente en Factura Llama',
      dte: dteResult,
    });
  } catch (error: any) {
    console.error('Error en /api/kode/dte/fse:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar DTE de Sujeto Excluido' },
      { status: 500 }
    );
  }
}

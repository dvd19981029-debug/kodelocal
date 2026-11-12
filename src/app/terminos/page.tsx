import React from 'react';
import Link from 'next/link';
import {
  FileCheck,
  ArrowLeft,
  Shield,
  Sparkles,
  RefreshCcw,
  PackageCheck,
  FlaskConical,
  CreditCard,
  Truck,
  Scale,
} from 'lucide-react';

export const metadata = {
  title: 'Condiciones del Servicio',
  description:
    'Términos y Condiciones del Servicio de GRUPO KODE, S.A.S. DE C.V. (Aromaniak SV, KÖDE y canales digitales).',
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
        <span className="text-xs text-slate-400 font-medium">Última actualización: Noviembre 2026</span>
      </div>

      <div className="clay-card p-6 sm:p-10 bg-white space-y-8 rounded-3xl border border-white/90 shadow-xl">
        <div className="border-b border-purple-100 pb-5 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3 shadow-sm">
            <FileCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Términos y Condiciones del Servicio
          </h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Al navegar, solicitar cotizaciones o realizar compras a través de nuestras plataformas web y canales oficiales de mensajería, aceptas las presentes Condiciones del Servicio establecidas conforme a la Ley de Comercio Electrónico y la Ley de Protección al Consumidor de la República de El Salvador.
          </p>
        </div>

        {/* 1. Identificación Legal y Alcance */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>1. Identificación del Titular y Alcance Comercial</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Las marcas comerciales <strong>Aromaniak SV</strong> (<a href="https://aromaniaksv.com" className="text-purple-700 underline font-bold">https://aromaniaksv.com</a> y <a href="https://pos.aromaniaksv.com" className="text-purple-700 underline font-bold">https://pos.aromaniaksv.com</a>), <strong>KÖDE</strong> (<a href="https://kodesv.com" className="text-purple-700 underline font-bold">https://kodesv.com</a>) y nuestro centro unificado de atención al cliente <strong>Chatwoot CRM</strong> (<a href="https://chat.kodesv.com" className="text-purple-700 underline font-bold">https://chat.kodesv.com</a>, así como nuestras cuentas verificadas de Facebook Messenger, WhatsApp e Instagram) son propiedad y están operadas por:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li><strong>Razón Social:</strong> GRUPO KODE, SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE (abreviadamente <strong>GRUPO KODE, S.A.S. DE C.V.</strong>).</li>
            <li><strong>NIT:</strong> 0623-290726-106-9 &bull; <strong>NRC:</strong> 390357-8.</li>
            <li><strong>Domicilio Legal:</strong> Cl. Las Violetas y 39 Av. Norte, #33, Urb. Universitaria, Nivel 3, San Salvador, El Salvador.</li>
            <li><strong>Contacto Oficial y Soporte:</strong> +503 6043-7496 &bull; <a href="mailto:dvd19981029@gmail.com" className="text-purple-700 underline font-bold">dvd19981029@gmail.com</a>.</li>
          </ul>
        </section>

        {/* 2. Naturaleza de los Productos e Inspiraciones Olfativas */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>2. Productos, Inspiraciones Olfativas y Propiedad Intelectual</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Comercializamos perfumes terminados de marca propia (<strong>KÖDE</strong>), así como esencias concentradas de perfumería fina, químicos aromáticos, fijadores, envases de vidrio, atomizadores y materias primas al detalle y mayoreo (<strong>Aromaniak SV</strong>).
          </p>
          <p className="text-xs text-purple-900 bg-purple-50 p-3 rounded-xl border border-purple-200 font-semibold leading-relaxed">
            Declaración sobre referencias olfativas: Nuestras fragancias e inspiraciones aromáticas son creaciones e interpretaciones olfativas independientes. Cualquier mención a notas, familias aromáticas o nombres comerciales de terceros en catálogos o asesorías de chat tiene carácter estrictamente descriptivo y orientativo para identificar la tendencia olfativa, sin existir afiliación, patrocinio ni representación con casas diseñadoras externas.
          </p>
        </section>

        {/* 3. Higiene, Productos Fraccionados y Devoluciones */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-purple-600" />
            <span>3. Política de Higiene, Fraccionamiento a Medida y Devoluciones</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Por estrictas razones de inocuidad sanitaria, control de pureza química y por tratarse de artículos de cuidado personal o <strong>fraccionados a la medida de cada orden</strong> (esencias servidas por media onza, onza o peso específico):
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li><strong>No se aceptan cambios ni devoluciones</strong> una vez despachadas las esencias fraccionadas, materias primas abiertas o perfumes cuyo sello/atomizador haya sido accionado.</li>
            <li>No aplican reembolsos por apreciación subjetiva del aroma o variaciones naturales de fijación y proyección, dado que el desempeño de toda fragancia depende del pH cutáneo, hidratación, clima y concentración elegida por el usuario.</li>
          </ul>
        </section>

        {/* 4. Garantía por Avería en Tránsito o Error de Despacho */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-purple-600" />
            <span>4. Garantía por Daño en Envío o Error de Despacho (24 Horas)</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Respaldamos que tu pedido llegue íntegro y conforme a tu orden. En caso de rotura de envases de vidrio, derrame evidente durante el transporte o recepción de una referencia distinta a la facturada:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li>El cliente dispone de un plazo máximo de <strong>24 horas corridas</strong> desde la entrega del paquete para reportar la incidencia a nuestros canales oficiales de soporte.</li>
            <li>Es indispensable adjuntar fotografía o video claro del empaque original, la viñeta de envío y el producto afectado sin haberlo desechado ni trasvasado. Validado el reporte, gestionaremos la reposición correspondiente sin costo adicional.</li>
          </ul>
        </section>

        {/* 5. Uso Técnico de Materias Primas */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <span>5. Uso Técnico de Materias Primas y Limitación de Responsabilidad</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Las esencias puras al 100%, fijadores, bases alcohólicas e insumos químicos comercializados en <strong>Aromaniak SV</strong> están destinados a la formulación cosmética/aromática y requieren dilución adecuada antes del contacto directo con la piel.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <strong>GRUPO KODE, S.A.S. DE C.V.</strong> no asume responsabilidad por reacciones cutáneas derivadas de aplicar aceites concentrados puros sin diluir, ingestión accidental, contacto ocular, exposición de los insumos al sol o calor excesivo, ni por alteraciones resultantes de mezclas, maceraciones o reenvasados efectuados por el comprador para uso propio o reventa.
          </p>
        </section>

        {/* 6. Precios, Pagos y Facturación Electrónica (DTE) */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <span>6. Precios, Validación de Pagos y Facturación Electrónica (DTE)</span>
          </h2>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li>Todos los precios están expresados en <strong>Dólares de los Estados Unidos de América (USD)</strong> e incluyen el Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA).</li>
            <li><strong>Facturación Electrónica (DTE):</strong> Emitimos Factura de Consumidor Final o Comprobante de Crédito Fiscal (CCF). Si requieres <strong>Crédito Fiscal</strong>, debes proporcionar tus datos tributarios completos (NRC, NIT, giro y dirección) <strong>antes de cerrar el pedido</strong>; una vez transmitido un DTE de Consumidor Final al Ministerio de Hacienda, no procede su sustitución en fechas posteriores.</li>
            <li><strong>Transferencias y tarjetas:</strong> En pagos por transferencia bancaria, la orden se libera a despacho únicamente cuando los fondos aparecen acreditados en firme en nuestras cuentas bancarias (las capturas en tránsito o sujetas a compensación interbancaria se validan al hacerse efectivas). Nos reservamos el derecho de verificar la titularidad en transacciones con tarjeta para prevenir fraude o contracargos.</li>
          </ul>
        </section>

        {/* 7. Pedidos por Chat, Envíos Nacionales y Entregas Fallidas */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <span>7. Pedidos por Chat, Envíos Nacionales y Recepción de Paquetes</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Todo pedido confirmado por el cliente mediante nuestra tienda en línea o por escrito en nuestros canales oficiales de Facebook Messenger, WhatsApp o Instagram constituye una orden de compra firme.
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li>Los envíos cubren los 14 departamentos de El Salvador mediante empresas logísticas aliadas en plazos estimados de 24 a 72 horas hábiles según ruta y municipio (sujetos a condiciones climáticas, viales o fuerza mayor).</li>
            <li>Si un paquete retorna a bodega debido a dirección inexacta suministrada por el cliente o imposibilidad de contacto telefónico al momento de la entrega, la reprogramación generará un nuevo cargo de envío.</li>
            <li>En modalidades de pago contra entrega, el rechazo injustificado de paquetes ya despachados facultará a la empresa para requerir pago anticipado en futuros pedidos del mismo cliente.</li>
          </ul>
        </section>

        {/* 8. Canales Digitales, Privacidad y Jurisdicción */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" />
            <span>8. Atención Digital, Privacidad y Legislación Aplicable</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Nuestros canales digitales operan para brindar asesoría respetuosa y seguimiento transaccional de tus compras; nos reservamos el derecho de suspender la atención ante conductas abusivas, fraudulentas o spam. El tratamiento y eliminación de tus datos personales y de mensajería se rige por nuestra{' '}
            <Link href="/politica-privacidad" className="text-purple-700 underline font-bold">
              Política de Privacidad
            </Link>.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Cualquier controversia derivada de la interpretación o cumplimiento de estos Términos se regirá por las leyes vigentes de la <strong>República de El Salvador</strong>, sometiéndose las partes a la jurisdicción de los tribunales competentes del distrito de <strong>San Salvador</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}

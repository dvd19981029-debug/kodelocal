import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, UserCheck, Eye, FileText } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad',
  description: 'Política de Privacidad y Tratamiento de Datos de GRUPO KODE, S.A.S. DE C.V. (Aromaniak SV, KÖDE y Chatwoot CRM).',
};

export default function PoliticaPrivacidadPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            La presente Política de Privacidad regula el tratamiento de datos personales realizado por <strong>GRUPO KODE, SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE</strong> (abreviadamente <strong>GRUPO KODE, S.A.S. DE C.V.</strong>, El Salvador), titular y operadora de las marcas y plataformas oficiales <strong>Aromaniak SV</strong> (<a href="https://aromaniaksv.com" className="text-purple-700 underline font-bold">https://aromaniaksv.com</a> y <a href="https://pos.aromaniaksv.com" className="text-purple-700 underline font-bold">https://pos.aromaniaksv.com</a>), <strong>KÖDE</strong> (<a href="https://kodesv.com" className="text-purple-700 underline font-bold">https://kodesv.com</a>) y nuestra plataforma interna de atención al cliente <strong>Chatwoot CRM</strong> (<a href="https://chat.kodesv.com" className="text-purple-700 underline font-bold">https://chat.kodesv.com</a>).
          </p>
        </div>

        {/* Sección 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <span>1. Información que Recopilamos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <strong>a) Tienda en línea e Inicio de Sesión con Google (Google Sign-In):</strong> Cuando utilizas nuestra plataforma de comercio electrónico y decides autenticarte con Google, únicamente solicitamos acceso a la información básica de tu perfil público:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li><strong>Nombre y apellidos:</strong> Para personalizar tu experiencia de compra y dirigirnos a ti en tus órdenes.</li>
            <li><strong>Dirección de correo electrónico:</strong> Para asociar tu cuenta de cliente, enviarte comprobantes de tus pedidos, confirmaciones de entrega y notificaciones de estado.</li>
            <li><strong>Foto de perfil (avatar público):</strong> Exclusivamente para mostrar tu avatar en la barra de navegación de tu cuenta dentro de la tienda.</li>
          </ul>
          <p className="text-sm text-slate-600 leading-relaxed font-medium pt-2">
            <strong>b) Canales de Mensajería e Integración con Meta Platforms (Facebook Login y Facebook Messenger):</strong> Cuando un cliente nos escribe a nuestras páginas oficiales de Facebook/Messenger o cuando nuestros administradores autorizados conectan páginas comerciales en <strong>Chatwoot CRM</strong> (<a href="https://chat.kodesv.com" className="text-purple-700 underline font-bold">https://chat.kodesv.com</a>) mediante la API de Meta, recopilamos únicamente:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li><strong>Datos de perfil en Messenger (<code>pages_read_engagement</code>):</strong> Nombre público, foto de perfil e identificador de página (PSID) del remitente para identificar la conversación de soporte.</li>
            <li><strong>Mensajes y archivos enviados (<code>pages_messaging</code>):</strong> El contenido de las consultas, pedidos y comprobantes que el usuario envía voluntariamente para recibir atención humana en tiempo real.</li>
            <li><strong>Metadatos de páginas administradas (<code>pages_show_list</code>, <code>pages_manage_metadata</code>, <code>business_management</code>):</strong> Listado de páginas comerciales de nuestro portafolio empresarial y suscripción de webhooks durante la autenticación con Facebook Login realizada por nuestros propios administradores.</li>
          </ul>
          <p className="text-xs text-purple-900 bg-purple-50 p-3 rounded-xl border border-purple-200 font-semibold">
            No solicitamos ni tenemos acceso a contraseñas personales, listas de amigos ni mensajes privados ajenos a las conversaciones iniciadas directamente con nuestras páginas oficiales.
          </p>
        </section>

        {/* Sección 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <span>2. Uso y Finalidad de los Datos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Los datos obtenidos a través de Google Sign-In, las APIs de Meta (Facebook Messenger / Facebook Login) y durante el proceso de compra se utilizan exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li>Autenticar tu identidad de forma segura y conectar nuestras bandejas oficiales de atención al cliente.</li>
            <li>Recibir y responder en tiempo real tus consultas, cotizaciones y soporte postventa a través de Facebook Messenger y nuestra web.</li>
            <li>Registrar y procesar tus pedidos, generar comprobantes electrónicos y coordinar entregas a domicilio en todo El Salvador o retiro en sucursal.</li>
          </ul>
        </section>

        {/* Sección 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            <span>3. Protección, Encargados de Infraestructura y Retención (No Venta de Datos)</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <strong>GRUPO KODE, S.A.S. DE C.V. (Aromaniak SV / KÖDE) no vende, no alquila ni comercializa datos personales ni Datos de la Plataforma de Meta a terceros, agencias de publicidad o intermediarios de datos.</strong>
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            El tratamiento técnico se apoya estrictamente en proveedores de infraestructura en la nube de primer nivel bajo cifrado SSL/TLS: <strong>Google Cloud Platform (Google LLC, EE. UU.)</strong> para el alojamiento privado de nuestro servidor Chatwoot CRM, <strong>Supabase</strong> para nuestra base de datos segura de pedidos y pasarelas bancarias autorizadas para el cobro. El historial de conversaciones y archivos multimedia de atención al cliente se depura automáticamente tras 90 días de inactividad.
          </p>
        </section>

        {/* Sección 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>4. Derechos del Usuario e Instrucciones para la Eliminación de Datos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Tienes derecho en cualquier momento a solicitar el acceso, rectificación o <strong>eliminación total de tu cuenta, historial de mensajes de Facebook Messenger y datos personales</strong> registrados en Chatwoot CRM y nuestras bases de datos.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <strong>¿Cómo solicitar la eliminación de tus datos (incluidos datos recibidos de Meta / Facebook)?</strong> Envía un correo electrónico a nuestro contacto oficial de privacidad indicando tu nombre, número telefónico o perfil de Facebook/correo asociado con el asunto <em>&quot;Eliminación de Datos&quot;</em>. Procesaremos la eliminación definitiva en un plazo máximo de 5 días hábiles y te enviaremos confirmación por escrito:
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo de privacidad y soporte:</span>
              <span className="text-purple-900 font-extrabold text-sm">dvd19981029@gmail.com</span>
            </div>
            <a 
              href="mailto:dvd19981029@gmail.com" 
              className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black text-center"
            >
              Contactar a Soporte
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

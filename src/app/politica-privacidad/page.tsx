import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, UserCheck, Eye, FileText } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad - Aromaniak SV',
  description: 'Política de Privacidad y Tratamiento de Datos de Aromaniak SV. Información sobre el uso de datos en el inicio de sesión con Google.',
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
        <span className="text-xs text-slate-400 font-medium">Última actualización: Septiembre 2026</span>
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
            En <strong>Aromaniak SV</strong> (sitio web oficial: <a href="https://aromaniaksv.com" className="text-purple-700 underline font-bold">https://aromaniaksv.com</a>), la privacidad de nuestros clientes es una prioridad fundamental.
          </p>
        </div>

        {/* Sección 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <span>1. Información que Recopilamos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Cuando utilizas nuestra plataforma de comercio electrónico y decides autenticarte utilizando <strong>Iniciar Sesión con Google (Google Sign-In)</strong>, únicamente solicitamos acceso a la información básica de tu perfil público:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li><strong>Nombre y apellidos:</strong> Para personalizar tu experiencia de compra y dirigirnos a ti en tus órdenes.</li>
            <li><strong>Dirección de correo electrónico:</strong> Para asociar tu cuenta de cliente, enviarte comprobantes de tus pedidos, confirmaciones de entrega y notificaciones de estado.</li>
            <li><strong>Foto de perfil (avatar público):</strong> Exclusivamente para mostrar tu avatar en la barra de navegación de tu cuenta dentro de la tienda.</li>
          </ul>
          <p className="text-xs text-purple-900 bg-purple-50 p-3 rounded-xl border border-purple-200 font-semibold">
            No solicitamos ni tenemos acceso a contraseñas, contactos, correos personales, archivos de Google Drive ni ninguna otra información privada de tu cuenta de Google.
          </p>
        </section>

        {/* Sección 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <span>2. Uso y Finalidad de los Datos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Los datos obtenidos a través de la autenticación con Google y durante el proceso de compra se utilizan exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2 font-medium">
            <li>Autenticar tu identidad de forma segura sin que tengas que recordar una contraseña adicional.</li>
            <li>Registrar y procesar tus pedidos de esencias, botes de vidrio y materias primas de perfumería fina.</li>
            <li>Generar tus comprobantes electrónicos y coordinar la entrega a domicilio a todo El Salvador o retiro en local.</li>
            <li>Brindarte soporte y atención al cliente sobre tus compras.</li>
          </ul>
        </section>

        {/* Sección 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            <span>3. Protección y Confidencialidad (No Venta de Datos)</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <strong>Aromaniak SV no vende, no alquila ni comercializa datos personales de sus usuarios a terceros, agencias de publicidad o intermediarios de datos.</strong>
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            El intercambio de datos con terceros se limita estrictamente a los proveedores tecnológicos indispensables para el funcionamiento del servicio (nuestra base de datos segura en Supabase protegida con cifrado SSL/TLS y pasarelas de pago autorizadas para el cobro).
          </p>
        </section>

        {/* Sección 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>4. Derechos del Usuario y Eliminación de Datos</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Tienes derecho en cualquier momento a solicitar el acceso, rectificación o eliminación total de tu cuenta y de tus datos personales registrados en nuestra base de datos.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Para solicitar la eliminación de tu cuenta o realizar consultas sobre esta política de privacidad, puedes contactarnos directamente al correo electrónico de soporte:
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

// src/components/blog/ShareButtons.tsx
'use client';

import React, { useState } from 'react';
import { Share2, Check, MessageCircle, Copy } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar enlace:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // Ignorar si el usuario canceló el diálogo nativo
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
        Compartir:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en WhatsApp"
        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors border border-emerald-200/60 flex items-center gap-1.5 text-xs font-bold"
        title="Compartir en WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Facebook"
        className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors border border-blue-200/60 flex items-center gap-1.5 text-xs font-bold"
        title="Compartir en Facebook"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="hidden sm:inline">Facebook</span>
      </a>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X"
        className="p-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-bold"
        title="Compartir en X"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="hidden sm:inline">X</span>
      </a>

      {/* Copiar Enlace */}
      <button
        onClick={handleCopy}
        aria-label="Copiar enlace"
        className="p-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        title="Copiar enlace"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-600 font-bold">¡Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copiar enlace</span>
          </>
        )}
      </button>

      {/* Botón compartir nativo para móviles */}
      <button
        onClick={handleNativeShare}
        aria-label="Más opciones para compartir"
        className="sm:hidden p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}

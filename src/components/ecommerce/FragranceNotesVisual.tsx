'use client';

import React from 'react';
import { FragranceProfile, getFragranceAccordBars } from '@/lib/fragranceProfiles';
import { getNoteImageUrl, NOTES_VERSION } from '@/lib/fragranceNotesData';

interface FragranceNotesVisualProps {
  profile: FragranceProfile;
  showAccords?: boolean;
}

export default function FragranceNotesVisual({ profile, showAccords = true }: FragranceNotesVisualProps) {
  const accordBars = getFragranceAccordBars(profile);

  return (
    <div className={`${showAccords ? 'pt-6 border-t border-slate-200/80' : ''} space-y-7 select-none`}>
      
      {/* ================= 1. ACORDES PRINCIPALES (BARRAS HORIZONTALES ESTILO FRAGRANTICA) ================= */}
      {showAccords && accordBars.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Acordes principales
          </h3>

          <div className="flex flex-col gap-1 w-full max-w-md">
            {accordBars.map((bar, idx) => (
              <div
                key={idx}
                style={{
                  width: `${bar.percentage}%`,
                  backgroundColor: bar.bg,
                  color: bar.text,
                  minWidth: '110px'
                }}
                className="h-8 sm:h-8.5 rounded-r-xl rounded-l-md flex items-center justify-center px-3 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.35)] transition-all duration-300 hover:brightness-105"
              >
                <span className="text-[11px] sm:text-[11.5px] font-black tracking-wide lowercase truncate drop-shadow-xs">
                  {bar.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 2. PIRÁMIDE DEL PERFUME (FOTOS DE INGREDIENTES ESTILO FRAGRANTICA) ================= */}
      <div className="space-y-5">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
          Pirámide del perfume
        </h3>

        <div className="space-y-5">
          
          {/* NOTAS DE SALIDA */}
          {profile.topNotes && profile.topNotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-px bg-slate-200/80 flex-1" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Notas de Salida
                </span>
                <span className="h-px bg-slate-200/80 flex-1" />
              </div>

              <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
                {profile.topNotes.map((note, idx) => {
                  const imgUrl = getNoteImageUrl(note);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 text-center group cursor-default">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_3px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] p-0.5 relative transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                        <img
                          src={imgUrl}
                          alt={note}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `/notes/maderas.jpg?v=${NOTES_VERSION}`;
                          }}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-700 max-w-[80px] leading-tight line-clamp-2">
                        {note.toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CORAZÓN */}
          {profile.heartNotes && profile.heartNotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-px bg-slate-200/80 flex-1" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Corazón
                </span>
                <span className="h-px bg-slate-200/80 flex-1" />
              </div>

              <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
                {profile.heartNotes.map((note, idx) => {
                  const imgUrl = getNoteImageUrl(note);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 text-center group cursor-default">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_3px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] p-0.5 relative transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                        <img
                          src={imgUrl}
                          alt={note}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `/notes/maderas.jpg?v=${NOTES_VERSION}`;
                          }}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-700 max-w-[80px] leading-tight line-clamp-2">
                        {note.toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BASE / FONDO */}
          {profile.baseNotes && profile.baseNotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-px bg-slate-200/80 flex-1" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Base
                </span>
                <span className="h-px bg-slate-200/80 flex-1" />
              </div>

              <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
                {profile.baseNotes.map((note, idx) => {
                  const imgUrl = getNoteImageUrl(note);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 text-center group cursor-default">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_3px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] p-0.5 relative transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                        <img
                          src={imgUrl}
                          alt={note}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `/notes/maderas.jpg?v=${NOTES_VERSION}`;
                          }}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-700 max-w-[80px] leading-tight line-clamp-2">
                        {note.toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

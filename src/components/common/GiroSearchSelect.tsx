'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import {
  CAT_019_GIROS,
  GiroMH,
  searchGirosMH,
  resolveGiroMH,
  formatGiroOption,
} from '@/lib/svGirosCat019';

interface GiroSearchSelectProps {
  value: string;
  onChange: (formattedValue: string, giro?: GiroMH) => void;
  placeholder?: string;
  required?: boolean;
  variant?: 'pos' | 'ecommerce' | 'compact';
  className?: string;
}

export const GiroSearchSelect: React.FC<GiroSearchSelectProps> = ({
  value,
  onChange,
  placeholder = 'Buscar giro por código o actividad (ej. 47722, cosméticos, ropa...)',
  required = false,
  variant = 'pos',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedSelected = useMemo(() => {
    if (!value || !value.trim()) return null;
    return resolveGiroMH(value);
  }, [value]);

  const results = useMemo(() => {
    return searchGirosMH(searchQuery, 60);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (item: GiroMH) => {
    const formatted = formatGiroOption(item);
    onChange(formatted, item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 20);
  };

  const inputBaseClass =
    variant === 'ecommerce'
      ? 'w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#52b747] focus:bg-white transition-all font-medium'
      : variant === 'compact'
      ? 'clay-input w-full pl-8 pr-7 py-1.5 text-xs'
      : 'clay-input w-full pl-9 pr-8 py-2 text-xs';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isOpen && (resolvedSelected || (value && value.trim())) ? (
        <div
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 20);
          }}
          className={`cursor-pointer flex items-center justify-between gap-2 ${
            variant === 'ecommerce'
              ? 'px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#52b747]/60 transition-all'
              : variant === 'compact'
              ? 'clay-input px-2.5 py-1.5 bg-white hover:border-indigo-400 transition-all'
              : 'clay-input px-3 py-2 bg-white hover:border-indigo-400 transition-all'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {resolvedSelected ? (
              <>
                <span
                  className={`font-mono font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                    variant === 'ecommerce'
                      ? 'bg-[#52b747]/15 text-[#2d7a24] border border-[#52b747]/30'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {resolvedSelected.code}
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {resolvedSelected.name}
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-slate-800 truncate">{value}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title="Cambiar o limpiar giro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      ) : (
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            required={required && !value}
            value={searchQuery}
            placeholder={placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            className={inputBaseClass}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 sticky top-0 z-10">
            <span>Catálogo Oficial MH El Salvador (CAT-019 • {CAT_019_GIROS.length} giros)</span>
            {searchQuery && <span>{results.length} resultados</span>}
          </div>

          {results.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              No se encontró actividad económica para &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            results.map((item) => {
              const isSelected = resolvedSelected?.code === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/90 text-indigo-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      className={`font-mono font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="leading-snug break-words">{item.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface KodeSelectOption {
  value: string;
  label: string;
}

interface KodeSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: KodeSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const KodeSelect: React.FC<KodeSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Seleccionar --',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 20);
    } else {
      setSearch('');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`clay-input w-full min-h-[42px] px-3.5 py-2.5 text-xs font-bold flex items-center justify-between gap-2 text-left transition-all cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400'
        } ${
          open
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : ''
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? 'text-slate-800' : 'text-slate-400 font-semibold'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className={`w-6 h-6 rounded-lg bg-slate-100/80 flex items-center justify-center shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-400'
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {options.length > 6 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                Sin coincidencias
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

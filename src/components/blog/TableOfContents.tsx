// src/components/blog/TableOfContents.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 1. Extraer encabezados h2 y h3 del DOM dentro de .blog-prose
    const container = document.querySelector('.blog-prose');
    if (!container) return;

    const headingElements = container.querySelectorAll('h2, h3');
    const items: HeadingItem[] = [];

    headingElements.forEach((el, index) => {
      const text = el.textContent || '';
      if (!text.trim()) return;

      // Asignar ID si no lo tiene
      let id = el.id;
      if (!id) {
        id = `seccion-${index + 1}`;
        el.id = id;
      }

      items.push({
        id,
        text: text.trim(),
        level: el.tagName === 'H2' ? 2 : 3,
      });
    });

    setHeadings(items);

    // 2. IntersectionObserver para iluminar la sección activa mientras se scrollea
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [content]);

  if (headings.length < 2) return null;

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const topOffset = 90;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="my-6 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-bold text-slate-800 text-sm cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-purple-900">
          <List className="w-4 h-4 text-purple-600" />
          Índice del Artículo ({headings.length} secciones)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Lista de Secciones (Expandida o Colapsada) */}
      <div className={`mt-3 space-y-1.5 transition-all duration-300 ${isOpen ? 'block' : 'hidden sm:block'}`}>
        <nav aria-label="Tabla de contenidos">
          <ul className="space-y-1 text-xs sm:text-sm">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <li
                  key={h.id}
                  style={{ paddingLeft: h.level === 3 ? '1rem' : '0' }}
                >
                  <button
                    onClick={() => scrollToHeading(h.id)}
                    className={`text-left w-full py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'text-purple-700 font-bold bg-purple-50'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
                    }`}
                  >
                    {h.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

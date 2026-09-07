'use client';

import { useEffect } from 'react';
import { checkAndMigrateToZeroStock } from '@/lib/store';

export default function StorageInitializer() {
  useEffect(() => {
    const didReset = checkAndMigrateToZeroStock();
    if (didReset) {
      window.dispatchEvent(new Event('storage'));
    }

    // 1. Bloquear gestos nativos de zoom de iOS Safari (pinch/spread)
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('gesturestart', preventDefault, { passive: false });
    document.addEventListener('gesturechange', preventDefault, { passive: false });
    document.addEventListener('gestureend', preventDefault, { passive: false });

    // 2. Bloquear zoom multitáctil de dos dedos (pinch-to-zoom en Chrome y Safari móvil)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // 3. Bloquear doble toque rápido accidental que dispara zoom en navegadores móviles
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement;
        // Permitir interacción estándar con campos de texto y botones pero cancelar el zoom
        if (target && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 4. Bloquear Ctrl + rueda del ratón o pinch en trackpad de laptop
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });

    // 5. Bloquear atajos de teclado de zoom (Ctrl/Cmd + y -)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}

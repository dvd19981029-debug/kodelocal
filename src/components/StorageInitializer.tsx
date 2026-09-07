'use client';

import { useEffect } from 'react';
import { checkAndMigrateToZeroStock } from '@/lib/store';

export default function StorageInitializer() {
  useEffect(() => {
    const didReset = checkAndMigrateToZeroStock();
    if (didReset) {
      window.dispatchEvent(new Event('storage'));
    }

    // Bloqueo seguro de zoom accidental por gestos (pinch) sin interceptar ni cancelar clicks/taps normales
    const preventPinchZoom = (e: Event) => {
      e.preventDefault();
    };

    // Prevenir gestos nativos de pinch en Safari
    document.addEventListener('gesturestart', preventPinchZoom, { passive: false });
    document.addEventListener('gesturechange', preventPinchZoom, { passive: false });
    document.addEventListener('gestureend', preventPinchZoom, { passive: false });

    // Prevenir Ctrl + rueda o pinch de trackpad en computadoras
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Prevenir Ctrl/Cmd +/- zoom de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('gesturestart', preventPinchZoom);
      document.removeEventListener('gesturechange', preventPinchZoom);
      document.removeEventListener('gestureend', preventPinchZoom);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}


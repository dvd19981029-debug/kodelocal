'use client';

import { useEffect } from 'react';
import { checkAndMigrateToZeroStock } from '@/lib/store';

export default function StorageInitializer() {
  useEffect(() => {
    const didReset = checkAndMigrateToZeroStock();
    if (didReset) {
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  return null;
}

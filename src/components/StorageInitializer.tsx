'use client';

import { useEffect } from 'react';
import { checkAndMigrateToZeroStock } from '@/lib/store';

export default function StorageInitializer() {
  useEffect(() => {
    checkAndMigrateToZeroStock();
  }, []);

  return null;
}

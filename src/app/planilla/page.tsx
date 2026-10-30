'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PlanillaModule from '@/components/admin/PlanillaModule';

export default function PlanillaDirectPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Panel Admin</span>
          </Link>
        </div>
        <PlanillaModule />
      </div>
    </div>
  );
}

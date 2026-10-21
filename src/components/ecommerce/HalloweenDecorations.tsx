'use client';

import React from 'react';
import { isHalloweenSeasonActive } from '@/lib/halloweenPromo';
import { useScrolled } from '@/hooks/useScrolled';

export function CobwebCornerSVG({ className = '', flipX = false }: { className?: string; flipX?: boolean }) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${flipX ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      {/* Radial threads from top-left (0,0) */}
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
        <line x1="0" y1="0" x2="215" y2="8" />
        <line x1="0" y1="0" x2="205" y2="55" />
        <line x1="0" y1="0" x2="180" y2="115" />
        <line x1="0" y1="0" x2="140" y2="165" />
        <line x1="0" y1="0" x2="85" y2="200" />
        <line x1="0" y1="0" x2="15" y2="215" />
        {/* Concentric scalloped web rings */}
        <path d="M 42 2 Q 36 12 40 14 Q 32 22 35 28 Q 25 34 26 39 Q 16 42 15 44 Q 6 44 3 45" />
        <path d="M 85 4 Q 74 20 81 24 Q 66 38 71 49 Q 52 58 55 69 Q 34 74 34 83 Q 16 84 6 88" />
        <path d="M 130 5 Q 112 28 124 36 Q 100 58 109 74 Q 80 88 85 106 Q 52 114 53 128 Q 25 130 10 135" />
        <path d="M 178 7 Q 155 36 168 47 Q 138 76 149 98 Q 110 116 116 140 Q 72 152 73 170 Q 35 172 13 180" />
      </g>
      {/* Hanging cute spider on a thread */}
      <line x1="109" y1="74" x2="109" y2="128" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" opacity="0.65" />
      <g transform="translate(109, 134)">
        <circle cx="0" cy="0" r="5.5" fill="#1e1b4b" stroke="#f97316" strokeWidth="1.2" />
        <circle cx="-2" cy="-1" r="1.2" fill="#f97316" />
        <circle cx="2" cy="-1" r="1.2" fill="#f97316" />
        <path d="M-5 -2 Q-10 -6 -12 -2 M-5 0 Q-11 -1 -13 3 M-5 2 Q-10 4 -11 8" stroke="#1e1b4b" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 -2 Q10 -6 12 -2 M5 0 Q11 -1 13 3 M5 2 Q10 4 11 8" stroke="#1e1b4b" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function BatIllustrationSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M40 16 C35 6, 18 2, 2 10 C10 14, 14 21, 12 27 C20 22, 26 25, 29 31 C33 25, 37 26, 40 33 C43 26, 47 25, 51 31 C54 25, 60 22, 68 27 C66 21, 70 14, 78 10 C62 2, 45 6, 40 16 Z"
        fill="currentColor"
      />
      {/* Bat ears */}
      <polygon points="36,16 34,8 39,14" fill="currentColor" />
      <polygon points="44,16 46,8 41,14" fill="currentColor" />
      {/* Glowing orange eyes */}
      <circle cx="38" cy="18" r="1.4" fill="#fb923c" />
      <circle cx="42" cy="18" r="1.4" fill="#fb923c" />
    </svg>
  );
}

export function PumpkinIconSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Stem */}
      <path d="M29 14 C29 7, 35 4, 39 7 C36 9, 35 11, 35 14 Z" fill="#15803d" />
      {/* Pumpkin ribs */}
      <ellipse cx="20" cy="36" rx="14" ry="20" fill="#ea580c" />
      <ellipse cx="44" cy="36" rx="14" ry="20" fill="#ea580c" />
      <ellipse cx="26" cy="36" rx="13" ry="21" fill="#f97316" />
      <ellipse cx="38" cy="36" rx="13" ry="21" fill="#f97316" />
      <ellipse cx="32" cy="36" rx="11" ry="22" fill="#fb923c" />
      {/* Jack-o'-lantern face */}
      <polygon points="21,29 26,22 29,30" fill="#2e1065" />
      <polygon points="43,29 38,22 35,30" fill="#2e1065" />
      <polygon points="32,31 29,36 35,36" fill="#2e1065" />
      <path
        d="M19 41 L24 44 L27 41 L32 45 L37 41 L40 44 L45 41 L41 49 L36 47 L32 50 L28 47 L23 49 Z"
        fill="#2e1065"
      />
    </svg>
  );
}

export default function HalloweenDecorations() {
  return null;
}

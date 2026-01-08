import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <defs>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <filter id="glow-logo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Orbital Ring System */}
    <g className="origin-center animate-[spin_10s_linear_infinite] group-hover:animate-[spin_3s_linear_infinite]">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#a1a1aa" strokeWidth="0.5" strokeOpacity="0.2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#a1a1aa" strokeWidth="0.5" strokeOpacity="0.1" />
      {/* Active Arc */}
      <path d="M 50 4 A 46 46 0 0 1 96 50" fill="none" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="96" cy="50" r="2" fill="#fbbf24" />
    </g>

    {/* Central 3D Tetrahedron Structure */}
    <g transform="translate(50, 55)" className="transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1">
      {/* Back Lines */}
      <polygon points="0,-38 -32,18 32,18" fill="none" stroke="#ea580c" strokeWidth="1" strokeOpacity="0.4" />
      
      {/* Solid Glowing Core */}
      <path d="M 0,-15 L -12,8 L 12,8 Z" fill="#fbbf24" filter="url(#glow-logo)" className="animate-pulse-slow opacity-90" />
      
      {/* Front Wireframe */}
      <line x1="0" y1="-38" x2="-32" y2="18" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="-38" x2="32" y2="18" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="-32" y1="18" x2="0" y2="28" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="18" x2="0" y2="28" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="-38" x2="0" y2="28" stroke="url(#gold-grad)" strokeWidth="0.5" strokeOpacity="0.5" />
    </g>
  </svg>
);
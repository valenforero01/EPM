import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export const EpmLogo: React.FC<LogoProps> = ({ variant = 'dark', compact = false }) => {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="inline-flex items-center justify-center rounded-full bg-[#00A859] text-white font-extrabold tracking-tight px-3.5 py-1 text-sm shadow-sm">
        EPM
      </span>
      {!compact && (
        <span
          className={`font-bold text-sm sm:text-base tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-[#003B5C]'
          }`}
        >
          Empresas Públicas de Medellín
        </span>
      )}
    </span>
  );
};

export const HeroTerritorySvg: React.FC<{ accent?: 'green' | 'blue' | 'amber' }> = ({ accent = 'green' }) => {
  const strokeMain = accent === 'green' ? '#00A859' : accent === 'blue' ? '#38BDF8' : '#F2A900';
  return (
    <svg
      viewBox="0 0 640 380"
      className="w-full h-full object-contain select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="epmHeroGrad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00A859" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#003B5C" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="epmMountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00A859" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00263D" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Ondas de fondo */}
      <circle cx="480" cy="110" r="95" fill="url(#epmHeroGrad1)" />
      <circle cx="520" cy="240" r="130" fill="#00A859" fillOpacity="0.09" />

      {/* Montañas geométricas del Valle de Aburrá */}
      <path
        d="M0 320 L110 215 L210 280 L345 170 L470 265 L560 205 L640 260 L640 380 L0 380 Z"
        fill="url(#epmMountain)"
      />
      <path
        d="M0 345 L140 270 L270 315 L410 235 L540 300 L640 275 L640 380 L0 380 Z"
        fill="#00263D"
        fillOpacity="0.7"
      />

      {/* Líneas de energía y transmisión */}
      <path
        d="M30 140 Q180 70 330 135 T610 115"
        fill="none"
        stroke={strokeMain}
        strokeWidth="3"
        strokeDasharray="8 6"
      />
      <path
        d="M50 185 Q220 120 380 175 T620 155"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* Íconos geométricos de servicios: Energía, Agua, Gas */}
      <g transform="translate(155, 118)">
        <rect width="58" height="58" rx="16" fill="#003B5C" stroke="#00A859" strokeWidth="2" />
        <path d="M32 13 L19 31 H29 L26 45 L39 27 H29 Z" fill="#F2A900" />
      </g>
      <g transform="translate(310, 82)">
        <rect width="62" height="62" rx="18" fill="#003B5C" stroke="#38BDF8" strokeWidth="2" />
        <path d="M31 15 C31 15 19 30 19 38 C19 44.6 24.4 50 31 50 C37.6 50 43 44.6 43 38 C43 30 31 15 31 15 Z" fill="#38BDF8" />
      </g>
      <g transform="translate(465, 130)">
        <rect width="58" height="58" rx="16" fill="#003B5C" stroke="#00A859" strokeWidth="2" />
        <path
          d="M29 14 C35 22 40 28 40 35 C40 41.5 35.1 46 29 46 C22.9 46 18 41.5 18 35 C18 29 22 25 25 22 C24.5 26 26.5 28 29 28 C31.5 28 32.5 24 29 14 Z"
          fill="#00A859"
        />
      </g>
    </svg>
  );
};

export const SustainabilityWaveSvg: React.FC<{ variant: 'water' | 'solar' | 'community' }> = ({ variant }) => {
  const color = variant === 'water' ? '#38BDF8' : variant === 'solar' ? '#F2A900' : '#00A859';
  return (
    <svg viewBox="0 0 320 120" className="w-full h-24" aria-hidden="true">
      <path
        d="M0 78 Q80 35 160 72 T320 55 L320 120 L0 120 Z"
        fill={color}
        fillOpacity="0.18"
      />
      <path
        d="M0 95 Q95 60 190 90 T320 75"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      <circle cx="255" cy="42" r="18" fill={color} fillOpacity="0.22" />
      <circle cx="255" cy="42" r="7" fill={color} />
    </svg>
  );
};

export const NewsCardSvg: React.FC<{ variant: 1 | 2 | 3 }> = ({ variant }) => {
  const bg = variant === 1 ? '#003B5C' : variant === 2 ? '#007A43' : '#00263D';
  const accent = variant === 1 ? '#00A859' : variant === 2 ? '#F2A900' : '#38BDF8';
  return (
    <svg viewBox="0 0 400 180" className="w-full h-44" aria-hidden="true">
      <rect width="400" height="180" fill={bg} />
      <circle cx="330" cy="45" r="70" fill={accent} fillOpacity="0.22" />
      <path
        d="M0 140 L95 85 L185 125 L290 65 L400 120 L400 180 L0 180 Z"
        fill="#FFFFFF"
        fillOpacity="0.1"
      />
      <path
        d="M32 105 Q150 55 260 98 T380 80"
        fill="none"
        stroke={accent}
        strokeWidth="3"
      />
      <rect x="28" y="26" width="44" height="6" rx="3" fill={accent} />
    </svg>
  );
};

export const ClientLoginBannerSvg: React.FC = () => {
  return (
    <svg viewBox="0 0 460 320" className="w-full max-w-md mx-auto" aria-hidden="true">
      <rect x="20" y="24" width="420" height="272" rx="24" fill="#FFFFFF" fillOpacity="0.08" stroke="#FFFFFF" strokeOpacity="0.18" />
      <path
        d="M20 225 L120 165 L220 205 L330 145 L440 200 L440 296 L20 296 Z"
        fill="#00A859"
        fillOpacity="0.24"
      />
      <rect x="65" y="68" width="160" height="92" rx="14" fill="#00263D" stroke="#00A859" strokeWidth="1.5" />
      <rect x="82" y="88" width="60" height="10" rx="5" fill="#00A859" />
      <rect x="82" y="108" width="120" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.45" />
      <rect x="82" y="124" width="90" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.3" />
      <rect x="245" y="92" width="150" height="108" rx="14" fill="#003B5C" stroke="#38BDF8" strokeWidth="1.5" />
      <circle cx="320" cy="134" r="20" fill="#00A859" fillOpacity="0.25" />
      <path d="M312 134 L318 140 L330 128" stroke="#00A859" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="268" y="168" width="104" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.55" />
    </svg>
  );
};

import React from 'react';
import { Info } from 'lucide-react';

export const AcademicRibbon: React.FC = () => {
  return (
    <div
      role="banner"
      className="no-print sticky top-0 z-50 w-full bg-[#001B2C] text-slate-100 border-b border-white/10 px-4 py-1.5 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2"
    >
      <Info className="w-3.5 h-3.5 text-[#00A859] shrink-0" aria-hidden="true" />
      <span>Prototipo académico – datos ficticios. Este no es el sitio oficial de EPM.</span>
    </div>
  );
};

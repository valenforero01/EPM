import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Eye,
  Type,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  UserCheck,
  Zap,
  Droplets,
  Flame,
  Leaf,
  Newspaper,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EpmLogo } from '../common/CustomIllustrations';

interface PublicHeaderProps {
  onScrollToSection: (id: string) => void;
}

const MEGA_MENUS: Record<
  string,
  { title: string; desc: string; targetId: string; icon: React.ReactNode }[]
> = {
  Nosotros: [
    { title: 'Historia e identidad', desc: 'Más de 70 años impulsando bienestar en Antioquia.', targetId: 'nosotros', icon: <Building2 className="w-4 h-4 text-[#00A859]" /> },
    { title: 'Cifras institucionales', desc: 'Cobertura en energía, agua, gas y saneamiento.', targetId: 'cifras', icon: <UserCheck className="w-4 h-4 text-[#00A859]" /> },
  ],
  Servicios: [
    { title: 'Energía Eléctrica', desc: 'Generación, transmisión y medición inteligente AMI.', targetId: 'servicios', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { title: 'Acueducto y Saneamiento', desc: 'Agua potable continua y tratamiento responsable.', targetId: 'servicios', icon: <Droplets className="w-4 h-4 text-sky-500" /> },
    { title: 'Gas Natural', desc: 'Energía limpia y segura para hogares y comercios.', targetId: 'servicios', icon: <Flame className="w-4 h-4 text-emerald-600" /> },
  ],
  Hogares: [
    { title: 'Soluciones para tu hogar', desc: 'Paga tu factura, consulta tarifas y eficiencia.', targetId: 'segmentos', icon: <UserCheck className="w-4 h-4 text-[#00A859]" /> },
    { title: 'Tarifas de referencia', desc: 'Valores ilustrativos por estrato socioeconómico.', targetId: 'tarifas', icon: <Type className="w-4 h-4 text-[#003B5C]" /> },
  ],
  Empresas: [
    { title: 'Aliados productivos', desc: 'Energía solar, gas industrial y telemetría.', targetId: 'segmentos', icon: <Briefcase className="w-4 h-4 text-[#003B5C]" /> },
  ],
  Sostenibilidad: [
    { title: 'Territorios sostenibles', desc: 'Cuencas hídricas, energías limpias y comunidades.', targetId: 'sostenibilidad', icon: <Leaf className="w-4 h-4 text-[#00A859]" /> },
  ],
  Noticias: [
    { title: 'Actualidad EPM', desc: 'Proyectos de modernización y servicio ciudadano.', targetId: 'noticias', icon: <Newspaper className="w-4 h-4 text-[#003B5C]" /> },
  ],
  'Atención al cliente': [
    { title: 'PQR y reclamaciones', desc: 'Autogestión por cobros, lecturas y reconexiones.', targetId: 'pqr-band', icon: <HelpCircle className="w-4 h-4 text-[#00A859]" /> },
    { title: 'Oficinas y canales', desc: 'Atención presencial, telefónica y preguntas frecuentes.', targetId: 'canales', icon: <Phone className="w-4 h-4 text-[#003B5C]" /> },
  ],
};

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onScrollToSection }) => {
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useAppStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (targetId: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    onScrollToSection(targetId);
  };

  return (
    <header className="no-print sticky top-[30px] z-40 w-full shadow-sm">
      {/* 1. Barra utilitaria azul noche */}
      <div className="bg-[#00263D] text-slate-200 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Segmentos institucionales" className="flex items-center gap-4 overflow-x-auto">
            {['Hogares', 'Empresas', 'Constructores', 'Inversionistas'].map((seg, idx) => (
              <button
                key={seg}
                type="button"
                onClick={() => handleNavClick('segmentos')}
                className={`whitespace-nowrap hover:text-white transition-colors ${
                  idx === 0 ? 'font-semibold text-white' : 'text-slate-300'
                }`}
              >
                {seg}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-[#00A859]" aria-hidden="true" />
              Línea de atención (ficticia) <strong className="text-white font-mono">01 8000 000 000</strong>
            </span>

            <div className="flex items-center gap-1.5 border-l border-white/15 pl-3">
              <button
                type="button"
                onClick={() => setFontScale(fontScale === 'normal' ? 'large' : 'normal')}
                aria-label="Alternar tamaño de texto"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 text-slate-200"
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{fontScale === 'large' ? 'A-' : 'A+'}</span>
              </button>
              <button
                type="button"
                onClick={toggleHighContrast}
                aria-label="Alternar alto contraste"
                aria-pressed={highContrast}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  highContrast ? 'bg-[#FFBF47] text-slate-950 font-bold' : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Contraste</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Header principal blanco */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#E2E8EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0" aria-label="Inicio Empresas Públicas de Medellín">
            <EpmLogo />
          </Link>

          {/* Navegación Desktop con megamenús */}
          <nav aria-label="Menú principal" className="hidden xl:flex items-center gap-1">
            {Object.keys(MEGA_MENUS).map((item) => {
              const isOpen = openMenu === item;
              return (
                <div
                  key={item}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenMenu(isOpen ? null : item)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-[#003B5C] hover:text-[#00A859] hover:bg-slate-50 transition-colors"
                  >
                    {item}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full pt-2 w-72 z-50">
                      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8EE] p-2 space-y-1">
                        {MEGA_MENUS[item].map((sub) => (
                          <button
                            key={sub.title}
                            type="button"
                            onClick={() => handleNavClick(sub.targetId)}
                            className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <div className="mt-0.5 shrink-0">{sub.icon}</div>
                            <div>
                              <div className="text-sm font-bold text-[#003B5C]">{sub.title}</div>
                              <div className="text-xs text-slate-500 leading-snug">{sub.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Botones de ingreso a portales */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#003B5C] text-[#003B5C] hover:bg-[#003B5C] hover:text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <Briefcase className="w-4 h-4" aria-hidden="true" />
              Trabajadores EPM
            </Link>
            <Link
              to="/clientes/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              Portal clientes
            </Link>
          </div>

          {/* Botón móvil */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="xl:hidden p-2 rounded-xl border border-slate-200 text-[#003B5C]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Drawer móvil */}
        {mobileOpen && (
          <div className="xl:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(MEGA_MENUS).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(MEGA_MENUS[item][0].targetId)}
                  className="text-left px-3 py-2 rounded-xl bg-slate-50 text-sm font-semibold text-[#003B5C]"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:hidden gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/admin/login"
                className="w-full text-center py-2.5 rounded-xl border border-[#003B5C] text-[#003B5C] text-sm font-semibold"
              >
                Trabajadores EPM
              </Link>
              <Link
                to="/clientes/login"
                className="w-full text-center py-2.5 rounded-xl bg-[#00A859] text-white text-sm font-semibold"
              >
                Portal clientes
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

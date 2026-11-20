import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  FileWarning,
  Wrench,
  CalendarClock,
  Zap,
  Droplets,
  Flame,
  Recycle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Building2,
  Home,
  Factory,
  Leaf,
  Newspaper,
  Phone,
  MapPin,
  ChevronDown,
  UploadCloud,
  Cpu,
  FileCheck2,
  MessageCircle,
} from 'lucide-react';
import { PublicHeader } from '../../components/public/PublicHeader';
import { PublicFooter } from '../../components/public/PublicFooter';
import { ChatbotEpi } from '../../components/common/ChatbotEpi';
import {
  HeroTerritorySvg,
  NewsCardSvg,
  SustainabilityWaveSvg,
} from '../../components/common/CustomIllustrations';
import { REFERENCE_TARIFFS } from '../../data/mockData';
import { formatCOP } from '../../utils/formatters';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    eyebrow: 'Servicios Públicos con Sentido Social',
    title: 'Energía, agua y gas que conectan el progreso de nuestras regiones',
    subtitle:
      'Operamos infraestructura confiable y limpia para llevar bienestar continuo a más de 1,4 millones de hogares e industrias en Antioquia.',
    primaryLabel: 'Ingresar al Portal Clientes',
    primaryTo: '/clientes/login',
    secondaryLabel: 'Conocer servicios',
    secondaryAnchor: 'servicios',
    accent: 'green' as const,
  },
  {
    id: 'slide-2',
    eyebrow: 'Transición Energética y Telemetría',
    title: 'Medición inteligente AMI para un consumo transparente y sostenible',
    subtitle:
      'Monitoreo digital en tiempo real, lectura remota precisa y programas de eficiencia energética para hogares y empresas.',
    primaryLabel: 'Consultar tarifas',
    primaryTo: '#tarifas',
    secondaryLabel: 'Sostenibilidad',
    secondaryAnchor: 'sostenibilidad',
    accent: 'blue' as const,
  },
  {
    id: 'slide-3',
    eyebrow: 'Cuidado del Agua y Comunidades',
    title: 'Protegemos nuestras cuencas hídricas para garantizar el futuro',
    subtitle:
      'Más de 70 años de ingeniería pública comprometida con el saneamiento ambiental y la equidad territorial.',
    primaryLabel: 'Nuestra historia',
    primaryTo: '#nosotros',
    secondaryLabel: 'Canales de atención',
    secondaryAnchor: 'canales',
    accent: 'amber' as const,
  },
];

const FAQS = [
  {
    q: '¿Cómo consulto y pago mi factura de servicios públicos?',
    a: 'Ingresa al Portal Clientes con tu número de contrato de 7 dígitos y tu documento de identidad. Allí podrás revisar el histórico de los últimos 6 meses, descargar detalles y validar tu estado de cuenta.',
  },
  {
    q: '¿Qué hago si me cobraron reconexión después de haber pagado?',
    a: 'Desde el Portal Clientes puedes radicar una PQR en minutos adjuntando el comprobante de pago. El sistema verifica el recaudo frente a la fecha de corte y aplica nota crédito automática si el pago fue oportuno.',
  },
  {
    q: '¿Cómo reporto una lectura errónea del medidor?',
    a: 'Toma una foto nítida de la carátula de tu medidor y radica tu solicitud en el Portal Clientes. Nuestro módulo OCR valida la lectura frente a tu consumo histórico o consulta tu medidor inteligente AMI.',
  },
  {
    q: '¿Cuál es el plazo legal para resolver una PQR?',
    a: 'De acuerdo con la Ley 142 de 1994 (Art. 158), el término máximo de respuesta es de 15 días hábiles contados desde la radicación. Realizamos seguimiento preventivo desde el día 8 y dictamen preventivo en el día 13.',
  },
  {
    q: '¿Cómo reprogramo una visita técnica de verificación?',
    a: 'Al ingresar a "Mis solicitudes" en el Portal Clientes puedes visualizar la fecha y franja horaria asignada (mañana o tarde) y solicitar reprogramación según disponibilidad de cuadrillas.',
  },
  {
    q: '¿Los datos mostrados en esta plataforma son reales?',
    a: 'No. Este es un prototipo académico con datos ficticios diseñado para demostrar el proceso TO-BE "Gestión de PQR por Cobros Improcedentes". No corresponde al portal oficial de EPM.',
  },
];

const TIMELINE_EVENTS = [
  { year: '1955', title: 'Fundación en Medellín', desc: 'Integración de servicios públicos municipales en una sola entidad autónoma.' },
  { year: '1984', title: 'Expansión Hidroeléctrica', desc: 'Consolidación de la generación limpia y cobertura en el Valle de Aburrá.' },
  { year: '2006', title: 'Gas Natural Domiciliario', desc: 'Masificación de redes de gas seguro en estratos 1 al 6.' },
  { year: '2018', title: 'Saneamiento del Río Medellín', desc: 'Modernización de plantas de tratamiento de aguas residuales.' },
  { year: '2026', title: 'Transformación Digital PQR 360', desc: 'Autogestión inteligente con OCR, telemetría AMI y motor de reglas BRMS.' },
];

function useAnimatedCounter(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      setVal(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

export const HomePage: React.FC = () => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeSegment, setActiveSegment] = useState<'hogar' | 'empresa'>('hogar');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cYears = useAnimatedCounter(71);
  const cHomes = useAnimatedCounter(1450);
  const cMunicipalities = useAnimatedCounter(125);
  const cCoverage = useAnimatedCounter(99);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const slide = HERO_SLIDES[slideIdx];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FA]">
      <PublicHeader onScrollToSection={scrollToSection} />

      <main className="flex-1">
        {/* 3. HERO PRINCIPAL CON CARRUSEL AUTOMÁTICO */}
        <section
          aria-label="Portada institucional"
          className="relative bg-gradient-to-br from-[#00263D] via-[#003B5C] to-[#005844] text-white overflow-hidden min-h-[520px] lg:min-h-[560px] flex items-center"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 space-y-6"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-300 border-l-2 border-[#00A859] pl-3">
                {slide.eyebrow}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-extrabold leading-[1.1] tracking-tight">
                {slide.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {slide.primaryTo.startsWith('#') ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(slide.primaryTo.slice(1))}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00A859] hover:bg-[#007A43] text-white font-bold text-sm sm:text-base shadow-lg transition-colors"
                  >
                    {slide.primaryLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to={slide.primaryTo}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00A859] hover:bg-[#007A43] text-white font-bold text-sm sm:text-base shadow-lg transition-colors"
                  >
                    {slide.primaryLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => scrollToSection(slide.secondaryAnchor)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base transition-colors"
                >
                  {slide.secondaryLabel}
                </button>
              </div>

              {/* Controles de carrusel */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  aria-label="Diapositiva anterior"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  {HERO_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Ir a diapositiva ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === slideIdx ? 'w-8 bg-[#00A859]' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
                  aria-label="Siguiente diapositiva"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <div className="lg:col-span-5 h-64 sm:h-80 lg:h-96">
              <HeroTerritorySvg accent={slide.accent} />
            </div>
          </div>
        </section>

        {/* 4. ACCESOS RÁPIDOS SUPERPUESTOS */}
        <section aria-label="Accesos rápidos" className="relative z-10 -mt-10 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Consulta y paga tu factura',
                  desc: 'Revisa tus últimos 6 periodos y fechas de corte.',
                  to: '/clientes/login',
                  icon: <CreditCard className="w-6 h-6 text-[#00A859]" />,
                },
                {
                  title: 'PQR y reclamaciones',
                  desc: 'Autogestión por reconexión, lecturas o tarifas.',
                  to: '/clientes/login',
                  icon: <FileWarning className="w-6 h-6 text-[#003B5C]" />,
                },
                {
                  title: 'Reportar daño o fuga',
                  desc: 'Atención prioritaria para emergencias en red.',
                  anchor: 'canales',
                  icon: <Wrench className="w-6 h-6 text-amber-600" />,
                },
                {
                  title: 'Programar visita técnica',
                  desc: 'Agenda verificación de medidor en tu predio.',
                  to: '/clientes/login',
                  icon: <CalendarClock className="w-6 h-6 text-sky-600" />,
                },
              ].map((item) => {
                const content = (
                  <div className="h-full bg-white rounded-2xl border border-[#E2E8EE] p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#003B5C] leading-snug">{item.title}</h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );

                return item.to ? (
                  <Link key={item.title} to={item.to} className="block">
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => scrollToSection(item.anchor!)}
                    className="text-left block w-full"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. CIFRAS INSTITUCIONALES ANIMADAS */}
        <section id="cifras" className="py-12 bg-white border-y border-[#E2E8EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: `${cYears} años`, label: 'De historia desde 1955' },
                { value: `${cHomes.toLocaleString('es-CO')} mil+`, label: 'Hogares conectados (ilustrativo)' },
                { value: `${cMunicipalities}`, label: 'Municipios atendidos en Antioquia' },
                { value: `${cCoverage},4 %`, label: 'Continuidad promedio en red' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#003B5C] tabular-nums">
                    {stat.value}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. NUESTROS SERVICIOS */}
        <section id="servicios" className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                Portafolio Esencial
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003B5C] mt-1">
                Nuestros servicios públicos
              </h2>
              <p className="text-slate-600 mt-2">
                Infraestructura pública moderna orientada a la continuidad, calidad del servicio y medición transparente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Energía Eléctrica',
                  desc: 'Generación hidroeléctrica y solar con redes inteligentes y telemetría AMI.',
                  icon: <Zap className="w-6 h-6 text-amber-500" />,
                  bg: 'bg-amber-50',
                },
                {
                  title: 'Acueducto',
                  desc: 'Captación, potabilización y distribución continua de agua apta para el consumo.',
                  icon: <Droplets className="w-6 h-6 text-sky-600" />,
                  bg: 'bg-sky-50',
                },
                {
                  title: 'Gas Natural',
                  desc: 'Suministro eficiente para cocción, calefacción y movilidad limpia vehicular.',
                  icon: <Flame className="w-6 h-6 text-emerald-600" />,
                  bg: 'bg-emerald-50',
                },
                {
                  title: 'Saneamiento',
                  desc: 'Recolección y tratamiento de aguas residuales para proteger nuestros ríos.',
                  icon: <Recycle className="w-6 h-6 text-[#003B5C]" />,
                  bg: 'bg-slate-100',
                },
              ].map((srv) => (
                <motion.div
                  key={srv.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className="bg-white rounded-2xl border border-[#E2E8EE] p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${srv.bg} flex items-center justify-center mb-4`}>
                      {srv.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#003B5C]">{srv.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{srv.desc}</p>
                  </div>
                  <Link
                    to="/clientes/login"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00A859] hover:text-[#007A43] mt-5"
                  >
                    Gestionar contrato
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. PARA TU HOGAR / PARA TU EMPRESA */}
        <section id="segmentos" className="py-16 bg-white border-y border-[#E2E8EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                  Soluciones por Segmento
                </span>
                <h2 className="text-3xl font-extrabold text-[#003B5C] mt-1">
                  Diseñado para cada necesidad
                </h2>
              </div>

              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start">
                <button
                  type="button"
                  onClick={() => setActiveSegment('hogar')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeSegment === 'hogar' ? 'bg-[#003B5C] text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Para tu hogar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSegment('empresa')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeSegment === 'empresa' ? 'bg-[#003B5C] text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  Para tu empresa
                </button>
              </div>
            </div>

            {activeSegment === 'hogar' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Facturación clara y digital',
                    desc: 'Consulta tus consumos mensuales de kWh o m³ y compara tu histórico de los últimos 6 meses.',
                  },
                  {
                    title: 'Subsidios por estratificación',
                    desc: 'Aplicación automática de tarifas diferenciales en estratos 1, 2 y 3 conforme a la regulación.',
                  },
                  {
                    title: 'Autogestión sin filas',
                    desc: 'Reporta pagos recientes o toma foto a tu medidor desde casa para validar cobros al instante.',
                  },
                ].map((c) => (
                  <div key={c.title} className="rounded-2xl bg-[#F5F8FA] border border-[#E2E8EE] p-6">
                    <CheckCircle2 className="w-6 h-6 text-[#00A859] mb-3" />
                    <h3 className="text-lg font-bold text-[#003B5C]">{c.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Medición horaria y respaldo',
                    desc: 'Telemetría avanzada AMI para comercios, clínicas, industrias y constructoras.',
                  },
                  {
                    title: 'Soluciones solares y eficiencia',
                    desc: 'Acompañamiento técnico en autogeneración fotovoltaica y reducción de huella de carbono.',
                  },
                  {
                    title: 'Gestión múltiple de contratos',
                    desc: 'Seguimiento centralizado de facturación, órdenes de servicio y peticiones corporativas.',
                  },
                ].map((c) => (
                  <div key={c.title} className="rounded-2xl bg-[#F5F8FA] border border-[#E2E8EE] p-6">
                    <Building2 className="w-6 h-6 text-[#003B5C] mb-3" />
                    <h3 className="text-lg font-bold text-[#003B5C]">{c.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 8. NOSOTROS + VALORES + LÍNEA DE TIEMPO 1955–2026 */}
        <section id="nosotros" className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                  Propósito Empresarial
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003B5C]">
                  Más de siete décadas construyendo confianza pública
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Nacimos en 1955 para integrar el desarrollo urbano y rural con servicios públicos de excelencia. Nuestro compromiso combina rigurosidad técnica, transparencia tarifaria y cercanía con la comunidad.
                </p>
              </div>
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Transparencia', desc: 'Criterios claros en liquidación y facturación.' },
                  { title: 'Innovación', desc: 'Automatización digital centrada en el ciudadano.' },
                  { title: 'Sostenibilidad', desc: 'Equilibrio hídrico, energético y social.' },
                ].map((v) => (
                  <div key={v.title} className="bg-white rounded-2xl border border-[#E2E8EE] p-5 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00A859] mb-3" />
                    <h3 className="font-bold text-[#003B5C]">{v.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Línea de tiempo horizontal */}
            <div className="bg-white rounded-2xl border border-[#E2E8EE] p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">
                Hitos de Evolución Institucional (1955 – 2026)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {TIMELINE_EVENTS.map((ev) => (
                  <div key={ev.year} className="relative border-l-2 lg:border-l-0 lg:border-t-2 border-[#00A859] pl-4 lg:pl-0 lg:pt-4">
                    <span className="font-mono text-lg font-extrabold text-[#003B5C]">{ev.year}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{ev.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 9. SOSTENIBILIDAD Y TERRITORIOS */}
        <section id="sostenibilidad" className="py-16 bg-white border-y border-[#E2E8EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                Compromiso Ambiental
              </span>
              <h2 className="text-3xl font-extrabold text-[#003B5C] mt-1">
                Sostenibilidad y territorios
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Protección de Cuencas Hídricas',
                  desc: 'Conservación de más de 42.000 hectáreas de bosques protectores que abastecen nuestros embalses.',
                  variant: 'water' as const,
                  grad: 'from-sky-50 to-white',
                },
                {
                  title: 'Energías Limpias y Microredes',
                  desc: 'Integración de parques solares fotovoltaicos y modernización de subestaciones digitales.',
                  variant: 'solar' as const,
                  grad: 'from-amber-50 to-white',
                },
                {
                  title: 'Equidad en el Territorio',
                  desc: 'Programas de acceso al agua y energía en barrios de ladera y municipios del área metropolitana.',
                  variant: 'community' as const,
                  grad: 'from-emerald-50 to-white',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-[#E2E8EE] bg-gradient-to-b ${card.grad} overflow-hidden shadow-sm flex flex-col justify-between`}
                >
                  <div className="p-6">
                    <Leaf className="w-6 h-6 text-[#00A859] mb-3" />
                    <h3 className="text-lg font-bold text-[#003B5C]">{card.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{card.desc}</p>
                  </div>
                  <SustainabilityWaveSvg variant={card.variant} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. NOTICIAS FICTICIAS */}
        <section id="noticias" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                  Sala de Prensa (Ficticia)
                </span>
                <h2 className="text-3xl font-extrabold text-[#003B5C] mt-1">
                  Actualidad e innovación
                </h2>
              </div>
              <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                Publicaciones ilustrativas de prototipo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  v: 1 as const,
                  date: '14/10/2026',
                  title: 'Despliegue de 85.000 nuevos medidores inteligentes AMI en el Valle de Aburrá',
                  desc: 'La telemetría bidireccional reduce errores de lectura manual y agiliza las validaciones en línea.',
                },
                {
                  v: 2 as const,
                  date: '02/10/2026',
                  title: 'Nuevo modelo de atención digital reduce tiempos de respuesta PQR a minutos',
                  desc: 'Con validación automática de recaudo y reglas de negocio, los clientes obtienen constancia inmediata.',
                },
                {
                  v: 3 as const,
                  date: '21/09/2026',
                  title: 'Plan de mantenimiento preventivo en redes de acueducto de Envigado e Itagüí',
                  desc: 'Renovación de tuberías maestras para sostener la continuidad del servicio durante el último trimestre.',
                },
              ].map((news) => (
                <article
                  key={news.title}
                  className="bg-white rounded-2xl border border-[#E2E8EE] overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
                >
                  <NewsCardSvg variant={news.v} />
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-500">{news.date}</span>
                      <h3 className="text-lg font-bold text-[#003B5C] mt-1.5 leading-snug">{news.title}</h3>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{news.desc}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 11. BANDA SECUNDARIA DE PQR Y RECLAMACIONES (EXPLICITAMENTE DESPUÉS DE NOTICIAS) */}
        <section id="pqr-band" className="py-16 lg:py-20 bg-gradient-to-br from-[#003B5C] to-[#00263D] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-5">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                  Proceso TO-BE · PQR 360
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                  ¿Tienes una inquietud con tu factura?
                </h2>
                <p className="text-slate-200 leading-relaxed">
                  Si detectaste un cobro de reconexión tras haber pagado oportunamente, una lectura inconsistente o una tarifa de contador equivocada, nuestro canal de autogestión analiza tu caso en cuatro pasos.
                </p>
                <div className="pt-2">
                  <Link
                    to="/clientes/login"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00A859] hover:bg-[#007A43] text-white font-bold shadow-lg transition-colors"
                  >
                    Ir a PQR y reclamaciones
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    step: '01',
                    title: 'Cuéntanos tu caso',
                    desc: 'Selecciona el periodo facturado y el motivo de inconformidad en el Portal Clientes.',
                    icon: <MessageCircle className="w-5 h-5 text-emerald-300" />,
                  },
                  {
                    step: '02',
                    title: 'Adjunta comprobante o foto',
                    desc: 'Extraemos datos mediante OCR y validamos tu pago contra el recaudo en línea.',
                    icon: <UploadCloud className="w-5 h-5 text-emerald-300" />,
                  },
                  {
                    step: '03',
                    title: 'Validación automática BRMS',
                    desc: 'Decisión inmediata (STP), telemetría AMI o agenda directa de visita técnica.',
                    icon: <Cpu className="w-5 h-5 text-emerald-300" />,
                  },
                  {
                    step: '04',
                    title: 'Recibe tu constancia',
                    desc: 'Descarga el soporte formal con radicado y envíalo a tu correo electrónico.',
                    icon: <FileCheck2 className="w-5 h-5 text-emerald-300" />,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300">PASO {item.step}</span>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-base text-white">{item.title}</h3>
                    <p className="text-xs text-slate-200 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 12. TARIFAS DE REFERENCIA */}
        <section id="tarifas" className="py-16 bg-white border-b border-[#E2E8EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                Transparencia Tarifaria
              </span>
              <h2 className="text-3xl font-extrabold text-[#003B5C] mt-1">
                Tarifas de referencia por estrato (2026)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Valores unitarios ilustrativos en pesos colombianos (COP) utilizados por el motor de liquidación del prototipo.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E2E8EE] shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#003B5C] text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Estrato</th>
                    <th className="px-4 py-3.5 text-right">Energía ($/kWh)</th>
                    <th className="px-4 py-3.5 text-right">Cargo Fijo Energía</th>
                    <th className="px-4 py-3.5 text-right">Acueducto ($/m³)</th>
                    <th className="px-4 py-3.5 text-right">Cargo Fijo Acueducto</th>
                    <th className="px-4 py-3.5 text-right">Gas ($/m³)</th>
                    <th className="px-4 py-3.5 text-right">Cargo Fijo Gas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {REFERENCE_TARIFFS.map((t) => (
                    <tr key={t.estrato} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-[#003B5C]">Estrato {t.estrato}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.energiaKwh)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.cargoFijoEnergia)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.acueductoM3)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.cargoFijoAcueducto)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.gasM3)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCOP(t.cargoFijoGas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 13. CANALES DE ATENCIÓN Y OFICINAS */}
        <section id="canales" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                  Cercanía Ciudadana
                </span>
                <h2 className="text-3xl font-extrabold text-[#003B5C]">
                  Canales y oficinas de atención
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Además de nuestro Portal Clientes 24/7 y el asistente virtual Epi, dispones de puntos de atención presenciales simulados en el Área Metropolitana del Valle de Aburrá.
                </p>
                <div className="bg-white rounded-2xl border border-[#E2E8EE] p-5 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-bold text-[#003B5C]">
                    <Phone className="w-4 h-4 text-[#00A859]" />
                    Línea de Atención (Ficticia): 01 8000 000 000
                  </div>
                  <p className="text-xs text-slate-600">
                    Horario telefónico: Lunes a viernes 7:00 a.m. – 6:00 p.m. · Emergencias 24 horas.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Oficina Edificio Inteligente', addr: 'Carrera 58 #42-125, Medellín', hours: 'Lun–Vie 7:30 a.m. – 4:30 p.m.' },
                  { name: 'Punto de Atención Laureles', addr: 'Circular 4 #73-12, Medellín', hours: 'Lun–Vie 8:00 a.m. – 4:00 p.m.' },
                  { name: 'Oficina Envigado Centro', addr: 'Calle 38 Sur #43-28, Envigado', hours: 'Lun–Vie 8:00 a.m. – 4:00 p.m.' },
                  { name: 'Oficina Bello Niquía', addr: 'Diagonal 50A #38-20, Bello', hours: 'Lun–Sáb 8:00 a.m. – 1:00 p.m.' },
                ].map((off) => (
                  <div key={off.name} className="bg-white rounded-2xl border border-[#E2E8EE] p-5 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-[#00A859] shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm text-[#003B5C]">{off.name}</h3>
                        <p className="text-xs text-slate-600 mt-1">{off.addr}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{off.hours}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 14. PREGUNTAS FRECUENTES (ACORDEÓN) */}
        <section id="faq" className="py-16 bg-white border-t border-[#E2E8EE]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00A859]">
                Centro de Ayuda
              </span>
              <h2 className="text-3xl font-extrabold text-[#003B5C] mt-1">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-[#E2E8EE] bg-[#F5F8FA] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-[#003B5C] hover:bg-slate-100/70 transition-colors"
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#00A859]' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
      <ChatbotEpi />
    </div>
  );
};

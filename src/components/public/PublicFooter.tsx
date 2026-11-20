import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { EpmLogo } from '../common/CustomIllustrations';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#00263D] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Columna 1 */}
          <div className="space-y-4">
            <EpmLogo variant="light" />
            <p className="text-xs leading-relaxed text-slate-300">
              Impulsamos el bienestar y desarrollo sostenible de los territorios mediante energía eléctrica, acueducto, saneamiento y gas natural.
            </p>
            <div className="text-xs text-emerald-300 font-medium">
              Prototipo académico – datos ficticios
            </div>
          </div>

          {/* Columna 2 */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Portales y Accesos</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/clientes/login" className="hover:text-[#00A859] transition-colors">
                  Portal Clientes · Autogestión PQR 360
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#00A859] transition-colors">
                  Consola Trabajadores EPM
                </Link>
              </li>
              <li>
                <a href="#tarifas" className="hover:text-[#00A859] transition-colors">
                  Tarifas de referencia 2026
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#00A859] transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3 */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Atención Ciudadana (Ficticia)</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00A859] shrink-0" aria-hidden="true" />
                <span>Línea única: 01 8000 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00A859] shrink-0" aria-hidden="true" />
                <span>atencion.prototipo@ejemplo.co</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Edificio Inteligente (Simulado), Carrera 58 #42-125, Medellín</span>
              </li>
            </ul>
          </div>

          {/* Columna 4 */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Marco Legal y Privacidad</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>Ley 142 de 1994:</strong> Régimen de servicios públicos domiciliarios. Plazo legal de 15 días hábiles para resolver PQR y aplicación de silencio administrativo positivo.
                </span>
              </p>
              <p>
                <strong>Ley 1581 de 2012:</strong> Protección y tratamiento autorizado de datos personales para verificación de facturación y contacto ciudadano.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 Prototipo Académico EPM – PQR 360. Todos los datos son simulados.</p>
          <p>Este no es el sitio oficial de Empresas Públicas de Medellín E.S.P.</p>
        </div>
      </div>
    </footer>
  );
};

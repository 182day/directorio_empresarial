// src/pages/Directory.tsx
import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Search, Building2, MapPin, Globe, ShieldCheck, Layers, X } from 'lucide-react';
import CountUpModule from 'react-countup';
const CountUp = (CountUpModule as any).default || CountUpModule;

interface Company {
  _id: string;
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa?: string;
  tamanio?: string;
  anioInicio: number;
  sitioWeb?: string;
  tipoOperaciones: string[];
  ubicacion: {
    estado: string;
    municipio: string;
  };
  activa: boolean;
}

export const Directory = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtroTamano, setFiltroTamano] = useState<string | null>(null); // 👈 Nuevo estado para el filtro por tamaño

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies', {
        params: { busqueda: search }
      });
      setCompanies(response.data);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar solo las activas
  const empresasActivas = useMemo(() => {
    return companies.filter(p => p.activa === true);
  }, [companies]);

  // Calcular contadores por tamaño dinámicamente basados en empresas activas
  const conteoTamano = useMemo(() => {
    const conteo: Record<string, number> = {
      Micro: 0,
      Pequeña: 0,
      Mediana: 0,
      Grande: 0
    };

    empresasActivas.forEach(c => {
      const tam = (c.tamanoEmpresa || c.tamanio || 'Micro').trim();
      if (conteo[tam] !== undefined) {
        conteo[tam] += 1;
      } else {
        conteo[tam] = (conteo[tam] || 0) + 1;
      }
    });

    return conteo;
  }, [empresasActivas]);

  // 🔍 Aplicar el filtro de tamaño junto con el listado activo
  const empresasFiltradas = useMemo(() => {
    if (!filtroTamano) return empresasActivas;
    return empresasActivas.filter(c => {
      const tam = (c.tamanoEmpresa || c.tamanio || 'Micro').trim();
      return tam === filtroTamano;
    });
  }, [empresasActivas, filtroTamano]);

  return (
    <div className="w-full space-y-8">
      {/* Hero & Buscador */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-white mb-3">
          Encuentra empresas e industrias clave
        </h2>
        <p className="text-slate-400 text-sm">
          Explora las organizaciones registradas, ubicaciones y sectores de operación.
        </p>

        {/* Campo de Búsqueda */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre Comercial, Razón Social o RFC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-lg transition-colors"
          />
        </div>
      </div>

      {/* 📊 PANEL DE ESTADÍSTICAS / FILTROS CON REACT-COUNTUP */}
      {!loading && empresasActivas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filtrar por tamaño de empresa:
            </span>
            {filtroTamano && (
              <button
                onClick={() => setFiltroTamano(null)}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar filtro ({filtroTamano})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(conteoTamano).map(([tamano, cantidad]) => {
              const isSelected = filtroTamano === tamano;
              return (
                <div 
                  key={tamano}
                  onClick={() => setFiltroTamano(isSelected ? null : tamano)} // 👈 Alternar selección al hacer clic
                  className={`cursor-pointer rounded-xl p-4 text-center shadow-md transition-all border ${
                    isSelected 
                      ? 'bg-blue-600/20 border-blue-500 shadow-blue-500/10 ring-1 ring-blue-500' 
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
                    <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{tamano}</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    <CountUp end={cantidad} duration={1.5} separator="," />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listado de Tarjetas */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          Cargando empresas...
        </div>
      ) : empresasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No se encontraron empresas con esos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">     
          {empresasFiltradas.map((company) => (
            <div
              key={company._id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {company.nombreComercial}
                  </h3>
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-full whitespace-nowrap">
                    {company.tamanoEmpresa || company.tamanio || 'Micro'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4">{company.razonSocial}</p>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      {company.ubicacion?.municipio}, {company.ubicacion?.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>RFC: {company.rfc}</span>
                  </div>
                </div>

                {/* Badges de Operaciones */}
                {company.tipoOperaciones && company.tipoOperaciones.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {company.tipoOperaciones.map((op, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-900 text-slate-400 text-xs rounded border border-slate-700"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {company.sitioWeb && (
                <div className="mt-6 pt-4 border-t border-slate-700/60">
                  <a
                    href={company.sitioWeb.startsWith('http') ? company.sitioWeb : `https://${company.sitioWeb}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Visitar Sitio Web</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
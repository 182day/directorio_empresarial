// src/pages/Directory.tsx
import { useMemo } from 'react';
import { useCompanyStore } from '../stores/useCompanyStore'; 
import { Layers, MapPin, Activity, Truck, Globe, Send, Briefcase, Award, Building } from 'lucide-react';
import CountUpModule from 'react-countup';
const CountUp = (CountUpModule as any).default || CountUpModule;
import { type DirectoryCompany as Company } from '../interfaces/company.interface';

// Helper para agrupar elementos con frecuencia = 1 en "Otros"
const agruparUnicosEnOtros = (conteo: Record<string, number>): Record<string, number> => {
  const resultado: Record<string, number> = {};
  let totalOtros = 0;

  Object.entries(conteo).forEach(([key, cantidad]) => {
    if (cantidad === 1) {
      totalOtros += 1;
    } else {
      resultado[key] = cantidad;
    }
  });

  if (totalOtros > 0) {
    resultado['Otros'] = totalOtros;
  }

  return resultado;
};

export const Directory = () => {
  // Extraemos las empresas y el estado de carga desde el Store de Zustand
  const { companies, loading } = useCompanyStore() as { companies: Company[]; loading: boolean };

  // 0. Filtrado de empresas activas
  const empresasActivas = useMemo(() => {
    if (!Array.isArray(companies)) return [];
    return companies.filter(p => p.activa === true);
  }, [companies]);

  // 1. Conteo por Tamaño
  const conteoTamano = useMemo(() => {
    const conteo: Record<string, number> = { Micro: 0, Pequeña: 0, Mediana: 0, Grande: 0 };
    empresasActivas.forEach(c => {
      const tam = (c.tamanoEmpresa || c.tamanio || 'Micro').trim();
      conteo[tam] = (conteo[tam] || 0) + 1;
    });
    return conteo;
  }, [empresasActivas]);

  // 2. Conteo por Estado (Ubicación)
  const conteoEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const estado = c.ubicacion?.estado?.trim();
      if (estado) {
        conteo[estado] = (conteo[estado] || 0) + 1;
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 3. Conteo por Municipio (Solo Querétaro)
  const conteoMunicipioQueretaro = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const estado = c.ubicacion?.estado?.trim().toLowerCase() || '';
      const municipio = c.ubicacion?.municipio?.trim();

      const esQueretaro = estado.includes('querétaro') || estado.includes('queretaro') || estado === 'qro';

      if (esQueretaro && municipio) {
        conteo[municipio] = (conteo[municipio] || 0) + 1;
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 4. Conteo por Tipo de Operaciones
  const conteoOperaciones = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      if (Array.isArray(c.tipoOperaciones)) {
        c.tipoOperaciones.forEach(op => {
          const key = op.trim();
          if (key) conteo[key] = (conteo[key] || 0) + 1;
        });
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 5. Conteo por Tipo de Suministro
  const conteoSuministro = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      if (Array.isArray(c.tipoSuministro)) {
        c.tipoSuministro.forEach(sum => {
          const key = sum.trim();
          if (key) conteo[key] = (conteo[key] || 0) + 1;
        });
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 6. Conteo por Sectores a los que Pertenece
  const conteoSectoresPertenece = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const listaSectores = c.informacionEmpresa?.sectoresPertenece?.lista;
      if (Array.isArray(listaSectores)) {
        listaSectores.forEach(sec => {
          const key = sec.trim();
          if (key) conteo[key] = (conteo[key] || 0) + 1;
        });
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 7. Conteo por Certificaciones
  const conteoCertificaciones = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const listaCert = c.informacionEmpresa?.certificaciones?.lista;
      if (Array.isArray(listaCert)) {
        listaCert.forEach(cert => {
          const key = cert.trim();
          if (key) conteo[key] = (conteo[key] || 0) + 1;
        });
      }
    });
    return conteo;
  }, [empresasActivas]);

  // 8. Conteo por País de Origen
  const conteoPaisOrigen = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const pais = c.informacionEmpresa?.paisOrigen?.trim();
      if (pais) {
        conteo[pais] = (conteo[pais] || 0) + 1;
      }
    });
    return agruparUnicosEnOtros(conteo);
  }, [empresasActivas]);

  // 9. Conteo por Destino de Exportaciones
  const conteoDestinoExportacion = useMemo(() => {
    const conteo: Record<string, number> = {};
    empresasActivas.forEach(c => {
      const destinos = c.informacionEmpresa?.destinoExportaciones;
      if (Array.isArray(destinos)) {
        destinos.forEach(dest => {
          const key = dest.trim();
          if (key) conteo[key] = (conteo[key] || 0) + 1;
        });
      }
    });
    return agruparUnicosEnOtros(conteo);
  }, [empresasActivas]);

  const renderMetricGrid = (
    titulo: string, 
    data: Record<string, number>, 
    icon: React.ReactNode, 
    emptyMessage: string
  ) => {
    const entries = Object.entries(data);
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-app-muted flex items-center gap-2">
          {icon}
          <span>{titulo}</span>
        </h3>
        {entries.length === 0 ? (
          <p className="text-xs text-app-muted italic bg-app-card p-3 rounded-lg border border-app-border">
            {emptyMessage}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {entries.map(([label, cantidad]) => (
              <div 
                key={label} 
                className="bg-app-card border border-app-border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-xs font-medium text-app-muted block truncate mb-1" title={label}>
                  {label}
                </span>
                <div className="text-2xl font-black text-app-text">
                  <CountUp end={cantidad} duration={1.5} separator="," />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-app-text mb-3">
          Estadísticas del Directorio Empresarial
        </h2>
        <p className="text-app-muted text-sm">
          Métricas consolidadas de las empresas registradas en la plataforma.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-app-muted">
          Cargando estadísticas...
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Tamaño de Empresa */}
          {renderMetricGrid(
            "Distribución por Tamaño de Empresa", 
            conteoTamano, 
            <Layers className="w-4 h-4 text-blue-500" />,
            "No hay datos de tamaño registrados."
          )}

          {/* 2. Ubicación por Estado */}
          {renderMetricGrid(
            "Distribución por Estado", 
            conteoEstado, 
            <MapPin className="w-4 h-4 text-emerald-500" />,
            "No hay estados registrados."
          )}

          {/* 3. Ubicación por Municipio (Querétaro) */}
          {renderMetricGrid(
            "Municipios de Querétaro", 
            conteoMunicipioQueretaro, 
            <Building className="w-4 h-4 text-teal-500" />,
            "No hay municipios registrados para Querétaro."
          )}

          {/* 4. Tipos de Operaciones */}
          {renderMetricGrid(
            "Tipos de Operaciones", 
            conteoOperaciones, 
            <Activity className="w-4 h-4 text-indigo-500" />,
            "No hay operaciones registradas."
          )}

          {/* 5. Tipos de Suministro */}
          {renderMetricGrid(
            "Tipos de Suministro", 
            conteoSuministro, 
            <Truck className="w-4 h-4 text-amber-500" />,
            "No hay tipos de suministro registrados."
          )}

          {/* 6. Sectores a los que Pertenece */}
          {renderMetricGrid(
            "Sectores a los que Pertenece", 
            conteoSectoresPertenece, 
            <Briefcase className="w-4 h-4 text-purple-500" />,
            "No hay sectores registrados."
          )}

          {/* 7. Certificaciones */}
          {renderMetricGrid(
            "Certificaciones", 
            conteoCertificaciones, 
            <Award className="w-4 h-4 text-yellow-500" />,
            "No hay certificaciones registradas."
          )}

          {/* 8. País de Origen */}
          {renderMetricGrid(
            "País de Origen", 
            conteoPaisOrigen, 
            <Globe className="w-4 h-4 text-cyan-500" />,
            "No hay países de origen registrados."
          )}

          {/* 9. Destino de Exportaciones */}
          {renderMetricGrid(
            "Destinos de Exportación", 
            conteoDestinoExportacion, 
            <Send className="w-4 h-4 text-rose-500" />,
            "No hay destinos de exportación registrados."
          )}
        </div>
      )}
    </div>
  );
};
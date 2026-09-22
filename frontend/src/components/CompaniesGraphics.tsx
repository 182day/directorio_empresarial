// src/components/CompaniesGraphics.tsx
import { useMemo, type ReactNode } from 'react';
import { X, BarChart3 } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    Legend
} from 'recharts';
import { type CompanyFormData } from '../interfaces/company.interface';

const COLORES_GRAFICA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e', '#a3e635'];

interface CompaniesGraphicsProps {
    isOpen: boolean;
    onClose: () => void;
    companies: CompanyFormData[];
    selectedEstados: string[];
}

type ChartDatum = { name: string; total: number };

// --- Helpers para contar ocurrencias ---
const countBy = (companies: CompanyFormData[], getValue: (c: CompanyFormData) => string | undefined | null): ChartDatum[] => {
    const conteo: Record<string, number> = {};
    companies.forEach((c) => {
        const val = getValue(c);
        if (!val) return;
        conteo[val] = (conteo[val] || 0) + 1;
    });
    return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
};

const countByArray = (companies: CompanyFormData[], getValues: (c: CompanyFormData) => string[]): ChartDatum[] => {
    const conteo: Record<string, number> = {};
    companies.forEach((c) => {
        (getValues(c) || []).forEach((val) => {
            if (!val) return;
            conteo[val] = (conteo[val] || 0) + 1;
        });
    });
    return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
};

// Agrupa en "Otro" las categorías que solo tienen 1 registro, para no saturar la gráfica
const consolidateSingles = (data: ChartDatum[], otherLabel = 'Otro'): ChartDatum[] => {
    const principales = data.filter((d) => d.total > 1);
    const unicos = data.filter((d) => d.total === 1);
    if (unicos.length === 0) return data;

    const totalOtros = unicos.reduce((sum, d) => sum + d.total, 0);
    return [...principales, { name: otherLabel, total: totalOtros }];
};

// --- Sub-componentes reutilizables de gráficas ---
interface ChartCardProps {
    title: string;
    subtitle?: ReactNode;
    data: ChartDatum[];
    colorOffset?: number;
}

const BarChartCard = ({ title, subtitle, data, colorOffset = 0 }: ChartCardProps) => (
    <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-md transition-colors duration-200">
        <h3 className="text-sm font-semibold text-app-text mb-1 flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORES_GRAFICA[colorOffset % COLORES_GRAFICA.length] }}
            ></span>
            {title}
        </h3>
        {subtitle && <p className="text-xs text-app-muted mb-4">{subtitle}</p>}
        <div className={`h-64 w-full ${subtitle ? '' : 'mt-4'}`}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-app-border" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="currentColor"
                        className="text-app-muted"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis stroke="currentColor" className="text-app-muted" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--color-bg-card, #1e293b)',
                            borderColor: 'var(--color-border, #475569)',
                            borderRadius: '0.5rem',
                            color: 'var(--color-text, #fff)'
                        }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${title}-${index}`} fill={COLORES_GRAFICA[(index + colorOffset) % COLORES_GRAFICA.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const PieChartCard = ({ title, subtitle, data, colorOffset = 0 }: ChartCardProps) => (
    <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-md transition-colors duration-200">
        <h3 className="text-sm font-semibold text-app-text mb-1 flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORES_GRAFICA[colorOffset % COLORES_GRAFICA.length] }}
            ></span>
            {title}
        </h3>
        {subtitle && <p className="text-xs text-app-muted mb-4">{subtitle}</p>}
        <div className={`h-64 w-full ${subtitle ? '' : 'mt-4'}`}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        label={({ name, percent }) => {
                            const itemName = name ?? 'Sin nombre';
                            const itemPercent = percent ? (percent * 100).toFixed(0) : 0;
                            return `${itemName}: ${itemPercent}%`;
                        }}
                        labelLine={false}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-pie-${title}-${index}`} fill={COLORES_GRAFICA[(index + colorOffset) % COLORES_GRAFICA.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--color-bg-card, #1e293b)',
                            borderColor: 'var(--color-border, #475569)',
                            borderRadius: '0.5rem',
                            color: 'var(--color-text, #fff)'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-app-text">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const CompaniesGraphics = ({ isOpen, onClose, companies, selectedEstados }: CompaniesGraphicsProps) => {
    // 📊 DATOS CALCULADOS PARA LAS GRÁFICAS

    const dataTamanoGrafica = useMemo(
        () => countBy(companies, (c) => c.tamanoEmpresa || 'No especificado'),
        [companies]
    );

    const dataEstadoGrafica = useMemo(
        () => countBy(companies, (c) => c.ubicacion?.estado || 'Sin estado'),
        [companies]
    );

    const dataMunicipioGrafica = useMemo(() => {
        if (selectedEstados.length === 0) return [];
        return countBy(companies, (c) => c.ubicacion?.municipio || 'Sin municipio');
    }, [companies, selectedEstados]);

    const dataTipoOperacionesGrafica = useMemo(
        () => countByArray(companies, (c) => c.tipoOperaciones || []),
        [companies]
    );

    const dataTipoSuministroGrafica = useMemo(
        () => countByArray(companies, (c) => c.tipoSuministro || []),
        [companies]
    );

    const dataPaisOrigenGrafica = useMemo(
        () => consolidateSingles(countBy(companies, (c) => {
            const info = c.informacionEmpresa;
            if (!info?.paisOrigen) return undefined;
            return info.paisOrigen === 'Otro' && info.paisOrigenOtro ? info.paisOrigenOtro : info.paisOrigen;
        })),
        [companies]
    );

    const dataCertificacionesGrafica = useMemo(
        () => consolidateSingles(countByArray(companies, (c) => {
            const cert = c.informacionEmpresa?.certificaciones;
            if (!cert) return [];
            return [...(cert.lista || []), ...(cert.otroEspecifique ? [cert.otroEspecifique] : [])];
        })),
        [companies]
    );

    const dataSectoresGrafica = useMemo(
        () => consolidateSingles(countByArray(companies, (c) => {
            const sec = c.informacionEmpresa?.sectoresPertenece;
            if (!sec) return [];
            return [...(sec.lista || []), ...(sec.otroEspecifique ? [sec.otroEspecifique] : [])];
        })),
        [companies]
    );

    const dataPrincipalSectorGrafica = useMemo(
        () => consolidateSingles(countBy(companies, (c) => c.informacionEmpresa?.principalSectorAtiende || undefined)),
        [companies]
    );

    const dataDestinoExportacionesGrafica = useMemo(
        () => consolidateSingles(countByArray(companies, (c) => c.informacionEmpresa?.destinoExportaciones || [])),
        [companies]
    );

    const dataApoyosGrafica = useMemo(
        () => consolidateSingles(countByArray(companies, (c) => {
            const ap = c.apoyosYNecesidades;
            if (!ap) return [];
            return [...(ap.tipos || []), ...(ap.otroEspecifique ? [ap.otroEspecifique] : [])];
        })),
        [companies]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
            <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8 transition-colors duration-200">
                
                {/* Encabezado */}
                <div className="p-6 border-b border-app-border flex items-center justify-between bg-app-card sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            <span>Análisis Estadístico de Empresas</span>
                        </h2>
                        <p className="text-xs text-app-muted mt-0.5">
                            Visualización basada en los {companies.length} registros filtrados actuales.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-app-muted hover:text-app-text transition-colors bg-app-bg p-1.5 rounded-lg border border-app-border"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido con gráficas */}
                <div className="max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none p-6 space-y-6">

                    <BarChartCard title="Distribución por Tamaño de Empresa" data={dataTamanoGrafica} colorOffset={0} />

                    <BarChartCard title="Distribución por Estado" data={dataEstadoGrafica} colorOffset={1} />

                    {selectedEstados.length > 0 && dataMunicipioGrafica.length > 0 && (
                        <div className="animate-fade-in">
                            <BarChartCard
                                title="Distribución por Municipio"
                                subtitle={<>Filtrado por los estados: <span className="text-indigo-500 dark:text-indigo-400 font-medium">{selectedEstados.join(', ')}</span></>}
                                data={dataMunicipioGrafica}
                                colorOffset={2}
                            />
                        </div>
                    )}

                    {dataTipoOperacionesGrafica.length > 0 && (
                        <PieChartCard title="Tipo de Operaciones" data={dataTipoOperacionesGrafica} colorOffset={3} />
                    )}

                    {dataTipoSuministroGrafica.length > 0 && (
                        <PieChartCard title="Tipo de Suministro" data={dataTipoSuministroGrafica} colorOffset={4} />
                    )}

                    {dataPaisOrigenGrafica.length > 0 && (
                        <PieChartCard title="País de Origen" data={dataPaisOrigenGrafica} colorOffset={5} />
                    )}

                    {dataCertificacionesGrafica.length > 0 && (
                        <PieChartCard title="Certificaciones" data={dataCertificacionesGrafica} colorOffset={6} />
                    )}

                    {dataSectoresGrafica.length > 0 && (
                        <BarChartCard title="Sectores a los que Pertenecen" data={dataSectoresGrafica} colorOffset={7} />
                    )}

                    {dataPrincipalSectorGrafica.length > 0 && (
                        <BarChartCard title="Principal Sector que Atienden" data={dataPrincipalSectorGrafica} colorOffset={0} />
                    )}

                    {dataDestinoExportacionesGrafica.length > 0 && (
                        <BarChartCard title="Destino de sus Exportaciones" data={dataDestinoExportacionesGrafica} colorOffset={1} />
                    )}

                    {dataApoyosGrafica.length > 0 && (
                        <BarChartCard title="Apoyos y Necesidades Requeridas" data={dataApoyosGrafica} colorOffset={2} />
                    )}

                </div>

                {/* Pie del modal */}
                <div className="p-4 border-t border-app-border bg-app-bg flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-app-card hover:bg-app-bg text-app-text border border-app-border px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
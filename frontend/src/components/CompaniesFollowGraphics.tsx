// src/components/CompaniesFollowGraphics.tsx
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
import { type FollowRecord } from '../interfaces/follow.interface';

const COLORES_GRAFICA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e', '#a3e635'];

interface CompaniesFollowGraphicsProps {
    isOpen: boolean;
    onClose: () => void;
    follows: FollowRecord[];
}

type ChartDatum = { name: string; total: number };

// Helper para contar ocurrencias de un valor string individual
const countBy = (follows: FollowRecord[], getValue: (f: FollowRecord) => string | undefined | null): ChartDatum[] => {
    const conteo: Record<string, number> = {};
    follows.forEach((f) => {
        const val = getValue(f);
        if (!val) return;
        conteo[val] = (conteo[val] || 0) + 1;
    });
    return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
};

// Helper para contar ocurrencias en arreglos (soporta strings u objetos)
const countByArray = (
    follows: FollowRecord[],
    getArray: (f: FollowRecord) => any[] | undefined | null
): ChartDatum[] => {
    const conteo: Record<string, number> = {};

    follows.forEach((f) => {
        const arr = getArray(f);
        if (!arr || !Array.isArray(arr)) return;

        arr.forEach((item) => {
            if (!item) return;

            // Extrae el nombre si es un objeto o toma el valor si es string
            let name = '';
            if (typeof item === 'string') {
                name = item;
            } else if (typeof item === 'object') {
                name = item.nombreComercial || item.nombre || item.label || item.value || '';
            }

            const cleanName = name.trim();
            if (!cleanName) return;

            conteo[cleanName] = (conteo[cleanName] || 0) + 1;
        });
    });

    return Object.keys(conteo)
        .map((key) => ({ name: key, total: conteo[key] }))
        .sort((a, b) => b.total - a.total);
};

// Sub-componentes
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
        <div className="h-64 w-full mt-4">
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
        <div className="h-64 w-full mt-4">
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

export const CompaniesFollowGraphics = ({ isOpen, onClose, follows }: CompaniesFollowGraphicsProps) => {
    // 📊 DATOS CALCULADOS PARA LAS GRÁFICAS DE SEGUIMIENTO
    const dataEmpresaGrafica = useMemo(
        () => countBy(follows, (f) => f.companyName || 'Sin Nombre'),
        [follows]
    );

    const dataTipoSeguimientoGrafica = useMemo(
        () => countBy(follows, (f) => f.tipoSeguimiento || 'No especificado'),
        [follows]
    );

    const dataMedioAtencionGrafica = useMemo(
        () => countBy(follows, (f) => f.medioAtencion || 'No especificado'),
        [follows]
    );

    const dataEstatusGrafica = useMemo(
        () => countBy(follows, (f) => f.estatus || 'Sin estatus'),
        [follows]
    );

    // 🥧 Pastel: Es Vinculación (Sí / No)
    const dataEsVinculacionGrafica = useMemo(
        () => countBy(follows, (f) => (f.esVinculacion ? 'Sí' : 'No')),
        [follows]
    );

    // 📊 Barras: Empresas Vinculadas
    const dataEmpresasVinculadasGrafica = useMemo(
        () => countByArray(follows, (f) => f.empresasVinculadas),
        [follows]
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
                            <span>Análisis Estadístico de Seguimientos</span>
                        </h2>
                        <p className="text-xs text-app-muted mt-0.5">
                            Visualización basada en los {follows.length} registros filtrados actuales.
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

                    {/* 1. Empresa (Barras) */}
                    <BarChartCard title="Distribución por Empresa" data={dataEmpresaGrafica} colorOffset={0} />

                    {/* 2. Tipo de Seguimiento (Pastel) */}
                    {dataTipoSeguimientoGrafica.length > 0 && (
                        <PieChartCard title="Tipo de Seguimiento" data={dataTipoSeguimientoGrafica} colorOffset={1} />
                    )}

                    {/* 3. Medio de Atención (Pastel) */}
                    {dataMedioAtencionGrafica.length > 0 && (
                        <PieChartCard title="Medio de Atención" data={dataMedioAtencionGrafica} colorOffset={2} />
                    )}

                    {/* 4. Estatus del Seguimiento (Pastel) */}
                    {dataEstatusGrafica.length > 0 && (
                        <PieChartCard title="Estatus del Seguimiento" data={dataEstatusGrafica} colorOffset={3} />
                    )}

                    {/* 5. Es Vinculación (Pastel) */}
                    {dataEsVinculacionGrafica.length > 0 && (
                        <PieChartCard title="¿Es Vinculación?" data={dataEsVinculacionGrafica} colorOffset={4} />
                    )}

                    {/* 6. Empresas Vinculadas (Barras) - Solo si hay datos */}
                    {dataEmpresasVinculadasGrafica.length > 0 && (
                        <BarChartCard
                            title="Empresas Vinculadas"
                            subtitle="Frecuencia de empresas involucradas en las vinculaciones"
                            data={dataEmpresasVinculadasGrafica}
                            colorOffset={5}
                        />
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
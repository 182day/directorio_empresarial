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

// Helper para contar ocurrencias
const countBy = (follows: FollowRecord[], getValue: (f: FollowRecord) => string | undefined | null): ChartDatum[] => {
    const conteo: Record<string, number> = {};
    follows.forEach((f) => {
        const val = getValue(f);
        if (!val) return;
        conteo[val] = (conteo[val] || 0) + 1;
    });
    return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
};

// Sub-componentes
interface ChartCardProps {
    title: string;
    subtitle?: ReactNode;
    data: ChartDatum[];
    colorOffset?: number;
}

const BarChartCard = ({ title, subtitle, data, colorOffset = 0 }: ChartCardProps) => (
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORES_GRAFICA[colorOffset % COLORES_GRAFICA.length] }}
            ></span>
            {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.5rem', color: '#fff' }}
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
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORES_GRAFICA[colorOffset % COLORES_GRAFICA.length] }}
            ></span>
            {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
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
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.5rem', color: '#fff' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/60">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            <span>Análisis Estadístico de Seguimientos</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Visualización basada en los {follows.length} registros filtrados actuales.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

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

                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-800/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
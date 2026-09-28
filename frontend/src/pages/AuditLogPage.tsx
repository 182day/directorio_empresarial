// src/pages/AuditLogPage.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useCompanyStore } from '../stores/useCompanyStore';
import { useUserStore } from '../stores/useUserStore';
import { Pagination } from '../components/Pagination';
import {
    Search,
    SlidersHorizontal,
    Download,
    X,
    Calendar,
    User,
    RefreshCw,
    Eye,
    FileText,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface AuditLogItem {
    _id: string;
    usuario?: {
        _id: string;
        nombre: string;
        email: string;
        rol?: string;
    };
    accion: string;
    modulo: string;
    empresaId?: string;
    detalles?: any;
    ip?: string;
    createdAt: string;
}

type AuditSortField = 'usuario.nombre' | 'accion' | 'modulo' | 'ip' | 'createdAt';

const AUDIT_SORT_OPTIONS: { value: AuditSortField; label: string }[] = [
    { value: 'usuario.nombre', label: 'Usuario' },
    { value: 'accion', label: 'Acción' },
    { value: 'modulo', label: 'Módulo' },
    { value: 'ip', label: 'IP' },
    { value: 'createdAt', label: 'Fecha / Hora' }
];

export const AuditLogPage = () => {
    // Reutilizar Store
    const { users, fetchUsers } = useUserStore();
    const { companies } = useCompanyStore();

    // Estados de Datos
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Control de primera búsqueda
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    // Estado para Modal de Detalles
    const [selectedLogDetails, setSelectedLogDetails] = useState<AuditLogItem | null>(null);

    // Búsqueda y Filtros
    const [search, setSearch] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [selectedModulo, setSelectedModulo] = useState<string>('');

    // Estados de Ordenamiento
    const [sortBy, setSortBy] = useState<AuditSortField | ''>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Paginación (Servidor)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Cargar Usuarios desde el Store de Zustand al montar
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Petición al backend con Filtros y Paginación
    const fetchLogs = useCallback(async (page: number = currentPage, limit: number | 'all' = pageSize) => {
        try {
            setLoading(true);
            setHasSearched(true);

            const params: any = { page, limit };

            if (search.trim()) params.busqueda = search.trim();
            if (selectedUser) params.usuarioId = selectedUser;
            if (startDate) params.fechaInicio = startDate;
            if (endDate) params.fechaFin = endDate;
            if (selectedModulo) params.modulo = selectedModulo;

            const res = await api.get('/audit-logs', { params });

            if (res.data.logs) {
                setLogs(res.data.logs);
                setTotalItems(res.data.pagination?.total || 0);
            } else if (Array.isArray(res.data)) {
                setLogs(res.data);
                setTotalItems(res.data.length);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al obtener los registros de bitácora');
        } finally {
            setLoading(false);
        }
    }, [search, selectedUser, selectedModulo, startDate, endDate, currentPage, pageSize]);

    // Ordenamiento de los registros
    const sortedLogs = useMemo(() => {
        if (!sortBy) return logs;

        return [...logs].sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            if (sortBy === 'usuario.nombre') {
                aValue = a.usuario?.nombre || '';
                bValue = b.usuario?.nombre || '';
            } else if (sortBy === 'createdAt') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else {
                aValue = a[sortBy] || '';
                bValue = b[sortBy] || '';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [logs, sortBy, sortOrder]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        if (hasSearched) fetchLogs(newPage, pageSize);
    };

    const handlePageSizeChange = (newPageSize: number | 'all') => {
        setPageSize(newPageSize);
        setCurrentPage(1);
        if (hasSearched) fetchLogs(1, newPageSize);
    };

    const handleSearchClick = () => {
        setCurrentPage(1);
        fetchLogs(1, pageSize);
    };

    const clearAllFilters = () => {
        setSearch('');
        setSelectedUser('');
        setSelectedModulo('');
        setStartDate('');
        setEndDate('');
        setSortBy('');
        setCurrentPage(1);
    };

    const totalFiltrosActivos =
        (search.trim() ? 1 : 0) +
        (selectedUser ? 1 : 0) +
        (selectedModulo ? 1 : 0) +
        (startDate ? 1 : 0) +
        (endDate ? 1 : 0);

    const handleExportExcel = async () => {
        if (sortedLogs.length === 0) {
            toast.error('No hay datos en pantalla para exportar');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bitácora de Eventos');

        worksheet.columns = [
            { header: 'Fecha y Hora', key: 'fecha', width: 22 },
            { header: 'Usuario', key: 'usuario', width: 28 },
            { header: 'Correo', key: 'email', width: 28 },
            { header: 'Módulo', key: 'modulo', width: 18 },
            { header: 'Acción', key: 'accion', width: 25 },
            { header: 'Detalles', key: 'detalles', width: 45 },
            { header: 'IP', key: 'ip', width: 16 }
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1E3A8A' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        sortedLogs.forEach((log) => {
            const fechaFormatted = new Date(log.createdAt).toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const row = worksheet.addRow({
                fecha: fechaFormatted,
                usuario: log.usuario ? log.usuario.nombre : 'Sistema / Desconocido',
                email: log.usuario ? log.usuario.email : 'N/A',
                modulo: log.modulo,
                accion: log.accion,
                detalles: typeof log.detalles === 'object' ? JSON.stringify(log.detalles) : (log.detalles || 'Sin detalles'),
                ip: log.ip || 'N/A'
            });

            row.alignment = { vertical: 'middle' };
        });

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E2E8F0' } },
                    left: { style: 'thin', color: { argb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                    right: { style: 'thin', color: { argb: 'E2E8F0' } }
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const fileName = `Bitacora_Eventos_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);
        toast.success('Reporte de bitácora exportado correctamente');
    };

    return (
        <div className="space-y-6">
            {/* BARRA SUPERIOR DE ACCIONES */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap">
                    <div className="relative flex-1 sm:w-80 min-w-55">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
                        <input
                            type="text"
                            placeholder="Buscar por acción, módulo o detalle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                            className="w-full bg-app-card border border-app-border rounded-lg py-2 pl-10 pr-4 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${totalFiltrosActivos > 0 || showFilters
                            ? 'bg-blue-600/20 border-blue-500 text-blue-500 font-semibold'
                            : 'bg-app-card border-app-border text-app-muted hover:text-app-text'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Filtros</span>
                        {totalFiltrosActivos > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                {totalFiltrosActivos}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={handleSearchClick}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-md"
                    >
                        <Search className="w-4 h-4" />
                        <span>Buscar</span>
                    </button>

                    {hasSearched && (
                        <button
                            onClick={() => fetchLogs(currentPage, pageSize)}
                            className="p-2 bg-app-card border border-app-border hover:bg-app-button-hover text-app-muted hover:text-app-text rounded-lg transition-colors"
                            title="Recargar consulta actual"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}

                    {sortedLogs.length > 0 && (
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm ml-auto sm:ml-0"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    )}
                </div>
            </div>

            {/* PANEL DESPLEGABLE DE FILTROS AVANZADOS */}
            {showFilters && (
                <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-app-muted mb-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Filtrar por Usuario
                        </label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-xs text-app-text focus:outline-none focus:border-blue-500"
                        >
                            <option value="" className="bg-app-card text-app-text">Todos los usuarios</option>
                            {users.map((u) => (
                                <option key={u._id} value={u._id} className="bg-app-card text-app-text">
                                    {u.nombre} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-app-muted mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-xs text-app-text focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-app-muted mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha Hasta
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-xs text-app-text focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Selector de Módulo */}
                    <div>
                        <label className="text-xs font-medium text-app-muted mb-1 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrar por Módulo
                        </label>
                        <select
                            value={selectedModulo}
                            onChange={(e) => setSelectedModulo(e.target.value)}
                            className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-xs text-app-text focus:outline-none focus:border-blue-500"
                        >
                            <option value="" className="bg-app-card text-app-text">Todos los módulos</option>
                            <option value="Empresas" className="bg-app-card text-app-text">Empresas</option>
                            <option value="Usuarios" className="bg-app-card text-app-text">Usuarios</option>
                            <option value="SeguimientoEmpresas" className="bg-app-card text-app-text">Seguimientos</option>
                            <option value="Auth" className="bg-app-card text-app-text">Auth</option>
                            <option value="General" className="bg-app-card text-app-text">General</option>
                        </select>
                    </div>
                </div>
            )}

            {/* CHIPS DE FILTROS APLICADOS */}
            {totalFiltrosActivos > 0 && (
                <div className="flex items-center gap-2 flex-wrap bg-app-card/40 p-3 rounded-xl border border-app-border">
                    <span className="text-xs text-app-muted font-medium">Filtros aplicados:</span>

                    {search.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs rounded-lg border border-amber-500/20">
                            Búsqueda: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedUser && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Usuario: {users.find(u => u._id === selectedUser)?.nombre || selectedUser}
                            <button onClick={() => setSelectedUser('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {startDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Desde: {startDate}
                            <button onClick={() => setStartDate('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {endDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-500 dark:text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Hasta: {endDate}
                            <button onClick={() => setEndDate('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedModulo && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-500 dark:text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Módulo: {selectedModulo}
                            <button onClick={() => setSelectedModulo('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-app-muted hover:text-red-500 underline ml-auto font-medium transition-colors"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            {/* CONTADOR DE RESULTADOS Y CONTROL UNIFICADO DE ORDENAMIENTO */}
            {hasSearched && !loading && sortedLogs.length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-app-card border border-app-border px-4 py-2.5 rounded-lg text-sm text-app-text shadow-sm">

                    {/* Texto de Resultados Encontrados */}
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            Se {sortedLogs.length === 1 ? 'encontró' : 'encontraron'}{' '}
                            <strong className="text-blue-500 font-semibold">{totalItems}</strong>{' '}
                            {totalItems === 1 ? 'resultado' : 'resultados'}
                        </span>

                        {totalFiltrosActivos > 0 && (
                            <span className="text-xs text-app-muted hidden md:inline">
                                (con filtros aplicados)
                            </span>
                        )}
                    </div>

                    {/* Control Unificado de Ordenamiento */}
                    <div className="flex items-center gap-1.5 bg-app-bg border border-app-border rounded-lg p-1 text-sm self-end sm:self-auto">
                        <span className="text-xs text-app-muted pl-2 font-medium hidden sm:inline">Ordenar:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as AuditSortField | '')}
                            className="bg-transparent text-xs sm:text-sm text-app-text font-medium focus:outline-none cursor-pointer py-1 px-1"
                        >
                            {AUDIT_SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-app-card text-app-text">
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="p-1.5 hover:bg-app-border/60 text-blue-400 rounded-md transition-colors flex items-center gap-1"
                            title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
                        >
                            {sortOrder === 'asc' ? (
                                <ArrowUp className="w-4 h-4" />
                            ) : (
                                <ArrowDown className="w-4 h-4" />
                            )}
                            <span className="text-xs uppercase font-bold text-app-muted">{sortOrder}</span>
                        </button>
                    </div>

                </div>
            )}

            {/* CONTENIDO PRINCIPAL / TABLA */}
            {!hasSearched ? (
                <div className="bg-app-card border border-app-border rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-600/10 text-blue-500 rounded-full">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-app-text">Consulta de Bitácora</h3>
                    <p className="text-sm text-app-muted max-w-md">
                        Aplica los filtros requeridos o presiona el botón <strong className="text-blue-500">Buscar</strong> para obtener los registros del sistema.
                    </p>
                    <button
                        onClick={handleSearchClick}
                        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors shadow-lg"
                    >
                        Buscar Todos los Registros
                    </button>
                </div>
            ) : loading ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    Cargando registros de bitácora desde el servidor...
                </div>
            ) : sortedLogs.length === 0 ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    No se encontraron eventos en la bitácora con los criterios seleccionados.
                </div>
            ) : (
                <>
                    <div className="bg-app-card border border-app-border rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-app-text border-collapse">
                                {/* Oculto en móviles (hidden), visible en escritorio (md:table-header-group) */}
                                <thead className="hidden md:table-header-group bg-app-bg text-app-muted text-xs uppercase border-b border-app-border">
                                    <tr>
                                        <th className="px-6 py-4">Fecha / Hora</th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Módulo</th>
                                        <th className="px-6 py-4">Acción</th>
                                        <th className="px-6 py-4">IP</th>
                                        <th className="px-6 py-4 text-center">Detalles</th>
                                    </tr>
                                </thead>

                                {/* En móvil se comporta como filas en bloque */}
                                <tbody className="divide-y divide-app-border">
                                    {sortedLogs.map((log) => (
                                        <tr
                                            key={log._id}
                                            className="block md:table-row hover:bg-app-button-hover/50 transition-colors p-4 md:p-0 space-y-3 md:space-y-0"
                                        >
                                            {/* Fecha / Hora */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-1 md:py-4 whitespace-nowrap text-xs text-app-muted">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">Fecha / Hora</span>
                                                <span>
                                                    {new Date(log.createdAt).toLocaleString('es-MX', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </span>
                                            </td>

                                            {/* Usuario */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-1 md:py-4 whitespace-nowrap">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">Usuario</span>
                                                {log.usuario ? (
                                                    <div className="text-right md:text-left">
                                                        <div className="font-medium text-app-text">{log.usuario.nombre}</div>
                                                        <div className="text-xs text-app-muted">{log.usuario.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-app-muted italic">
                                                        Sistema / Desconocido
                                                    </span>
                                                )}
                                            </td>

                                            {/* Módulo */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-1 md:py-4 whitespace-nowrap">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">Módulo</span>
                                                <span className={`px-2.5 py-1 text-xs rounded-md border font-semibold inline-block ${log.modulo === 'Empresas'
                                                    ? 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20'
                                                    : log.modulo === 'Usuarios'
                                                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                                        : log.modulo === 'SeguimientoEmpresas'
                                                            ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20'
                                                            : log.modulo === 'Auth'
                                                                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                                                                : 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {log.modulo === 'SeguimientoEmpresas' ? 'Seguimiento' : log.modulo || 'General'}
                                                </span>
                                            </td>

                                            {/* Acción */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-1 md:py-4 font-medium text-app-text whitespace-nowrap">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">Acción</span>
                                                <span>{log.accion}</span>
                                            </td>

                                            {/* IP */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-1 md:py-4 text-xs text-app-muted whitespace-nowrap">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">IP</span>
                                                <span>{log.ip || 'N/A'}</span>
                                            </td>

                                            {/* Detalles */}
                                            <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 pt-3 md:pt-4 border-t border-app-border/40 md:border-t-0 text-xs text-app-muted">
                                                <span className="font-semibold text-xs text-app-muted uppercase md:hidden">Detalles</span>
                                                <div className="flex items-center justify-end md:justify-center">
                                                    <button
                                                        onClick={() => setSelectedLogDetails(log)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-app-button hover:bg-app-button-hover text-app-text text-xs font-medium rounded-lg transition-colors border border-app-border shrink-0"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Ver detalles
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            )}

            {/* MODAL DE DETALLES COMPLETOS DE LA BITÁCORA */}
            {selectedLogDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-app-card border border-app-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-bg/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-app-text">Detalles del Evento</h3>
                                    <p className="text-xs text-app-muted">
                                        ID: {selectedLogDetails._id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLogDetails(null)}
                                className="p-1.5 text-app-muted hover:text-app-text bg-app-button hover:bg-app-button-hover rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-app-bg/40 p-3 rounded-xl border border-app-border text-xs">
                                <div>
                                    <span className="text-app-muted block">Acción</span>
                                    <span className="font-semibold text-app-text">{selectedLogDetails.accion}</span>
                                </div>
                                <div>
                                    <span className="text-app-muted block">Módulo</span>
                                    <span className="text-blue-500 font-medium">{selectedLogDetails.modulo === 'SeguimientoEmpresas' ? 'Seguimiento' : selectedLogDetails.modulo || 'General'}</span>
                                </div>
                                <div>
                                    <span className="text-app-muted block">Usuario</span>
                                    <span className="text-app-text font-medium">{selectedLogDetails.usuario?.nombre || 'Sistema'}</span>
                                </div>
                                {selectedLogDetails.modulo === 'SeguimientoEmpresas' && (
                                    <div>
                                        <span className="text-app-muted block">Empresa</span>
                                        <span className="text-app-text font-medium">
                                            {companies.find((c) => c._id === selectedLogDetails.empresaId)?.nombreComercial ||
                                                companies.find((c) => c._id === selectedLogDetails.empresaId)?.razonSocial ||
                                                'Empresa no registrada'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-app-muted mb-2">
                                    Objeto / Información de Cambios:
                                </label>
                                <div className="bg-app-bg border border-app-border rounded-xl p-4 overflow-x-auto">
                                    <pre className="text-xs text-emerald-600 dark:text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                                        {typeof selectedLogDetails.detalles === 'object'
                                            ? JSON.stringify(selectedLogDetails.detalles, null, 2)
                                            : selectedLogDetails.detalles || 'Sin detalles registrados'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-app-border bg-app-bg/30 flex justify-end">
                            <button
                                onClick={() => setSelectedLogDetails(null)}
                                className="px-5 py-2 bg-app-button hover:bg-app-button-hover text-app-text font-medium text-xs rounded-lg transition-colors border border-app-border"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
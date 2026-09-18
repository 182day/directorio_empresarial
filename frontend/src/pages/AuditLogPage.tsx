// src/pages/AuditLogPage.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
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
    FileText
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
    detalles?: any;
    ip?: string;
    createdAt: string;
}

interface UsuarioOption {
    _id: string;
    nombre: string;
    email: string;
}

export const AuditLogPage = () => {
    // Estados de Datos
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [usuariosList, setUsuariosList] = useState<UsuarioOption[]>([]);
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

    // Paginación (Servidor)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Cargar Lista de Usuarios solo para el Dropdown
    const fetchUsuarios = async () => {
        try {
            const res = await api.get('/users');
            const data = res.data.users || res.data;
            setUsuariosList(data);
        } catch (err) {
            console.error('Error al cargar la lista de usuarios para filtros:', err);
        }
    };

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
    }, [search, selectedUser, selectedModulo, startDate, endDate, currentPage, pageSize]); // 👈 Añadido selectedModulo aquí

    useEffect(() => {
        fetchUsuarios();
    }, []);

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
        setSelectedModulo(''); // 👈 Limpiar módulo
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const totalFiltrosActivos =
        (search.trim() ? 1 : 0) +
        (selectedUser ? 1 : 0) +
        (selectedModulo ? 1 : 0) + // 👈 Sumar al contador
        (startDate ? 1 : 0) +
        (endDate ? 1 : 0);

    const handleExportExcel = async () => {
        if (logs.length === 0) {
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

        logs.forEach((log) => {
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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por acción, módulo o detalle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${totalFiltrosActivos > 0 || showFilters
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
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
                            className="p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Recargar consulta actual"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}

                    {logs.length > 0 && (
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
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Filtrar por Usuario
                        </label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todos los usuarios</option>
                            {usuariosList.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.nombre} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha Hasta
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Selector de Módulo en el Panel Desplegable */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrar por Módulo
                        </label>
                        <select
                            value={selectedModulo}
                            onChange={(e) => setSelectedModulo(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todos los módulos</option>
                            <option value="Empresas">Empresas</option>
                            <option value="Usuarios">Usuarios</option>
                            <option value="Auth">Auth</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                </div>
            )}

            {/* CHIPS DE FILTROS APLICADOS */}
            {totalFiltrosActivos > 0 && (
                <div className="flex items-center gap-2 flex-wrap bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-xs text-slate-400 font-medium">Filtros aplicados:</span>

                    {search.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                            Búsqueda: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedUser && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Usuario: {usuariosList.find(u => u._id === selectedUser)?.nombre || selectedUser}
                            <button onClick={() => setSelectedUser('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {startDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Desde: {startDate}
                            <button onClick={() => setStartDate('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {endDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Hasta: {endDate}
                            <button onClick={() => setEndDate('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedModulo && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Módulo: {selectedModulo}
                            <button onClick={() => setSelectedModulo('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-slate-400 hover:text-red-400 underline ml-auto font-medium transition-colors"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL / TABLA */}
            {!hasSearched ? (
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-full">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Consulta de Bitácora</h3>
                    <p className="text-sm text-slate-400 max-w-md">
                        Aplica los filtros requeridos o presiona el botón <strong className="text-blue-400">Buscar</strong> para obtener los registros del sistema.
                    </p>
                    <button
                        onClick={handleSearchClick}
                        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors shadow-lg"
                    >
                        Buscar Todos los Registros
                    </button>
                </div>
            ) : loading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    Cargando registros de bitácora desde el servidor...
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    No se encontraron eventos en la bitácora con los criterios seleccionados.
                </div>
            ) : (
                <>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Fecha / Hora</th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Módulo</th>
                                        <th className="px-6 py-4">Acción</th>
                                        <th className="px-6 py-4">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/60">
                                    {logs.map((log) => {
                                        // const detallesTexto = typeof log.detalles === 'object' && log.detalles !== null
                                        //     ? JSON.stringify(log.detalles)
                                        //     : (log.detalles || '-');

                                        return (
                                            <tr key={log._id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                                                    {new Date(log.createdAt).toLocaleString('es-MX', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.usuario ? (
                                                        <div>
                                                            <div className="font-medium text-white">{log.usuario.nombre}</div>
                                                            <div className="text-xs text-slate-500">{log.usuario.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">
                                                            Sistema / Desconocido
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 text-xs rounded-md border font-semibold inline-block ${log.modulo === 'Empresas'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        : log.modulo === 'Usuarios'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : log.modulo === 'Auth'
                                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>
                                                        {log.modulo || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                                    {log.accion}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400 max-w-xs xl:max-w-md">
                                                    <div className="flex items-center gap-2">
                                                        {/* <span className="truncate flex-1" title={detallesTexto}>
                                                            {detallesTexto}
                                                        </span> */}
                                                        <button
                                                            onClick={() => setSelectedLogDetails(log)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-600 shrink-0"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Ver detalles
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Cabecera del Modal */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Detalles del Evento</h3>
                                    <p className="text-xs text-slate-400">
                                        ID: {selectedLogDetails._id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLogDetails(null)}
                                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Acción</span>
                                    <span className="font-semibold text-white">{selectedLogDetails.accion}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Módulo</span>
                                    <span className="text-blue-400 font-medium">{selectedLogDetails.modulo || 'General'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Usuario</span>
                                    <span className="text-white font-medium">{selectedLogDetails.usuario?.nombre || 'Sistema'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-2">
                                    Objeto / Información de Cambios:
                                </label>
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                                        {typeof selectedLogDetails.detalles === 'object'
                                            ? JSON.stringify(selectedLogDetails.detalles, null, 2)
                                            : selectedLogDetails.detalles || 'Sin detalles registrados'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Pie del Modal */}
                        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
                            <button
                                onClick={() => setSelectedLogDetails(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors border border-slate-700"
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
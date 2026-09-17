import React, { useState, useEffect, useMemo } from 'react';
import { type CompanyFormData } from '../interfaces/company.interface';
import { type FollowRecord } from '../interfaces/follow.interface';
import { CompanyFollowForm } from '../components/CompanyFollowForm';
import { Pagination } from '../components/Pagination';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import {
    Plus, X, History, Search, Table, LayoutGrid,
    Calendar, Building2, Eye, Pencil, Trash2, Filter
} from 'lucide-react';
import {
    OPCIONES_TIPO_SEGUIMIENTO,
    OPCIONES_MEDIO_ATENCION,
    OPCIONES_ESTATUS_SEGUIMIENTO
} from '../data/followCatalog';

interface Props {
    company?: CompanyFormData | null;
    onClose?: () => void;
}

export const CompaniesFollowPage: React.FC<Props> = ({ company, onClose }) => {
    const [follows, setFollows] = useState<FollowRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [hasQueried, setHasQueried] = useState<boolean>(!!company?._id);

    // Modales y Estados de Selección
    const [showModal, setShowModal] = useState(false);
    const [selectedFollow, setSelectedFollow] = useState<FollowRecord | null>(null);
    const [viewMode, setViewMode] = useState<'create' | 'edit' | 'details' | null>(null);

    // Controles de Vista y Búsqueda
    const [tipoVista, setTipoVista] = useState<'tabla' | 'cards'>('cards');
    const [search, setSearch] = useState('');

    // Filtros
    const [selectedTipo, setSelectedTipo] = useState<string>('');
    const [selectedMedio, setSelectedMedio] = useState<string>('');
    const [selectedEstatus, setSelectedEstatus] = useState<string>('');

    // Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    useEffect(() => {
        if (company?._id) {
            fetchFollows();
        }
    }, [company]);

    const fetchFollows = async () => {
        try {
            setLoading(true);
            setHasQueried(true);

            const endpoint = company?._id
                ? `/companies/follows/${company._id}`
                : '/companies/follows';

            const res = await api.get(endpoint);

            const normalizedData: FollowRecord[] = res.data.map((item: any) => ({
                _id: item._id,
                empresaId: item.empresaId?._id || item.empresaId || '',
                companyName: item.empresaId?.nombreComercial || 'Empresa Sin Nombre',
                tipoSeguimiento: item.tipoSeguimiento || 'General',
                medioAtencion: item.medioAtencion || 'Llamada telefónica',
                asunto: item.asunto || '',
                descripcion: item.descripcion || item.comentarios || '',
                fechaSeguimiento: item.fechaSeguimiento || item.createdAt,
                horaSeguimiento: item.horaSeguimiento || '',
                atencionSeguimiento: item.atencionSeguimiento || '',
                estatus: item.estatus || 'Pendiente',
                usuario: item.usuarioId?.nombre || 'Sistema'
            }));

            setFollows(normalizedData);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error al cargar los seguimientos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id?: string, nombre?: string) => {
        if (!id) return;

        const targetName = nombre || 'este seguimiento';

        Swal.fire({
            title: '¿Está seguro de eliminar el seguimiento?',
            html: `Está a punto de eliminar el seguimiento de <strong style="color: #fff;">${targetName}</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1e293b',
            color: '#f8fafc',
            allowOutsideClick: true,
            allowEscapeKey: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/companies/follows/${id}`);
                    toast.success(`El seguimiento de ${targetName} ha sido eliminado correctamente.`);
                    setFollows((prev) => prev.filter((item) => item._id !== id));
                } catch (err: any) {
                    const mensajeError = err.response?.data?.message || 'Error al eliminar el seguimiento.';
                    toast.error(mensajeError);
                }
            }
        });
    };

    // Filtros dinámicos
    const filteredFollows = useMemo(() => {
        return follows.filter((item) => {
            const matchesSearch = search === '' ||
                item.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                (item.asunto && item.asunto.toLowerCase().includes(search.toLowerCase())) ||
                item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                item.usuario?.toLowerCase().includes(search.toLowerCase());

            const matchesTipo = selectedTipo === '' || item.tipoSeguimiento === selectedTipo;
            const matchesMedio = selectedMedio === '' || item.medioAtencion === selectedMedio;
            const matchesEstatus = selectedEstatus === '' || item.estatus === selectedEstatus;

            return matchesSearch && matchesTipo && matchesMedio && matchesEstatus;
        });
    }, [follows, search, selectedTipo, selectedMedio, selectedEstatus]);

    // Paginación
    const paginatedFollows = useMemo(() => {
        if (pageSize === 'all') return filteredFollows;
        const startIndex = (currentPage - 1) * pageSize;
        return filteredFollows.slice(startIndex, startIndex + pageSize);
    }, [filteredFollows, currentPage, pageSize]);

    return (
        <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <History size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {company ? `Seguimientos: ${company.nombreComercial}` : 'Historial de Seguimientos Global'}
                        </h1>
                    </div>
                    {company && (
                        <p className="text-sm text-slate-400 ml-11">
                            RFC: <span className="text-slate-200 font-medium">{company.rfc}</span>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedFollow(null);
                            setViewMode('create');
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Seguimiento</span>
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-600/50"
                            title="Cerrar ventana"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Controles: Búsqueda, Filtros y Consulta */}
            <div className="space-y-4">
                {/* Fila 1: Búsqueda y Acciones Rápidas */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Campo de Búsqueda */}
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en el seguimiento o comentarios..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Acciones: Consultar y Selector de Vista */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        {!company && (
                            <button
                                onClick={fetchFollows}
                                disabled={loading}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-md disabled:opacity-50"
                            >
                                <Filter className="w-4 h-4" />
                                <span>{loading ? 'Consultando...' : 'Consultar'}</span>
                            </button>
                        )}

                        {/* Conmutador Vista Tabla / Tarjetas */}
                        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <button
                                onClick={() => setTipoVista('tabla')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tipoVista === 'tabla'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Vista en Tabla"
                            >
                                <Table className="w-4 h-4" />
                                <span className="hidden sm:inline">Tabla</span>
                            </button>
                            <button
                                onClick={() => setTipoVista('cards')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tipoVista === 'cards'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Vista en Tarjetas"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Tarjetas</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fila 2: Barra de Filtros con Catálogos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {/* Filtro Tipo */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
                            Tipo
                        </label>
                        <select
                            value={selectedTipo}
                            onChange={(e) => setSelectedTipo(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos los tipos</option>
                            {OPCIONES_TIPO_SEGUIMIENTO.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Medio de Atención */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
                            Medio de Atención
                        </label>
                        <select
                            value={selectedMedio}
                            onChange={(e) => setSelectedMedio(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos los medios</option>
                            {OPCIONES_MEDIO_ATENCION.map((medio) => (
                                <option key={medio} value={medio}>
                                    {medio}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Estatus */}
                    <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
                            Estatus
                        </label>
                        <select
                            value={selectedEstatus}
                            onChange={(e) => setSelectedEstatus(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos los estatus</option>
                            {OPCIONES_ESTATUS_SEGUIMIENTO.map((estatus) => (
                                <option key={estatus} value={estatus}>
                                    {estatus}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Renderizado de vistas */}
            {!hasQueried ? (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400">
                    <Filter className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-base font-medium">Haz clic en "Consultar" para cargar el historial de seguimientos.</p>
                </div>
            ) : loading ? (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400">
                    Cargando seguimientos...
                </div>
            ) : filteredFollows.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400">
                    <p className="text-base font-medium">No se encontraron seguimientos</p>
                </div>
            ) : (
                <>
                    {tipoVista === 'tabla' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                        <tr>
                                            {!company && <th className="px-6 py-4">Empresa</th>}
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Tipo</th>
                                            <th className="px-6 py-4">Asunto / Descripción</th>
                                            <th className="px-6 py-4">Estatus</th>
                                            <th className="px-6 py-4">Usuario</th>
                                            <th className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/60">
                                        {paginatedFollows.map((item, index) => (
                                            <tr key={item._id || index} className="hover:bg-slate-700/30 transition-colors">
                                                {!company && (
                                                    <td className="px-6 py-4 font-medium text-white">
                                                        {item.companyName}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                                                    {new Date(item.fechaSeguimiento).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                                                        {item.tipoSeguimiento}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate text-slate-300">
                                                    {item.asunto ? `${item.asunto} - ` : ''}{item.descripcion}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 text-xs rounded border font-medium ${item.estatus === 'Completado'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                        {item.estatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                                    {item.usuario}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFollow(item);
                                                                setViewMode('details');
                                                                setShowModal(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFollow(item);
                                                                setViewMode('edit');
                                                                setShowModal(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tipoVista === 'cards' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedFollows.map((item, index) => (
                                <div
                                    key={item._id || index}
                                    className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 shadow-xl flex flex-col justify-between transition-colors"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20 font-medium">
                                                {item.tipoSeguimiento}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs rounded border font-medium ${item.estatus === 'Completado'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {item.estatus}
                                            </span>
                                        </div>

                                        {!company && item.companyName && (
                                            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-white">
                                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="truncate">{item.companyName}</span>
                                            </div>
                                        )}

                                        {item.asunto && <p className="text-xs font-semibold text-blue-300 mb-1">{item.asunto}</p>}
                                        <p className="text-sm text-slate-300 my-2 line-clamp-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                                            {item.descripcion}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(item.fechaSeguimiento).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedFollow(item);
                                                    setViewMode('details');
                                                    setShowModal(true);
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedFollow(item);
                                                    setViewMode('edit');
                                                    setShowModal(true);
                                                }}
                                                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id, item.companyName)}
                                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredFollows.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">

                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <History className="text-blue-400" size={22} />
                                {viewMode === 'details' && 'Detalles del Seguimiento'}
                                {viewMode === 'edit' && 'Editar Seguimiento'}
                                {viewMode === 'create' && 'Registrar Nuevo Seguimiento'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
                            {viewMode === 'details' && selectedFollow ? (
                                <div className="space-y-4 text-sm text-slate-300">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Empresa</label>
                                        <p className="text-base text-white font-medium">{selectedFollow.companyName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold">Tipo</label>
                                            <p className="text-white">{selectedFollow.tipoSeguimiento}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold">Estatus</label>
                                            <p className="text-white">{selectedFollow.estatus}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Fecha</label>
                                        <p className="text-white">{new Date(selectedFollow.fechaSeguimiento).toLocaleDateString()}</p>
                                    </div>
                                    {selectedFollow.asunto && (
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold">Asunto</label>
                                            <p className="text-white font-medium">{selectedFollow.asunto}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Descripción</label>
                                        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 mt-1">
                                            {selectedFollow.descripcion}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <CompanyFollowForm
                                    companyId={company?._id || selectedFollow?.empresaId}
                                    initialData={selectedFollow}
                                    onClose={() => setShowModal(false)}
                                    onSuccess={() => {
                                        setShowModal(false);
                                        fetchFollows();
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
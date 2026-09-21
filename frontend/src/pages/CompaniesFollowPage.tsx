// src/pages/CompaniesFollowPage.tsx
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { type CompanyFormData } from '../interfaces/company.interface';
import { type FollowRecord } from '../interfaces/follow.interface';
import { CompanyFollowForm } from '../components/CompanyFollowForm';
import { exportFollowsToExcel } from '../components/CompaniesFollowSheetExcel';
import { CompaniesFollowSheetPDFDocument } from '../components/CompaniesFollowSheetPDFDocument';
import { CompaniesFollowGraphics } from '../components/CompaniesFollowGraphics';
import { formatFechaLarga } from '../utils/formUtils';
import { Pagination } from '../components/Pagination';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import {
    BarChart3, Download, Plus, X, History, Search, Table, LayoutGrid, Calendar, Building2, Eye, Pencil, Trash2, SlidersHorizontal, ChevronDown, Check, User, Tag, CheckCircle2, PhoneCall, ChartGantt, FileText
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
    const { user } = useContext(AuthContext);
    const canEdit = user?.rol === 'admin' || user?.rol === 'editor';
    const [follows, setFollows] = useState<FollowRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [hasQueried, setHasQueried] = useState<boolean>(!!company?._id);

    // Modales y Estados de Selección
    const [showModal, setShowModal] = useState(false);
    const [selectedFollow, setSelectedFollow] = useState<FollowRecord | null>(null);
    const [viewMode, setViewMode] = useState<'create' | 'edit' | 'details' | null>(null);

    // Estados para catálogos de filtros
    const [empresasFiltro, setEmpresasFiltro] = useState<string[]>([]);
    const [usuariosFiltro, setUsuariosFiltro] = useState<string[]>([]);

    // Controles de Vista y Búsqueda General
    const [tipoVista, setTipoVista] = useState<'tabla' | 'cards'>('tabla');
    const [search, setSearch] = useState('');

    // Estado para controlar el menú desplegable activo (Typeahead)
    const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

    // Estado para mostrar gráficas
    const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);

    // Búsquedas internas para cada menú Typeahead
    const [searchTipo, setSearchTipo] = useState('');
    const [searchMedio, setSearchMedio] = useState('');
    const [searchEstatus, setSearchEstatus] = useState('');
    const [searchEmpresa, setSearchEmpresa] = useState('');
    const [searchUsuario, setSearchUsuario] = useState('');

    // Filtros Seleccionados (Soporte Múltiple)
    const [selectedTipo, setSelectedTipo] = useState<string[]>([]);
    const [selectedMedio, setSelectedMedio] = useState<string[]>([]);
    const [selectedEstatus, setSelectedEstatus] = useState<string[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState<string[]>([]);
    const [selectedUsuario, setSelectedUsuario] = useState<string[]>([]);
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');

    const [showFilters, setShowFilters] = useState<boolean>(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    const filterContainerRef = useRef<HTMLDivElement>(null);

    // Cerrar el dropdown al hacer clic fuera del panel de filtros
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
                setOpenFilterMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Función auxiliar para alternar elementos en filtros múltiples
    const toggleMultiSelect = (item: string, currentList: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (currentList.includes(item)) {
            setList(currentList.filter(i => i !== item));
        } else {
            setList([...currentList, item]);
        }
    };

    // Contador de Filtros Activos
    const totalFiltrosActivos =
        selectedTipo.length +
        selectedMedio.length +
        selectedEstatus.length +
        selectedEmpresa.length +
        selectedUsuario.length +
        (fechaDesde ? 1 : 0) +
        (fechaHasta ? 1 : 0) +
        (search.trim() ? 1 : 0);

    const clearAllFilters = () => {
        setSearch('');
        setSelectedTipo([]);
        setSelectedMedio([]);
        setSelectedEstatus([]);
        setSelectedEmpresa([]);
        setSelectedUsuario([]);
        setFechaDesde('');
        setFechaHasta('');
        setSearchTipo('');
        setSearchMedio('');
        setSearchEstatus('');
        setSearchEmpresa('');
        setSearchUsuario('');
    };

    useEffect(() => {
        if (company?._id) {
            fetchFollows();
        }
    }, [company]);

    // Cargar catálogo de filtros optimizado al montar el componente
    useEffect(() => {
        const fetchFilterCatalogs = async () => {
            try {
                const [resEmpresas, resUsuarios] = await Promise.all([
                    api.get('/companies/follows/filter-companies'),
                    api.get('/companies/follows/filter-users')
                ]);

                setEmpresasFiltro(resEmpresas.data.map((e: any) => e.nombreComercial));
                setUsuariosFiltro(resUsuarios.data.map((u: any) => u.nombre));
            } catch (error) {
                console.error('Error cargando filtros iniciales:', error);
            }
        };

        fetchFilterCatalogs();
    }, []);

    // Petición al Backend
    const fetchFollows = async () => {
        try {
            setLoading(true);
            setHasQueried(true);

            const endpoint = company?._id
                ? `/companies/follows/${company._id}`
                : '/companies/follows';

            const params: Record<string, any> = {};

            // 💡 Si NO es modal (Router), enviamos todos los parámetros al Backend
            if (!company?._id) {
                if (search.trim()) params.search = search.trim();
                if (selectedTipo.length > 0) params.tipo = selectedTipo.join(',');
                if (selectedMedio.length > 0) params.medio = selectedMedio.join(',');
                if (selectedEstatus.length > 0) params.estatus = selectedEstatus.join(',');
                if (selectedEmpresa.length > 0) params.empresa = selectedEmpresa.join(',');
                if (selectedUsuario.length > 0) params.usuario = selectedUsuario.join(',');
                if (fechaDesde) params.fechaDesde = fechaDesde;
                if (fechaHasta) params.fechaHasta = fechaHasta;
            }

            const res = await api.get(endpoint, { params });

            const normalizedData: FollowRecord[] = res.data.map((item: any) => ({
                _id: item._id,
                empresaId: item.empresaId?._id || item.empresaId || '',
                companyName: item.empresaId?.nombreComercial || item.otraEmpresa?.nombreEmpresa || 'Empresa No Registrada',
                otraEmpresa: item.otraEmpresa,
                tipoSeguimiento: item.tipoSeguimiento || 'General',
                medioAtencion: item.medioAtencion || 'Llamada telefónica',
                asunto: item.asunto || '',
                descripcion: item.descripcion || item.comentarios || '',
                fechaSeguimiento: item.fechaSeguimiento || item.createdAt,
                horaSeguimiento: item.horaSeguimiento || '',
                atencionSeguimiento: item.atencionSeguimiento || '',
                estatus: item.estatus || 'Pendiente',
                usuario: item.usuarioId?.nombre || 'Sistema',
                // 👈 Normalización de empresas vinculadas (soporta objetos o IDs)
                empresasVinculadas: Array.isArray(item.empresasVinculadas)
                    ? item.empresasVinculadas.map((ev: any) => typeof ev === 'object' ? ev : { _id: ev })
                    : []
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

    // 💡 LÓGICA HÍBRIDA DE FILTRADO: FRONTEND vs BACKEND
    const filteredFollows = useMemo(() => {
        // Si no es un modal de empresa específica, devolvemos los datos directo del servidor
        if (!company?._id) return follows;

        // Si es dentro de un modal (company?._id activo), filtramos localmente en el Frontend
        return follows.filter((item) => {
            // Filtro Búsqueda Texto
            if (search.trim()) {
                const searchLower = search.toLowerCase();
                const matchesText =
                    item.descripcion?.toLowerCase().includes(searchLower) ||
                    item.asunto?.toLowerCase().includes(searchLower) ||
                    item.companyName?.toLowerCase().includes(searchLower) ||
                    item.usuario?.toLowerCase().includes(searchLower);
                if (!matchesText) return false;
            }

            // Filtros de Selección Múltiple
            if (selectedTipo.length > 0 && !selectedTipo.includes(item.tipoSeguimiento ?? '')) return false;
            if (selectedMedio.length > 0 && !selectedMedio.includes(item.medioAtencion ?? '')) return false;
            if (selectedEstatus.length > 0 && !selectedEstatus.includes(item.estatus ?? '')) return false;
            if (selectedEmpresa.length > 0 && !selectedEmpresa.includes(item.companyName ?? '')) return false;
            if (selectedUsuario.length > 0 && !selectedUsuario.includes(item.usuario ?? '')) return false;

            // Filtros Fechas
            if (fechaDesde || fechaHasta) {
                const itemDate = new Date(item.fechaSeguimiento).getTime();
                if (fechaDesde && itemDate < new Date(`${fechaDesde}T00:00:00.000Z`).getTime()) return false;
                if (fechaHasta && itemDate > new Date(`${fechaHasta}T23:59:59.999Z`).getTime()) return false;
            }

            return true;
        });
    }, [
        follows, company, search, selectedTipo, selectedMedio,
        selectedEstatus, selectedEmpresa, selectedUsuario, fechaDesde, fechaHasta
    ]);

    const handleExportExcel = async () => {
        await exportFollowsToExcel(filteredFollows, company?.nombreComercial);
    }

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
                    {canEdit && (
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
                    )}

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
            <div className="space-y-4" ref={filterContainerRef}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

                    {/* Grupo Izquierdo: Buscador + Filtros + Buscar */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* Campo de Búsqueda General */}
                        <div className="relative sm:col-span-6 md:col-span-7">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar en el seguimiento o comentarios..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !company && fetchFollows()}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Botón Desplegable de Filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`sm:col-span-3 md:col-span-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${totalFiltrosActivos > 0 || showFilters
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4 shrink-0" />
                            <span>Filtros</span>
                            {totalFiltrosActivos > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                    {totalFiltrosActivos}
                                </span>
                            )}
                        </button>

                        {/* Botón Consultar / Buscar */}
                        {!company && (
                            <button
                                onClick={fetchFollows}
                                disabled={loading}
                                className="sm:col-span-3 md:col-span-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-md"
                            >
                                <Search className="w-4 h-4 shrink-0" />
                                <span>{loading ? '...' : 'Buscar'}</span>
                            </button>
                        )}
                    </div>

                    {/* Grupo Derecho: Exportaciones y Conmutador de Vista */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        {filteredFollows.length > 0 && (
                            <div className="flex items-center gap-2">
                                {/* Botón de Gráficas */}
                                <button
                                    type="button"
                                    onClick={() => setIsChartsModalOpen(true)}
                                    title="Ver Gráficas"
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-2 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Gráficas</span>
                                </button>
                                {/* Botón de Excel */}
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    title="Exportar a Excel"
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-2 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Excel</span>
                                </button>
                                {/* Botón de PDF */}
                                <PDFDownloadLink
                                    document={
                                        <CompaniesFollowSheetPDFDocument
                                            follows={filteredFollows}
                                            companyName={company?.nombreComercial}
                                        />
                                    }
                                    fileName={`Seguimientos_${company?.nombreComercial ? company.nombreComercial.replace(/\s+/g, '_') : 'Global'}_${new Date().toISOString().split('T')[0]}.pdf`}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-3.5 py-2 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    {({ loading }) => (
                                        <>
                                            <FileText className="w-4 h-4" />
                                            <span className="hidden sm:inline">{loading ? '...' : 'PDF'}</span>
                                        </>
                                    )}
                                </PDFDownloadLink>
                            </div>
                        )}

                        {/* Conmutador de Vista (Tabla / Tarjetas) */}
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
                                <span className="hidden xl:inline">Tabla</span>
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
                                <span className="hidden xl:inline">Tarjetas</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* PANEL DESPLEGABLE DE FILTROS AVANZADOS (TYPEAHEAD MULTI-SELECT) */}
                {showFilters && (
                    <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all">

                        {/* 1. Tipo (Múltiple) */}
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <Tag className="w-3.5 h-3.5 text-slate-400" />
                                <span>Filtrar por Tipo</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'tipo' ? null : 'tipo')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedTipo.length > 0
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span className="truncate">
                                    {selectedTipo.length === 0
                                        ? 'Todos los tipos'
                                        : `${selectedTipo.length} seleccionado(s)`}
                                </span>
                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFilterMenu === 'tipo' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'tipo' && (
                                <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar tipo..."
                                            value={searchTipo}
                                            onChange={(e) => setSearchTipo(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTipo([])}
                                            className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-400 flex items-center justify-between border-b border-slate-800 mb-1"
                                        >
                                            <span>Limpiar selección</span>
                                            {selectedTipo.length === 0 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                        </button>
                                        {OPCIONES_TIPO_SEGUIMIENTO
                                            .filter(item => item.toLowerCase().includes(searchTipo.toLowerCase()))
                                            .map((tipo) => {
                                                const isSelected = selectedTipo.includes(tipo);
                                                return (
                                                    <button
                                                        key={tipo}
                                                        type="button"
                                                        onClick={() => toggleMultiSelect(tipo, selectedTipo, setSelectedTipo)}
                                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                    >
                                                        <span className="truncate">{tipo}</span>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Medio de Atención (Múltiple) */}
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                                <span>Filtrar por Medio de Atención</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'medio' ? null : 'medio')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedMedio.length > 0
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span className="truncate">
                                    {selectedMedio.length === 0
                                        ? 'Todos los medios'
                                        : `${selectedMedio.length} seleccionado(s)`}
                                </span>
                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFilterMenu === 'medio' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'medio' && (
                                <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar medio..."
                                            value={searchMedio}
                                            onChange={(e) => setSearchMedio(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMedio([])}
                                            className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-400 flex items-center justify-between border-b border-slate-800 mb-1"
                                        >
                                            <span>Limpiar selección</span>
                                            {selectedMedio.length === 0 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                        </button>
                                        {OPCIONES_MEDIO_ATENCION
                                            .filter(item => item.toLowerCase().includes(searchMedio.toLowerCase()))
                                            .map((medio) => {
                                                const isSelected = selectedMedio.includes(medio);
                                                return (
                                                    <button
                                                        key={medio}
                                                        type="button"
                                                        onClick={() => toggleMultiSelect(medio, selectedMedio, setSelectedMedio)}
                                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                    >
                                                        <span className="truncate">{medio}</span>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Estatus (Múltiple) */}
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Filtrar por Estatus</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'estatus' ? null : 'estatus')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedEstatus.length > 0
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span className="truncate">
                                    {selectedEstatus.length === 0
                                        ? 'Todos los estatus'
                                        : `${selectedEstatus.length} seleccionado(s)`}
                                </span>
                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFilterMenu === 'estatus' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'estatus' && (
                                <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar estatus..."
                                            value={searchEstatus}
                                            onChange={(e) => setSearchEstatus(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEstatus([])}
                                            className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-400 flex items-center justify-between border-b border-slate-800 mb-1"
                                        >
                                            <span>Limpiar selección</span>
                                            {selectedEstatus.length === 0 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                        </button>
                                        {OPCIONES_ESTATUS_SEGUIMIENTO
                                            .filter(item => item.toLowerCase().includes(searchEstatus.toLowerCase()))
                                            .map((estatus) => {
                                                const isSelected = selectedEstatus.includes(estatus);
                                                return (
                                                    <button
                                                        key={estatus}
                                                        type="button"
                                                        onClick={() => toggleMultiSelect(estatus, selectedEstatus, setSelectedEstatus)}
                                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                    >
                                                        <span className="truncate">{estatus}</span>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Empresa (Múltiple) */}
                        {!company && (
                            <div className="relative">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Filtrar por Empresa</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterMenu(openFilterMenu === 'empresa' ? null : 'empresa')}
                                    className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedEmpresa.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                        }`}
                                >
                                    <span className="truncate">
                                        {selectedEmpresa.length === 0
                                            ? 'Todas las empresas'
                                            : `${selectedEmpresa.length} seleccionada(s)`}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFilterMenu === 'empresa' ? 'rotate-180' : ''}`} />
                                </button>

                                {openFilterMenu === 'empresa' && (
                                    <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar empresa..."
                                                value={searchEmpresa}
                                                onChange={(e) => setSearchEmpresa(e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEmpresa([])}
                                                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-400 flex items-center justify-between border-b border-slate-800 mb-1"
                                            >
                                                <span>Limpiar selección</span>
                                                {selectedEmpresa.length === 0 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                            </button>
                                            {empresasFiltro
                                                .filter(emp => emp.toLowerCase().includes(searchEmpresa.toLowerCase()))
                                                .map((emp) => {
                                                    const isSelected = selectedEmpresa.includes(emp);
                                                    return (
                                                        <button
                                                            key={emp}
                                                            type="button"
                                                            onClick={() => toggleMultiSelect(emp, selectedEmpresa, setSelectedEmpresa)}
                                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                        >
                                                            <span className="truncate">{emp}</span>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                                {isSelected && <Check className="w-3 h-3" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Usuario (Múltiple) */}
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Filtrar por Usuario</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'usuario' ? null : 'usuario')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedUsuario.length > 0
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span className="truncate">
                                    {selectedUsuario.length === 0
                                        ? 'Todos los usuarios'
                                        : `${selectedUsuario.length} seleccionado(s)`}
                                </span>
                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFilterMenu === 'usuario' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'usuario' && (
                                <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario..."
                                            value={searchUsuario}
                                            onChange={(e) => setSearchUsuario(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUsuario([])}
                                            className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-400 flex items-center justify-between border-b border-slate-800 mb-1"
                                        >
                                            <span>Limpiar selección</span>
                                            {selectedUsuario.length === 0 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                        </button>
                                        {usuariosFiltro
                                            .filter(usr => usr.toLowerCase().includes(searchUsuario.toLowerCase()))
                                            .map((usr) => {
                                                const isSelected = selectedUsuario.includes(usr);
                                                return (
                                                    <button
                                                        key={usr}
                                                        type="button"
                                                        onClick={() => toggleMultiSelect(usr, selectedUsuario, setSelectedUsuario)}
                                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                                                    >
                                                        <span className="truncate">{usr}</span>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 6. Fecha Desde */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Fecha Desde</span>
                            </label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* 7. Fecha Hasta */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Fecha Hasta</span>
                            </label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                    </div>
                )}

                {/* CHIPS DE FILTROS APLICADOS */}
                {totalFiltrosActivos > 0 && (
                    <div className="flex items-center gap-2 flex-wrap bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                        <span className="text-xs text-slate-400 font-medium">Filtros aplicados:</span>

                        {/* 👈 Chip para el buscador de texto general */}
                        {search.trim() && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-600">
                                <Search className="w-3 h-3 text-slate-400" />
                                Búsqueda: "{search.trim()}"
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        if (!company) fetchFollows(); // Reconsulta si estás en la vista global
                                    }}
                                    className="hover:text-white ml-0.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedTipo.map((tipo) => (
                            <span key={tipo} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                                Tipo: {tipo}
                                <button onClick={() => toggleMultiSelect(tipo, selectedTipo, setSelectedTipo)} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        {selectedMedio.map((medio) => (
                            <span key={medio} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                                Medio: {medio}
                                <button onClick={() => toggleMultiSelect(medio, selectedMedio, setSelectedMedio)} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        {selectedEstatus.map((estatus) => (
                            <span key={estatus} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                                Estatus: {estatus}
                                <button onClick={() => toggleMultiSelect(estatus, selectedEstatus, setSelectedEstatus)} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        {selectedEmpresa.map((emp) => (
                            <span key={emp} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                                <Building2 className="w-3 h-3" />
                                Empresa: {emp}
                                <button onClick={() => toggleMultiSelect(emp, selectedEmpresa, setSelectedEmpresa)} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        {selectedUsuario.map((usr) => (
                            <span key={usr} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                                <User className="w-3 h-3" />
                                Usuario: {usr}
                                <button onClick={() => toggleMultiSelect(usr, selectedUsuario, setSelectedUsuario)} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        {fechaDesde && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg border border-cyan-500/20">
                                <Calendar className="w-3 h-3" />
                                Desde: {fechaDesde}
                                <button onClick={() => setFechaDesde('')} className="hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {fechaHasta && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg border border-cyan-500/20">
                                <Calendar className="w-3 h-3" />
                                Hasta: {fechaHasta}
                                <button onClick={() => setFechaHasta('')} className="hover:text-white">
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
            </div>

            {/* Renderizado de vistas */}
            {!hasQueried ? (
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-full">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Consulta de Seguimientos</h3>
                    <p className="text-sm text-slate-400 max-w-md">
                        Aplica los filtros requeridos o presiona el botón <strong className="text-blue-400">Buscar</strong> para obtener los seguimientos del sistema.
                    </p>
                    <button
                        onClick={fetchFollows}
                        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors shadow-lg"
                    >
                        Buscar Todos los Seguimientos
                    </button>
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
                    {/* CONTADOR DE RESULTADOS ENCONTRADOS */}
                    {!loading && filteredFollows.length > 0 && (
                        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800/60 border border-slate-700/60 px-4 py-2.5 rounded-lg text-sm text-slate-300 shadow-sm gap-1">
                            <span className="font-medium">
                                Se {filteredFollows.length === 1 ? 'encontró' : 'encontraron'}{' '}
                                <strong className="text-blue-400 font-semibold">{filteredFollows.length}</strong>{' '}
                                {filteredFollows.length === 1 ? 'resultado' : 'resultados'}
                            </span>

                            {totalFiltrosActivos > 0 && filteredFollows.length !== follows.length && (
                                <span className="text-xs text-slate-400">
                                    (filtrados de un total de {follows.length})
                                </span>
                            )}
                        </div>
                    )}
                    {tipoVista === 'tabla' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                        <tr>
                                            {!company && <th className="px-6 py-4">Empresa</th>}
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Tipo</th>
                                            <th className="px-6 py-4">Asunto</th>
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
                                                    {formatFechaLarga(item.fechaSeguimiento)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                                                        {item.tipoSeguimiento}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate text-slate-300">
                                                    {item.asunto}
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
                                                        {canEdit && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFollow(item);
                                                                        setViewMode('edit');
                                                                        setShowModal(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
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
                                            <span>{formatFechaLarga(item.fechaSeguimiento)}</span>
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
                                            {canEdit && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFollow(item);
                                                            setViewMode('edit');
                                                            setShowModal(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id, item.companyName)}
                                                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
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
                    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">

                        {/* Encabezado del Modal */}
                        <div className="p-6 border-b border-slate-700/80 bg-slate-900/90 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                    <ChartGantt size={20} />
                                </div>
                                <span>
                                    {viewMode === 'details' && 'Detalles del Seguimiento'}
                                    {viewMode === 'edit' && 'Editar Seguimiento'}
                                    {viewMode === 'create' && 'Registrar Nuevo Seguimiento'}
                                </span>
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-6 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
                            {viewMode === 'details' && selectedFollow ? (
                                <div className="space-y-6 text-sm text-slate-300">

                                    {/* Bloque Destacado: Empresa */}
                                    <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl shrink-0 border ${selectedFollow.otraEmpresa
                                                    ? 'bg-amber-600/10 border-amber-500/20 text-amber-400'
                                                    : 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                                                    }`}>
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                        {selectedFollow.otraEmpresa ? 'Empresa No Registrada (Manual)' : 'Empresa Registrada'}
                                                    </span>
                                                    <p className="text-base text-white font-bold tracking-wide">
                                                        {selectedFollow.companyName}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Estatus Badge */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${selectedFollow.estatus === 'Completado'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                }`}>
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {selectedFollow.estatus}
                                            </span>
                                        </div>

                                        {/* Si fue registrada como OTRA empresa, mostrar sus datos adicionales */}
                                        {selectedFollow.otraEmpresa && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-xs text-slate-300">
                                                {selectedFollow.otraEmpresa.rfc && (
                                                    <div><span className="text-slate-400">RFC:</span> {selectedFollow.otraEmpresa.rfc}</div>
                                                )}
                                                {selectedFollow.otraEmpresa.nombreContacto && (
                                                    <div><span className="text-slate-400">Contacto:</span> {selectedFollow.otraEmpresa.nombreContacto}</div>
                                                )}
                                                {selectedFollow.otraEmpresa.telefonoContacto && (
                                                    <div><span className="text-slate-400">Teléfono:</span> {selectedFollow.otraEmpresa.telefonoContacto}</div>
                                                )}
                                                {selectedFollow.otraEmpresa.correoElectronico && (
                                                    <div><span className="text-slate-400">Correo:</span> {selectedFollow.otraEmpresa.correoElectronico}</div>
                                                )}
                                                {(selectedFollow.otraEmpresa.estado || selectedFollow.otraEmpresa.municipio) && (
                                                    <div>
                                                        <span className="text-slate-400">Ubicación:</span> {[selectedFollow.otraEmpresa.municipio, selectedFollow.otraEmpresa.estado].filter(Boolean).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadatos en Grilla */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                        {/* Tipo de Seguimiento */}
                                        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-slate-700/50 text-blue-400 rounded-lg">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Tipo</span>
                                                <p className="text-white font-medium">{selectedFollow.tipoSeguimiento}</p>
                                            </div>
                                        </div>

                                        {/* Medio de Atención */}
                                        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-slate-700/50 text-emerald-400 rounded-lg">
                                                <PhoneCall className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Medio de Atención</span>
                                                <p className="text-white font-medium">{selectedFollow.medioAtencion}</p>
                                            </div>
                                        </div>

                                        {/* Fecha y Hora */}
                                        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-slate-700/50 text-cyan-400 rounded-lg">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Fecha / Hora</span>
                                                <p className="text-white font-medium">
                                                    {formatFechaLarga(selectedFollow.fechaSeguimiento)}
                                                    {selectedFollow.horaSeguimiento && ` — ${selectedFollow.horaSeguimiento}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Usuario Registrador */}
                                        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-slate-700/50 text-indigo-400 rounded-lg">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Atendido Por</span>
                                                <p className="text-white font-medium">{selectedFollow.usuario}</p>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Empresas Vinculadas (solo si el tipo es Vinculación o existen vinculaciones) */}
                                    {selectedFollow.empresasVinculadas && selectedFollow.empresasVinculadas.length > 0 && (
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                                Empresas Vinculadas ({selectedFollow.empresasVinculadas.length})
                                            </span>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {selectedFollow.empresasVinculadas.map((emp: any, idx: number) => (
                                                    <span
                                                        key={emp._id || idx}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-300 text-xs font-medium rounded-lg border border-blue-500/20 shadow-sm"
                                                    >
                                                        <Building2 className="w-3 h-3 text-blue-400" />
                                                        {emp.nombreComercial || emp.razonSocial || 'Empresa Vinculada'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Persona o Atención de Seguimiento */}
                                    {selectedFollow.atencionSeguimiento && (
                                        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-slate-700/50 text-amber-400 rounded-lg">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Atención con Persona / Contacto</span>
                                                <p className="text-white font-medium">{selectedFollow.atencionSeguimiento}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Asunto y Descripción */}
                                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                                        {selectedFollow.asunto && (
                                            <div className="border-b border-slate-700/60 pb-3">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                                    Asunto
                                                </span>
                                                <p className="text-base text-blue-300 font-semibold">{selectedFollow.asunto}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                Descripción / Comentarios
                                            </span>
                                            <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-700/50 text-slate-200 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                                                {selectedFollow.descripcion || 'Sin comentarios adicionales.'}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <CompanyFollowForm
                                    companyId={company?._id || (selectedFollow?.otraEmpresa ? 'OTRA' : selectedFollow?.empresaId)}
                                    initialData={selectedFollow}
                                    onClose={() => setShowModal(false)}
                                    onSuccess={() => {
                                        setShowModal(false);
                                        fetchFollows();
                                    }}
                                />
                            )}
                        </div>

                        {/* Pie de modal para cerrar/acciones */}
                        {viewMode === 'details' && selectedFollow && (
                            <div className="p-4 border-t border-slate-700/80 bg-slate-900/90 flex justify-end">
                                <div className="flex items-center gap-2">
                                    {canEdit && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setViewMode('edit');
                                                }}
                                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span>Editar</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    handleDelete(selectedFollow._id, selectedFollow.companyName);
                                                }}
                                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Eliminar</span>
                                            </button>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Modal de Gráficas Estadísticas */}
            <CompaniesFollowGraphics
                isOpen={isChartsModalOpen}
                onClose={() => setIsChartsModalOpen(false)}
                follows={filteredFollows}
            />
        </div>
    );
};
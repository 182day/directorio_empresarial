// src/pages/CompaniesPage.tsx
import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import { CompanyForm, type CompanyFormData } from '../components/CompanyForm';
import { CompaniesFilterDrawer } from '../components/CompaniesFilterDrawer';
import { Pagination } from '../components/Pagination';
import {
    Plus, Edit2, Trash2, Search, X, Table, LayoutGrid, MapPin, Globe, Eye, SlidersHorizontal, Download, FileText, BarChart3
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Importación de Recharts para las gráficas estadísticas
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

// Importación de React PDF
import { CompaniesPDFDocument } from '../components/CompaniesPDFDocument';
import { CompanySheetPDFDocument } from '../components/CompanySheetPDFDocument';

interface Company {
    _id: string;
    nombreComercial: string;
    razonSocial: string;
    rfc: string;
    tamanoEmpresa: string;
    anioInicio: number;
    sitioWeb?: string;
    etiquetas: string[];
    ubicacion: {
        estado: string;
        municipio: string;
    };
    activa: boolean;
}

const OPCIONES_TAMANO = ['Micro', 'Pequeña', 'Mediana', 'Grande'];
const COLORES_GRAFICA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const CompaniesPage = () => {
    const { user } = useContext(AuthContext);
    const canEdit = user?.rol === 'admin' || user?.rol === 'editor';
    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [tipoVista, setTipoVista] = useState<'tabla' | 'cards'>('tabla');

    // Estados para Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(5);

    // Estado del Drawer de Filtros Lateral
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Estado para el Modal de Gráficas Estadísticas
    const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);

    // Estados para Filtros Múltiples (DENTRO DEL DRAWER)
    const [selectedTamanos, setSelectedTamanos] = useState<string[]>([]);
    const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
    const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([]);
    const [selectedEstatus, setSelectedEstatus] = useState<string[]>([]);

    // Estados para Modales (Crear/Editar y Ver)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCompany, setViewingCompany] = useState<Company | null>(null);

    useEffect(() => {
        fetchCompanies();
    }, [search]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await api.get('/companies', { params: { busqueda: search } });
            setCompanies(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error al cargar empresas:', err);
        } finally {
            setLoading(false);
        }
    };

    const opcionesEstados = useMemo(() => {
        const estados = companies
            .map((c) => c.ubicacion?.estado)
            .filter((e): e is string => Boolean(e));
        return Array.from(new Set(estados)).sort();
    }, [companies]);

    const opcionesMunicipios = useMemo(() => {
        const empresasFiltradasPorEstado = selectedEstados.length > 0
            ? companies.filter((c) => selectedEstados.includes(c.ubicacion?.estado))
            : companies;

        const municipios = empresasFiltradasPorEstado
            .map((c) => c.ubicacion?.municipio)
            .filter((m): m is string => Boolean(m));
        return Array.from(new Set(municipios)).sort();
    }, [companies, selectedEstados]);

    const toggleFilter = (item: string, currentList: string[], setList: (vals: string[]) => void) => {
        setCurrentPage(1);
        if (currentList.includes(item)) {
            setList(currentList.filter((i) => i !== item));
        } else {
            setList([...currentList, item]);
        }
    };

    const handleToggleEstatus = (estatus: string) => {
        setCurrentPage(1);
        setSelectedEstatus((prev) =>
            prev.includes(estatus)
                ? prev.filter((item) => item !== estatus)
                : [...prev, estatus]
        );
    };

    const clearAllFilters = () => {
        setSearch('');
        setSelectedTamanos([]);
        setSelectedEstados([]);
        setSelectedMunicipios([]);
        setSelectedEstatus([]);
        setCurrentPage(1);
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter((comp) => {
            const matchTamano = selectedTamanos.length === 0 || selectedTamanos.includes(comp.tamanoEmpresa);
            const matchEstado = selectedEstados.length === 0 || selectedEstados.includes(comp.ubicacion?.estado);
            const matchMunicipio = selectedMunicipios.length === 0 || selectedMunicipios.includes(comp.ubicacion?.municipio);

            const matchEstatus = selectedEstatus.length === 0 || (
                (selectedEstatus.includes('Activo') && comp.activa) ||
                (selectedEstatus.includes('Inactivo') && !comp.activa)
            );

            return matchTamano && matchEstado && matchMunicipio && matchEstatus;
        });
    }, [companies, selectedTamanos, selectedEstados, selectedMunicipios, selectedEstatus]);

    // 📊 DATOS CALCULADOS PARA LAS GRÁFICAS (Basados en las empresas filtradas actualmente)
    const dataTamanoGrafica = useMemo(() => {
        const conteo: Record<string, number> = {};
        filteredCompanies.forEach((c) => {
            const tam = c.tamanoEmpresa || 'No especificado';
            conteo[tam] = (conteo[tam] || 0) + 1;
        });
        return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
    }, [filteredCompanies]);

    const dataEstadoGrafica = useMemo(() => {
        const conteo: Record<string, number> = {};
        filteredCompanies.forEach((c) => {
            const estado = c.ubicacion?.estado || 'Sin estado';
            conteo[estado] = (conteo[estado] || 0) + 1;
        });
        return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
    }, [filteredCompanies]);

    const dataMunicipioGrafica = useMemo(() => {
        if (selectedEstados.length === 0) return [];
        const conteo: Record<string, number> = {};
        filteredCompanies.forEach((c) => {
            const muni = c.ubicacion?.municipio || 'Sin municipio';
            conteo[muni] = (conteo[muni] || 0) + 1;
        });
        return Object.keys(conteo).map((key) => ({ name: key, total: conteo[key] }));
    }, [filteredCompanies, selectedEstados]);

    const paginatedCompanies = useMemo(() => {
        if (pageSize === 'all') return filteredCompanies;

        const startIndex = (currentPage - 1) * pageSize;
        return filteredCompanies.slice(startIndex, startIndex + pageSize);
    }, [filteredCompanies, currentPage, pageSize]);

    const openModal = (company?: Company) => {
        setEditingCompany(company || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCompany(null);
    };

    const openViewModal = (company: Company) => {
        setViewingCompany(company);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewingCompany(null);
    };

    const handleFormSubmit = async (formData: CompanyFormData) => {
        const operacionesArray = formData.etiquetas
            ? formData.etiquetas.split(',').map((op) => op.trim())
            : [];

        const tipoOperacionesFinal = operacionesArray.length > 0 ? operacionesArray : ['Servicios'];

        const payload = {
            nombreComercial: formData.nombreComercial,
            razonSocial: formData.razonSocial,
            rfc: formData.rfc,
            tamanoEmpresa: formData.tamanoEmpresa,
            anioInicio: Number(formData.anioInicio),
            sitioWeb: formData.sitioWeb || '',
            etiquetas: tipoOperacionesFinal,
            tipoSuministro: ['Directo'],
            estado: formData.estado,
            municipio: formData.municipio,
            direccion: 'Sin dirección registrada',
            colonia: 'Sin colonia',
            codigoPostal: '00000',
            parqueIndustrial: '',
            activa: formData.activo
        };

        try {
            if (editingCompany) {
                await api.put(`/companies/${editingCompany._id}`, payload);
            } else {
                await api.post('/companies', payload);
            }

            closeModal();
            fetchCompanies();
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = (id: string, nombre: string) => {
        Swal.fire({
            title: '¿Está seguro de eliminar la empresa?',
            html: `Está a punto de eliminar a <strong style="color: #fff;">${nombre}</strong>. Esta acción no se puede deshacer.`,
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
                    await api.delete(`/companies/${id}`);
                    toast.success(`La empresa ${nombre} ha sido eliminada correctamente.`);
                    fetchCompanies();
                } catch (err: any) {
                    const mensajeError = err.response?.data?.message || 'Error al eliminar la empresa.';
                    toast.error(mensajeError);
                }
            }
        });
    };

    const totalFiltrosActivos =
        (search.trim() ? 1 : 0) +
        selectedTamanos.length +
        selectedEstados.length +
        selectedMunicipios.length +
        selectedEstatus.length;

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Empresas');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 28 },
            { header: 'Nombre Comercial', key: 'nombreComercial', width: 30 },
            { header: 'Razón Social', key: 'razonSocial', width: 30 },
            { header: 'RFC', key: 'rfc', width: 16 },
            { header: 'Tamaño', key: 'tamanoEmpresa', width: 18 },
            { header: 'Estado', key: 'estado', width: 22 },
            { header: 'Municipio', key: 'municipio', width: 22 },
            { header: 'Estatus', key: 'estatus', width: 15 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1E3A8A' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        filteredCompanies.forEach((company) => {
            const estatusTexto = company.activa ? 'Activo' : 'Inactivo';

            const row = worksheet.addRow({
                id: company._id,
                nombreComercial: company.nombreComercial,
                razonSocial: company.razonSocial,
                rfc: company.rfc,
                tamanoEmpresa: company.tamanoEmpresa,
                estado: company.ubicacion?.estado || '',
                municipio: company.ubicacion?.municipio || '',
                estatus: estatusTexto,
            });

            row.alignment = { vertical: 'middle' };

            const statusCell = row.getCell('estatus');
            statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

            if (company.activa) {
                statusCell.font = { color: { argb: '15803D' }, bold: true };
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'DCFCE7' },
                };
            } else {
                statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FEE2E2' },
                };
            }
        });

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E2E8F0' } },
                    left: { style: 'thin', color: { argb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                    right: { style: 'thin', color: { argb: 'E2E8F0' } },
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const fileName = `Reporte_Empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);
    };

    return (
        <>
            {/* BARRA SUPERIOR DE ACCIONES */}
            <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 w-full 2xl:w-auto flex-wrap">
                    {/* Buscador General por Nombre/RFC */}
                    <div className="relative flex-1 sm:w-72 min-w-[200px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RFC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Botón para Abrir Drawer de Filtros */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all shrink-0 ${totalFiltrosActivos > 0
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

                    {/* GRUPO DE ACCIONES (Gráficas y Exportación) */}
                    {filteredCompanies.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* BOTÓN PARA ABRIR MODAL DE GRÁFICAS ESTADÍSTICAS */}
                            <button
                                type="button"
                                onClick={() => setIsChartsModalOpen(true)}
                                title="Ver Gráficas"
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Gráficas</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleExportExcel}
                                title="Exportar Excel"
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    const { pdf } = await import('@react-pdf/renderer');
                                    const doc = tipoVista === 'tabla'
                                        ? <CompaniesPDFDocument companies={filteredCompanies} />
                                        : <CompanySheetPDFDocument companies={filteredCompanies} />;

                                    const blob = await pdf(doc).toBlob();
                                    const nombreArchivo = tipoVista === 'tabla'
                                        ? `Reporte_Empresas_Tabla_${new Date().toISOString().split('T')[0]}.pdf`
                                        : `Fichas_Tecnicas_Empresas_${new Date().toISOString().split('T')[0]}.pdf`;

                                    saveAs(blob, nombreArchivo);
                                }}
                                title={tipoVista === 'tabla' ? 'Descargar reporte en PDF' : 'Descargar fichas en PDF'}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0"
                            >
                                <FileText className="w-4 h-4" />
                                <span>
                                    PDF
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 justify-between 2xl:justify-end shrink-0">
                    {companies.length > 0 && (
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
                    )}

                    {canEdit && (
                        <button
                            onClick={() => openModal()}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva Empresa</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CHIPS DE FILTRO */}
            {totalFiltrosActivos > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-xs text-slate-400 font-medium">Filtros aplicados:</span>

                    {search.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                            Búsqueda: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedTamanos.map((tamano) => (
                        <span key={tamano} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Tamaño: {tamano}
                            <button onClick={() => toggleFilter(tamano, selectedTamanos, setSelectedTamanos)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedEstados.map((estado) => (
                        <span key={estado} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Estado: {estado}
                            <button onClick={() => toggleFilter(estado, selectedEstados, setSelectedEstados)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedMunicipios.map((muni) => (
                        <span key={muni} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Municipio: {muni}
                            <button onClick={() => toggleFilter(muni, selectedMunicipios, setSelectedMunicipios)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {canEdit && selectedEstatus.map((est) => (
                        <span key={est} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Estatus: {est}
                            <button onClick={() => toggleFilter(est, selectedEstatus, setSelectedEstatus)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-slate-400 hover:text-red-400 underline ml-auto font-medium transition-colors"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            {/* TABLA O TARJETAS */}
            {loading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    Cargando datos...
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    No se encontraron empresas con los criterios seleccionados.
                </div>
            ) : (
                <>
                    {tipoVista === 'tabla' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Empresa</th>
                                            <th className="px-6 py-4">RFC</th>
                                            <th className="px-6 py-4">Ubicación</th>
                                            <th className="px-6 py-4">Tamaño</th>
                                            {canEdit && <th className="px-6 py-4">Estatus</th>}
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/60">
                                        {paginatedCompanies.map((comp) => (
                                            <tr key={comp._id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    <div>{comp.nombreComercial}</div>
                                                    <div className="text-xs text-slate-500">{comp.razonSocial}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">{comp.rfc}</td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {comp.ubicacion?.municipio}, {comp.ubicacion?.estado}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                                                        {comp.tamanoEmpresa}
                                                    </span>
                                                </td>

                                                {canEdit && (
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-2.5 py-0.5 text-xs rounded border font-medium inline-flex items-center gap-1.5 ${comp.activa
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                                }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${comp.activa ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                                            {comp.activa ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                )}

                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openViewModal(comp)}
                                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-md transition-colors"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal(comp)}
                                                                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(comp._id, comp.nombreComercial)}
                                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
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
                            {paginatedCompanies.map((comp) => (
                                <div
                                    key={comp._id}
                                    className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-colors"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-snug">{comp.nombreComercial}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-1">{comp.razonSocial}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 whitespace-nowrap">
                                                    {comp.tamanoEmpresa}
                                                </span>

                                                {canEdit && (
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded border font-medium flex items-center gap-1.5 whitespace-nowrap ${comp.activa
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${comp.activa ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                                        {comp.activa ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-xs text-slate-300 my-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{comp.ubicacion?.municipio}, {comp.ubicacion?.estado}</span>
                                            </div>
                                            {comp.sitioWeb && (
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <a href={comp.sitioWeb} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">
                                                        {comp.sitioWeb}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/60 mt-2">
                                        <button
                                            onClick={() => openViewModal(comp)}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Detalles</span>
                                        </button>

                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => openModal(comp)}
                                                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comp._id, comp.nombreComercial)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* COMPONENTE DE PAGINACIÓN */}
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredCompanies.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </>
            )}

            {/* 📊 MODAL DE GRÁFICAS ESTADÍSTICAS CON RECHARTS */}
            {isChartsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
                        {/* Cabecera del Modal */}
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/60">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    <span>Análisis Estadístico de Empresas</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Visualización basada en los {filteredCompanies.length} registros filtrados actuales.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsChartsModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cuerpo de las Gráficas */}
                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
                            {/* Gráfica 1: Tamaño de Empresa */}
                            {/* Gráfica 1: Tamaño de Empresa (Pastel / Pie Chart) */}
                            <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 shadow-md">
                                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                    Distribución por Tamaño de Empresa
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dataTamanoGrafica}
                                                dataKey="total"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                innerRadius={40} // Si lo quieres como dona (doughnut), déjalo en 40. Si lo quieres totalmente sólido, bórralo o ponlo en 0.
                                                label={({ name, percent }) => {
                                                    const itemName = name ?? 'Sin nombre';
                                                    const itemPercent = percent ? (percent * 100).toFixed(0) : 0;
                                                    return `${itemName}: ${itemPercent}%`;
                                                }}
                                                labelLine={false}
                                            >
                                                {dataTamanoGrafica.map((_, index) => (
                                                    <Cell key={`cell-pie-${index}`} fill={COLORES_GRAFICA[index % COLORES_GRAFICA.length]} />
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

                            {/* Gráfica 2: Estados */}
                            <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 shadow-md">
                                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    Distribución por Estado
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dataEstadoGrafica}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.5rem', color: '#fff' }}
                                            />
                                            <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]}>
                                                {dataEstadoGrafica.map((_, index) => (
                                                    <Cell key={`cell-est-${index}`} fill={COLORES_GRAFICA[(index + 1) % COLORES_GRAFICA.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Gráfica 3: Municipios (Solo se muestra si hay algún estado seleccionado) */}
                            {selectedEstados.length > 0 && (
                                <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 shadow-md animate-fade-in">
                                    <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                        Distribución por Municipio
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Filtrado por los estados: <span className="text-indigo-400 font-medium">{selectedEstados.join(', ')}</span>
                                    </p>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dataMunicipioGrafica}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.5rem', color: '#fff' }}
                                                />
                                                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                                    {dataMunicipioGrafica.map((_, index) => (
                                                        <Cell key={`cell-mun-${index}`} fill={COLORES_GRAFICA[(index + 2) % COLORES_GRAFICA.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pie del Modal */}
                        <div className="p-4 border-t border-slate-700 bg-slate-800/60 flex justify-end">
                            <button
                                onClick={() => setIsChartsModalOpen(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRAWER DE FILTROS */}
            <CompaniesFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                canEdit={canEdit}
                opcionesTamano={OPCIONES_TAMANO}
                opcionesEstados={opcionesEstados}
                opcionesMunicipios={opcionesMunicipios}
                selectedTamanos={selectedTamanos}
                selectedEstados={selectedEstados}
                selectedMunicipios={selectedMunicipios}
                selectedEstatus={selectedEstatus}
                onToggleTamano={(val) => toggleFilter(val, selectedTamanos, setSelectedTamanos)}
                onToggleEstado={(val) => toggleFilter(val, selectedEstados, setSelectedEstados)}
                onToggleMunicipio={(val) => toggleFilter(val, selectedMunicipios, setSelectedMunicipios)}
                onToggleEstatus={handleToggleEstatus}
                onClearAll={clearAllFilters}
                totalResultados={filteredCompanies.length}
            />

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">
                                {editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <CompanyForm
                                initialValues={
                                    editingCompany
                                        ? {
                                            nombreComercial: editingCompany.nombreComercial,
                                            razonSocial: editingCompany.razonSocial,
                                            rfc: editingCompany.rfc,
                                            tamanoEmpresa: editingCompany.tamanoEmpresa,
                                            anioInicio: editingCompany.anioInicio,
                                            sitioWeb: editingCompany.sitioWeb || '',
                                            etiquetas: editingCompany.etiquetas?.join(', ') || '',
                                            estado: editingCompany.ubicacion?.estado || '',
                                            municipio: editingCompany.ubicacion?.municipio || '',
                                            activo: editingCompany.activa
                                        }
                                        : undefined
                                }
                                isPublicRegistration={false}
                                isEditing={editingCompany ? true : false}
                                onSubmit={handleFormSubmit}
                                onCancel={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VER DETALLES */}
            {isViewModalOpen && viewingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{viewingCompany.nombreComercial}</h2>
                                <p className="text-xs text-slate-400">{viewingCompany.razonSocial}</p>
                            </div>
                            <button onClick={closeViewModal} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-sm text-slate-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">RFC</span>
                                    <p className="font-medium text-white">{viewingCompany.rfc}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Tamaño</span>
                                    <p className="font-medium text-white">{viewingCompany.tamanoEmpresa}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Ubicación</span>
                                    <p className="font-medium text-white">{viewingCompany.ubicacion?.municipio}, {viewingCompany.ubicacion?.estado}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Año Inicio</span>
                                    <p className="font-medium text-white">{viewingCompany.anioInicio}</p>
                                </div>

                                {canEdit && (
                                    <div>
                                        <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Estatus</span>
                                        <span
                                            className={`px-2.5 py-0.5 text-xs rounded border font-medium inline-flex items-center gap-1.5 ${viewingCompany.activa
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${viewingCompany.activa ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            {viewingCompany.activa ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {viewingCompany.sitioWeb && (
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Sitio Web</span>
                                    <p>
                                        <a href={viewingCompany.sitioWeb} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                            {viewingCompany.sitioWeb}
                                        </a>
                                    </p>
                                </div>
                            )}

                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">Operaciones</span>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    {viewingCompany.etiquetas?.map((op) => (
                                        <span key={op} className="px-2.5 py-0.5 bg-slate-700 text-slate-200 text-xs rounded-md">
                                            {op}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* PIE DEL MODAL CON BOTÓN DE FICHA TÉCNICA PDF */}
                        <div className="p-4 border-t border-slate-700 bg-slate-900/40 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={async () => {
                                    const { pdf } = await import('@react-pdf/renderer');
                                    const doc = <CompanySheetPDFDocument company={viewingCompany} />;
                                    const blob = await pdf(doc).toBlob();
                                    const nombreLimpio = viewingCompany.nombreComercial
                                        .replace(/[^a-zA-Z0-9_-]/g, '_');

                                    saveAs(blob, `Ficha_Tecnica_${nombreLimpio}.pdf`);
                                }}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Descargar Ficha Técnica PDF</span>
                            </button>

                            <button
                                onClick={closeViewModal}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
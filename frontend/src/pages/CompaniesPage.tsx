// src/pages/CompaniesPage.tsx
import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import { CompanyForm } from '../components/CompanyForm';
import { type CompanyFormData } from '../interfaces/company.interface';
import { CompaniesFilterDrawer } from '../components/CompaniesFilterDrawer';
import { Pagination } from '../components/Pagination';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import {
    Plus, Edit2, Trash2, Search, X, Table, LayoutGrid, MapPin, Globe, Eye, SlidersHorizontal, Download, FileText, BarChart3,
    Hash, Calendar, Layers, Truck, Flag, CheckSquare, Square, ListChecks, CheckCheck
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { exportCompaniesToExcel } from '../components/CompaniesSheetExcel';
import { CompaniesGraphics } from '../components/CompaniesGraphics';

// Importación de React PDF
import { CompaniesPDFDocument } from '../components/CompaniesPDFDocument';
import { CompanySheetPDFDocument } from '../components/CompanySheetPDFDocument';

const OPCIONES_TAMANO = ['Micro', 'Pequeña', 'Mediana', 'Grande'];

// Los "Productos o Servicios" no viven en un campo único: cada empresa los guarda
// dentro del sub-objeto del sector específico al que pertenece (ver SECTORES_CONFIG en CompanyForm.tsx)
const SECTOR_PRODUCT_KEYS = [
    'sectorPlasticos',
    'sectorMetalmecanico',
    'sectorElectricaElectronica',
    'sectorEmpaque',
    'sectorTiI40',
    'sectorTextil',
    'sectorServiciosEspecializados',
    'sectorMros',
    'sectorMinero',
] as const;

export const CompaniesPage = () => {
    const { user } = useContext(AuthContext);
    const canEdit = user?.rol === 'admin' || user?.rol === 'editor';
    const [companies, setCompanies] = useState<CompanyFormData[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [tipoVista, setTipoVista] = useState<'tabla' | 'cards'>('cards');

    // Estados para Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    // Estado del Drawer de Filtros Lateral
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Estados para Selección Múltiple de Empresas (persiste aunque cambien los filtros/búsqueda)
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Estado para el Modal de Gráficas Estadísticas
    const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);

    // Estados para Filtros Múltiples (DENTRO DEL DRAWER)
    const [selectedTamanos, setSelectedTamanos] = useState<string[]>([]);
    const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
    const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([]);
    const [selectedEstatus, setSelectedEstatus] = useState<string[]>([]);
    const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
    const [selectedExporta, setSelectedExporta] = useState<string>(''); // '' | 'si' | 'no'
    const [selectedPaisesDestino, setSelectedPaisesDestino] = useState<string[]>([]);
    const [selectedCertificaciones, setSelectedCertificaciones] = useState<string[]>([]);
    const [selectedApoyos, setSelectedApoyos] = useState<string[]>([]);
    const [selectedTipoOperaciones, setSelectedTipoOperaciones] = useState<string[]>([]);
    const [selectedTipoSuministro, setSelectedTipoSuministro] = useState<string[]>([]);
    const [selectedPaisOrigen, setSelectedPaisOrigen] = useState<string[]>([]);
    const [selectedSectores, setSelectedSectores] = useState<string[]>([]);
    const [selectedProductos, setSelectedProductos] = useState<string[]>([]);

    // Estados para Modal Crear/Editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyFormData | null>(null);

    // Estados para Modal de Detalles
    const [viewingCompany, setViewingCompany] = useState<CompanyFormData | null>(null);

    const handleOpenDetails = (company: CompanyFormData) => {
        setViewingCompany(company);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setViewingCompany(null);
        setIsDetailsOpen(false);
    };

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

    const opcionesEtiquetas = useMemo(() => {
        const etiquetasSet = new Set<string>();
        companies.forEach((c) => {
            if (c.etiquetas && Array.isArray(c.etiquetas)) {
                c.etiquetas.forEach((etiqueta: string) => etiquetasSet.add(etiqueta));
            }
        });
        return Array.from(etiquetasSet).sort();
    }, [companies]);

    const opcionesPaisesDestino = useMemo(() => {
        const paisesSet = new Set<string>();
        companies.forEach((c) => {
            if (c.informacionEmpresa?.destinoExportaciones && Array.isArray(c.informacionEmpresa.destinoExportaciones)) {
                c.informacionEmpresa.destinoExportaciones.forEach((p: string) => paisesSet.add(p));
            }
        });
        return Array.from(paisesSet).sort();
    }, [companies]);

    const opcionesCertificaciones = useMemo(() => {
        const certsSet = new Set<string>();
        companies.forEach((c) => {
            if (c.informacionEmpresa?.certificaciones?.lista && Array.isArray(c.informacionEmpresa.certificaciones.lista)) {
                c.informacionEmpresa.certificaciones.lista.forEach((cert: string) => certsSet.add(cert));
            }
        });
        return Array.from(certsSet).sort();
    }, [companies]);

    const opcionesApoyos = useMemo(() => {
        const apoyosSet = new Set<string>();
        companies.forEach((c) => {
            if (c.apoyosYNecesidades?.tipos && Array.isArray(c.apoyosYNecesidades.tipos)) {
                c.apoyosYNecesidades.tipos.forEach((a: string) => apoyosSet.add(a));
            }
        });
        return Array.from(apoyosSet).sort();
    }, [companies]);

    const opcionesTipoOperaciones = useMemo(() => {
        const set = new Set<string>();
        companies.forEach((c) => {
            if (c.tipoOperaciones && Array.isArray(c.tipoOperaciones)) {
                c.tipoOperaciones.forEach((op: string) => set.add(op));
            }
        });
        return Array.from(set).sort();
    }, [companies]);

    const opcionesTipoSuministro = useMemo(() => {
        const set = new Set<string>();
        companies.forEach((c) => {
            if (c.tipoSuministro && Array.isArray(c.tipoSuministro)) {
                c.tipoSuministro.forEach((sum: string) => set.add(sum));
            }
        });
        return Array.from(set).sort();
    }, [companies]);

    const opcionesPaisOrigen = useMemo(() => {
        const set = new Set<string>();
        companies.forEach((c) => {
            if (c.informacionEmpresa?.paisOrigen) {
                set.add(c.informacionEmpresa.paisOrigen);
            }
        });
        return Array.from(set).sort();
    }, [companies]);

    const opcionesSectores = useMemo(() => {
        const set = new Set<string>();
        companies.forEach((c) => {
            if (c.informacionEmpresa?.sectoresPertenece?.lista && Array.isArray(c.informacionEmpresa.sectoresPertenece.lista)) {
                c.informacionEmpresa.sectoresPertenece.lista.forEach((sec: string) => set.add(sec));
            }
        });
        return Array.from(set).sort();
    }, [companies]);

    // Opciones dinámicas de Productos / Servicios según el sector seleccionado
    const opcionesProductos = useMemo(() => {
        const set = new Set<string>();
        const empresasFiltradas = selectedSectores.length > 0
            ? companies.filter((c) =>
                c.informacionEmpresa?.sectoresPertenece?.lista &&
                selectedSectores.some((s) => c.informacionEmpresa.sectoresPertenece.lista.includes(s))
            )
            : companies;

        empresasFiltradas.forEach((c: any) => {
            SECTOR_PRODUCT_KEYS.forEach((key) => {
                const lista = c.informacionEmpresa?.[key]?.lista;
                if (Array.isArray(lista)) {
                    lista.forEach((prod: string) => set.add(prod));
                }
            });
        });

        return Array.from(set).sort();
    }, [companies, selectedSectores]);

    // Limpia productos no válidos cuando cambian las opciones disponibles
    useEffect(() => {
        setSelectedProductos((prev) => prev.filter((p) => opcionesProductos.includes(p)));
    }, [opcionesProductos]);

    const toggleFilter = (item: string, currentList: string[], setList: (vals: string[]) => void) => {
        setCurrentPage(1);
        if (currentList.includes(item)) {
            setList(currentList.filter((i) => i !== item));
        } else {
            setList([...currentList, item]);
        }
    };

    // --- Selección de Empresas ---
    const toggleCompanySelection = (id?: string) => {
        if (!id) return;
        setSelectedCompanyIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const clearSelection = () => {
        setSelectedCompanyIds(new Set());
        setShowOnlySelected(false);
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
        setSelectedEtiquetas([]);
        setSelectedExporta('');
        setSelectedPaisesDestino([]);
        setSelectedCertificaciones([]);
        setSelectedApoyos([]);
        setSelectedTipoOperaciones([]);
        setSelectedTipoSuministro([]);
        setSelectedPaisOrigen([]);
        setSelectedSectores([]);
        setSelectedProductos([]);
        setCurrentPage(1);
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter((comp: any) => {
            const matchTamano = selectedTamanos.length === 0 || selectedTamanos.includes(comp.tamanoEmpresa);
            const matchEstado = selectedEstados.length === 0 || selectedEstados.includes(comp.ubicacion?.estado);
            const matchMunicipio = selectedMunicipios.length === 0 || selectedMunicipios.includes(comp.ubicacion?.municipio);

            const matchEstatus = selectedEstatus.length === 0 || (
                (selectedEstatus.includes('Activo') && comp.activa) ||
                (selectedEstatus.includes('Inactivo') && !comp.activa)
            );

            const matchEtiquetas = selectedEtiquetas.length === 0 || (
                comp.etiquetas && selectedEtiquetas.some((etq) => comp.etiquetas.includes(etq))
            );

            // Exportación
            const pctExp = Number(comp.informacionEmpresa?.porcentajeExportaciones) || 0;
            const matchExporta =
                selectedExporta === '' ||
                (selectedExporta === 'si' && pctExp > 0) ||
                (selectedExporta === 'no' && pctExp === 0);

            // Países Destino
            const matchPaises = selectedPaisesDestino.length === 0 || selectedExporta === 'no' || (
                comp.informacionEmpresa?.destinoExportaciones &&
                selectedPaisesDestino.some((p) => comp.informacionEmpresa.destinoExportaciones.includes(p))
            );

            // Certificaciones
            const matchCert = selectedCertificaciones.length === 0 || (
                comp.informacionEmpresa?.certificaciones?.lista &&
                selectedCertificaciones.some((c) => comp.informacionEmpresa.certificaciones.lista.includes(c))
            );

            // Apoyos Requeridos
            const matchApoyos = selectedApoyos.length === 0 || (
                comp.apoyosYNecesidades?.tipos &&
                selectedApoyos.some((a) => comp.apoyosYNecesidades.tipos.includes(a))
            );

            // Tipo Operaciones
            const matchTipoOp = selectedTipoOperaciones.length === 0 || (
                comp.tipoOperaciones &&
                selectedTipoOperaciones.some((op) => comp.tipoOperaciones.includes(op))
            );

            // Tipo Suministro
            const matchTipoSum = selectedTipoSuministro.length === 0 || (
                comp.tipoSuministro &&
                selectedTipoSuministro.some((sum) => comp.tipoSuministro.includes(sum))
            );

            // País de Origen
            const matchPaisOrigen = selectedPaisOrigen.length === 0 || (
                comp.informacionEmpresa?.paisOrigen &&
                selectedPaisOrigen.includes(comp.informacionEmpresa.paisOrigen)
            );

            // Sectores
            const matchSectores = selectedSectores.length === 0 || (
                comp.informacionEmpresa?.sectoresPertenece?.lista &&
                selectedSectores.some((s) => comp.informacionEmpresa.sectoresPertenece.lista.includes(s))
            );

            // Productos y Servicios
            const productosEmpresa = SECTOR_PRODUCT_KEYS.flatMap(
                (key) => comp.informacionEmpresa?.[key]?.lista || []
            );
            const matchProductos = selectedProductos.length === 0 ||
                selectedProductos.some((p) => productosEmpresa.includes(p));

            return matchTamano && matchEstado && matchMunicipio && matchEstatus &&
                matchEtiquetas && matchExporta && matchPaises && matchCert &&
                matchApoyos && matchTipoOp && matchTipoSum && matchPaisOrigen &&
                matchSectores && matchProductos;
        });
    }, [
        companies, selectedTamanos, selectedEstados, selectedMunicipios,
        selectedEstatus, selectedEtiquetas, selectedExporta,
        selectedPaisesDestino, selectedCertificaciones, selectedApoyos,
        selectedTipoOperaciones, selectedTipoSuministro, selectedPaisOrigen,
        selectedSectores, selectedProductos
    ]);

    // Si está activo "mostrar solo seleccionadas", se ignoran los filtros y se muestran
    // únicamente las empresas marcadas (sin importar en qué página/búsqueda fueron seleccionadas)
    const displayedCompanies = useMemo(() => {
        if (showOnlySelected) {
            return companies.filter((c) => c._id && selectedCompanyIds.has(c._id));
        }
        return filteredCompanies;
    }, [showOnlySelected, companies, selectedCompanyIds, filteredCompanies]);

    // Reinicia la vista de "solo seleccionadas" si quedan 1 o 0 empresas seleccionadas
    useEffect(() => {
        if (showOnlySelected && selectedCompanyIds.size <= 1) {
            setShowOnlySelected(false);
        }
    }, [selectedCompanyIds, showOnlySelected]);

    const paginatedCompanies = useMemo(() => {
        if (pageSize === 'all') return displayedCompanies;

        const startIndex = (currentPage - 1) * pageSize;
        return displayedCompanies.slice(startIndex, startIndex + pageSize);
    }, [displayedCompanies, currentPage, pageSize]);

    // ¿Están seleccionadas todas las empresas actualmente visibles (la página actual)?
    const allVisibleSelected = paginatedCompanies.length > 0 &&
        paginatedCompanies.every((c) => c._id && selectedCompanyIds.has(c._id));

    const toggleSelectAllVisible = () => {
        setSelectedCompanyIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                paginatedCompanies.forEach((c) => { if (c._id) next.delete(c._id); });
            } else {
                paginatedCompanies.forEach((c) => { if (c._id) next.add(c._id); });
            }
            return next;
        });
    };

    const openModal = (company?: CompanyFormData) => {
        setEditingCompany(company || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCompany(null);
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
        selectedEstatus.length +
        selectedEtiquetas.length +
        (selectedExporta !== '' ? 1 : 0) +
        selectedPaisesDestino.length +
        selectedCertificaciones.length +
        selectedApoyos.length +
        selectedTipoOperaciones.length +
        selectedTipoSuministro.length +
        selectedPaisOrigen.length +
        selectedSectores.length +
        selectedProductos.length;

    const handleExportExcel = async () => {
        await exportCompaniesToExcel(displayedCompanies, user);
    };

    return (
        <>
            {/* BARRA SUPERIOR DE ACCIONES */}
            <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 w-full 2xl:w-auto flex-wrap">
                    <div className="relative flex-1 sm:w-72 min-w-50">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RFC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

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

                    {filteredCompanies.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={toggleSelectAllVisible}
                                title={allVisibleSelected ? 'Deseleccionar las visibles' : 'Seleccionar todas las visibles'}
                                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0 border ${allVisibleSelected
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                                    }`}
                            >
                                <ListChecks className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar todas las visibles'}
                                </span>
                            </button>

                            {selectedCompanyIds.size > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentPage(1);
                                        setShowOnlySelected((prev) => !prev);
                                    }}
                                    title={showOnlySelected ? 'Mostrar todos los resultados' : 'Mostrar solo las empresas seleccionadas'}
                                    className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0 ${showOnlySelected
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                                        }`}
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        {showOnlySelected ? 'Mostrar todos los resultados' : `Mostrar seleccionadas (${selectedCompanyIds.size})`}
                                    </span>
                                </button>
                            )}

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
                                        ? <CompanySheetPDFDocument companies={displayedCompanies} />
                                        : <CompaniesPDFDocument companies={displayedCompanies} />;

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
                                <span>PDF</span>
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
            {(totalFiltrosActivos > 0 || selectedCompanyIds.size > 0) && (
                <div className="flex items-center gap-2 mb-6 flex-wrap bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-xs text-slate-400 font-medium">Filtros aplicados:</span>

                    {/* Empresas seleccionadas */}
                    {selectedCompanyIds.size > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 text-blue-400 text-xs rounded-lg border border-blue-500/30 font-medium">
                            <CheckSquare className="w-3.5 h-3.5" />
                            Empresas seleccionadas: {selectedCompanyIds.size}
                            <button onClick={clearSelection} className="hover:text-white" title="Quitar selección">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {/* Búsqueda */}
                    {search.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                            Búsqueda: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {/* Estatus */}
                    {canEdit && selectedEstatus.map((est) => (
                        <span key={est} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Estatus: {est}
                            <button onClick={() => toggleFilter(est, selectedEstatus, setSelectedEstatus)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Tamaños */}
                    {selectedTamanos.map((tamano) => (
                        <span key={tamano} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Tamaño: {tamano}
                            <button onClick={() => toggleFilter(tamano, selectedTamanos, setSelectedTamanos)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Sectores */}
                    {selectedSectores.map((sec) => (
                        <span key={sec} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                            Sector: {sec.toLowerCase().includes('otro especif') ? 'Otro' : sec}
                            <button onClick={() => toggleFilter(sec, selectedSectores, setSelectedSectores)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Productos / Servicios */}
                    {selectedProductos.map((prod) => (
                        <span key={prod} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Producto/Servicio: {prod.toLowerCase().includes('otro especif') ? 'Otro' : prod}
                            <button onClick={() => toggleFilter(prod, selectedProductos, setSelectedProductos)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Tipo Operaciones */}
                    {selectedTipoOperaciones.map((op) => (
                        <span key={op} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg border border-cyan-500/20">
                            Operación: {op.toLowerCase().includes('otro especifique') ? 'Otro' : op}
                            <button onClick={() => toggleFilter(op, selectedTipoOperaciones, setSelectedTipoOperaciones)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Tipo Suministro */}
                    {selectedTipoSuministro.map((sum) => (
                        <span key={sum} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-lg border border-teal-500/20">
                            Suministro: {sum.toLowerCase().includes('otro especifique') ? 'Otro' : sum}
                            <button onClick={() => toggleFilter(sum, selectedTipoSuministro, setSelectedTipoSuministro)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* País de Origen */}
                    {selectedPaisOrigen.map((pais) => (
                        <span key={pais} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg border border-violet-500/20">
                            Origen: {pais.toLowerCase().includes('otro especifique') ? 'Otro' : pais}
                            <button onClick={() => toggleFilter(pais, selectedPaisOrigen, setSelectedPaisOrigen)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Estados */}
                    {selectedEstados.map((estado) => (
                        <span key={estado} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                            Estado: {estado}
                            <button onClick={() => toggleFilter(estado, selectedEstados, setSelectedEstados)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Municipios */}
                    {selectedMunicipios.map((muni) => (
                        <span key={muni} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Municipio: {muni}
                            <button onClick={() => toggleFilter(muni, selectedMunicipios, setSelectedMunicipios)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Exporta */}
                    {selectedExporta !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-lg border border-sky-500/20">
                            Exporta: {selectedExporta === 'si' ? 'Sí' : 'No'}
                            <button onClick={() => { setCurrentPage(1); setSelectedExporta(''); }} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {/* Países Destino */}
                    {selectedPaisesDestino.map((pais) => (
                        <span key={pais} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs rounded-lg border border-fuchsia-500/20">
                            Destino: {pais.toLowerCase().includes('otro especifique') ? 'Otro' : pais}
                            <button onClick={() => toggleFilter(pais, selectedPaisesDestino, setSelectedPaisesDestino)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Certificaciones */}
                    {selectedCertificaciones.map((cert) => (
                        <span key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-lg border border-rose-500/20">
                            Certificación: {cert.toLowerCase().includes('otro especifique') ? 'Otro' : cert}
                            <button onClick={() => toggleFilter(cert, selectedCertificaciones, setSelectedCertificaciones)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Apoyos */}
                    {selectedApoyos.map((apoyo) => (
                        <span key={apoyo} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20">
                            Apoyo: {apoyo.toLowerCase().includes('otro especifique') ? 'Otro' : apoyo}
                            <button onClick={() => toggleFilter(apoyo, selectedApoyos, setSelectedApoyos)} className="hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {/* Etiquetas */}
                    {selectedEtiquetas.map((etq) => (
                        <span key={etq} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                            Etiqueta: {etq.toLowerCase().includes('otro especifique') ? 'Otro' : etq}
                            <button onClick={() => toggleFilter(etq, selectedEtiquetas, setSelectedEtiquetas)} className="hover:text-white">
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

            {/* CONTADOR DE RESULTADOS ENCONTRADOS */}
            {!loading && displayedCompanies.length > 0 && (
                <div className="mb-4 flex items-center justify-between bg-slate-800/60 border border-slate-700/60 px-4 py-2.5 rounded-lg text-sm text-slate-300 shadow-sm">
                    <span className="font-medium">
                        {showOnlySelected ? (
                            <>
                                Mostrando <strong className="text-blue-400 font-semibold">{displayedCompanies.length}</strong>{' '}
                                {displayedCompanies.length === 1 ? 'empresa seleccionada' : 'empresas seleccionadas'}
                            </>
                        ) : (
                            <>
                                Se {displayedCompanies.length === 1 ? 'encontró' : 'encontraron'}{' '}
                                <strong className="text-blue-400 font-semibold">{displayedCompanies.length}</strong>{' '}
                                {displayedCompanies.length === 1 ? 'resultado' : 'resultados'}
                            </>
                        )}
                    </span>
                    {!showOnlySelected && displayedCompanies.length !== companies.length && (
                        <span className="text-xs text-slate-400">
                            (filtrados de un total de {companies.length})
                        </span>
                    )}
                </div>
            )}

            {/* TABLA O TARJETAS */}
            {loading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    Cargando datos...
                </div>
            ) : displayedCompanies.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    {showOnlySelected
                        ? 'No hay empresas seleccionadas.'
                        : 'No se encontraron empresas con los criterios seleccionados.'}
                </div>
            ) : (
                <>
                    {tipoVista === 'tabla' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                        <tr>
                                            <th className="px-4 py-4 w-10"></th>
                                            <th className="px-6 py-4">Empresa</th>
                                            <th className="px-6 py-4">RFC</th>
                                            <th className="px-6 py-4">Ubicación</th>
                                            <th className="px-6 py-4">Tamaño</th>
                                            {canEdit && <th className="px-6 py-4">Estatus</th>}
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/60">
                                        {paginatedCompanies.map((comp) => {
                                            const isSelected = Boolean(comp._id && selectedCompanyIds.has(comp._id));
                                            return (
                                            <tr key={comp._id} className={`transition-colors ${isSelected ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-slate-700/30'}`}>
                                                <td className="px-4 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCompanySelection(comp._id)}
                                                        title={isSelected ? 'Quitar selección' : 'Seleccionar empresa'}
                                                        className={`p-1 rounded-md transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                    </button>
                                                </td>
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
                                                        onClick={() => handleOpenDetails(comp)}
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
                                                                onClick={() => comp._id && handleDelete(comp._id, comp.nombreComercial)}
                                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tipoVista === 'cards' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedCompanies.map((comp) => {
                                const isSelected = Boolean(comp._id && selectedCompanyIds.has(comp._id));
                                return (
                                <div
                                    key={comp._id}
                                    className={`bg-slate-800 border rounded-xl p-5 shadow-xl flex flex-col justify-between transition-colors ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-slate-700 hover:border-slate-600'}`}
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
                                                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>RFC: {comp.rfc || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>Inicio de operaciones: {comp.anioInicio || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{comp.ubicacion?.municipio}, {comp.ubicacion?.estado}</span>
                                            </div>
                                            {comp.informacionEmpresa?.paisOrigen && (
                                                <div className="flex items-center gap-2">
                                                    <Flag className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span>
                                                        País de Origen:{' '}
                                                        {comp.informacionEmpresa.paisOrigen === 'Otro' && comp.informacionEmpresa.paisOrigenOtro
                                                            ? comp.informacionEmpresa.paisOrigenOtro
                                                            : comp.informacionEmpresa.paisOrigen}
                                                    </span>
                                                </div>
                                            )}
                                            {comp.sitioWeb && (
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <a href={comp.sitioWeb} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">
                                                        {comp.sitioWeb}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {(comp.tipoOperaciones?.length > 0 || comp.tipoSuministro?.length > 0) && (
                                            <div className="flex flex-wrap gap-1.5 mb-1">
                                                {comp.tipoOperaciones?.map((op, idx) => (
                                                    <span
                                                        key={`op-${idx}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[11px] rounded border border-purple-500/20"
                                                    >
                                                        <Layers className="w-3 h-3" />
                                                        {op}
                                                    </span>
                                                ))}
                                                {comp.tipoSuministro?.map((sum, idx) => (
                                                    <span
                                                        key={`sum-${idx}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[11px] rounded border border-orange-500/20"
                                                    >
                                                        <Truck className="w-3 h-3" />
                                                        {sum}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/60 mt-2">
                                        <button
                                            onClick={() => toggleCompanySelection(comp._id)}
                                            title={isSelected ? 'Quitar selección' : 'Seleccionar empresa'}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-xs font-medium mr-auto ${isSelected
                                                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                                }`}
                                        >
                                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isSelected ? 'Seleccionada' : 'Seleccionar'}</span>
                                        </button>

                                        <button
                                            onClick={() => handleOpenDetails(comp)}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                                        >
                                            <Eye className="w-4 h-4" />
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
                                                    onClick={() => comp._id && handleDelete(comp._id, comp.nombreComercial)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}

                    {/* COMPONENTE DE PAGINACIÓN */}
                    <Pagination
                        currentPage={currentPage}
                        totalItems={displayedCompanies.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </>
            )}

            {/* 📊 MODAL DE GRÁFICAS ESTADÍSTICAS */}
            <CompaniesGraphics
                isOpen={isChartsModalOpen}
                onClose={() => setIsChartsModalOpen(false)}
                companies={filteredCompanies}
                selectedEstados={selectedEstados}
            />

            {/* DRAWER DE FILTROS */}
            <CompaniesFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                canEdit={canEdit}
                opcionesTamano={OPCIONES_TAMANO}
                opcionesEstados={opcionesEstados}
                opcionesMunicipios={opcionesMunicipios}
                opcionesEtiquetas={opcionesEtiquetas}
                opcionesPaisesDestino={opcionesPaisesDestino}
                opcionesCertificaciones={opcionesCertificaciones}
                opcionesApoyos={opcionesApoyos}
                opcionesTipoOperaciones={opcionesTipoOperaciones}
                opcionesTipoSuministro={opcionesTipoSuministro}
                opcionesPaisOrigen={opcionesPaisOrigen}
                opcionesSectores={opcionesSectores}
                opcionesProductos={opcionesProductos}
                selectedTamanos={selectedTamanos}
                selectedEstados={selectedEstados}
                selectedMunicipios={selectedMunicipios}
                selectedEstatus={selectedEstatus}
                selectedEtiquetas={selectedEtiquetas}
                selectedExporta={selectedExporta}
                selectedPaisesDestino={selectedPaisesDestino}
                selectedCertificaciones={selectedCertificaciones}
                selectedApoyos={selectedApoyos}
                selectedTipoOperaciones={selectedTipoOperaciones}
                selectedTipoSuministro={selectedTipoSuministro}
                selectedPaisOrigen={selectedPaisOrigen}
                selectedSectores={selectedSectores}
                selectedProductos={selectedProductos}
                onToggleTamano={(val) => toggleFilter(val, selectedTamanos, setSelectedTamanos)}
                onToggleEstado={(val) => toggleFilter(val, selectedEstados, setSelectedEstados)}
                onToggleMunicipio={(val) => toggleFilter(val, selectedMunicipios, setSelectedMunicipios)}
                onToggleEstatus={handleToggleEstatus}
                onToggleEtiqueta={(val) => toggleFilter(val, selectedEtiquetas, setSelectedEtiquetas)}
                onChangeExporta={(val) => {
                    setCurrentPage(1);
                    setSelectedExporta(val);
                    if (val !== 'si') {
                        setSelectedPaisesDestino([]);
                    }
                }}
                onTogglePaisDestino={(val) => toggleFilter(val, selectedPaisesDestino, setSelectedPaisesDestino)}
                onToggleCertificacion={(val) => toggleFilter(val, selectedCertificaciones, setSelectedCertificaciones)}
                onToggleApoyo={(val) => toggleFilter(val, selectedApoyos, setSelectedApoyos)}
                onToggleTipoOperacion={(val) => toggleFilter(val, selectedTipoOperaciones, setSelectedTipoOperaciones)}
                onToggleTipoSuministro={(val) => toggleFilter(val, selectedTipoSuministro, setSelectedTipoSuministro)}
                onTogglePaisOrigen={(val) => toggleFilter(val, selectedPaisOrigen, setSelectedPaisOrigen)}
                onToggleSector={(val) => toggleFilter(val, selectedSectores, setSelectedSectores)}
                onToggleProducto={(val) => toggleFilter(val, selectedProductos, setSelectedProductos)}
                onClearAll={clearAllFilters}
                totalResultados={filteredCompanies.length}
            />

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
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
                                initialValues={editingCompany || undefined}
                                isPublicRegistration={false}
                                isEditing={Boolean(editingCompany)}
                                onSubmit={async (data) => {
                                    try {
                                        if (editingCompany) {
                                            await api.put(`/companies/${editingCompany._id}`, data);
                                            toast.success('Empresa actualizada correctamente');
                                        } else {
                                            await api.post('/companies', data);
                                            toast.success('Empresa registrada correctamente');
                                        }
                                        closeModal();
                                        fetchCompanies();
                                    } catch (error: any) {
                                        toast.error(error.response?.data?.message || 'Error al guardar');
                                    }
                                }}
                                onCancel={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VER DETALLES */}
            <CompanyDetailsModal
                isOpen={isDetailsOpen}
                company={viewingCompany}
                onClose={handleCloseDetails}
                onEdit={openModal}
                onDelete={handleDelete}
            />
        </>
    );
};
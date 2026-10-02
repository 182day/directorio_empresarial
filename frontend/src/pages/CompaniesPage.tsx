// src/pages/CompaniesPage.tsx
import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import { CompanyForm } from '../components/CompanyForm';
import { type CompanyFormData, type CompanySortField, type SortOrder } from '../interfaces/company.interface';
import { CompaniesFilterDrawer } from '../components/CompaniesFilterDrawer';
import { Pagination } from '../components/Pagination';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import { CompaniesFollowPage } from './CompaniesFollowPage';
import { CompanyImportModal } from '../components/CompanyImportModal';
import {
    Plus, Pencil, Trash2, Search, X, Table, LayoutGrid, MapPin, Globe, Eye, SlidersHorizontal, FileText, BarChart3, RefreshCw, Upload,
    Hash, Calendar, Layers, Truck, Flag, CheckSquare, Square, ListChecks, CheckCheck, ChartGantt, ArrowUp, ArrowDown, Map, ChevronDown, FileSpreadsheet
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { exportCompaniesToExcel } from '../components/CompaniesSheetExcel';
import { CompaniesGraphics } from '../components/CompaniesGraphics';
import { formatUrl } from '../utils/formUtils';

// Importación de React PDF
import { CompaniesPDFDocument } from '../components/CompaniesPDFDocument';
import { CompanySheetPDFDocument } from '../components/CompanySheetPDFDocument';
import { useCompanyStore } from '../stores/useCompanyStore';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';
import {
    SORT_OPTIONS,
    OPCIONES_TAMANO,
    OPCIONES_TIPO_EMPRESA
} from '../data/companyCatalog';

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
    const isAdmin = user?.rol === 'admin';
    const canEdit = user?.rol === 'admin' || user?.rol === 'editor';

    // Consumir el estado y las acciones globales de Zustand
    const {
        companies,
        loading,
        fetchCompanies,
        addCompanyToStore,
        updateCompanyInStore,
        removeCompanyFromStore
    } = useCompanyStore();
    const { setMapCompanies } = useMapCompaniesStore();

    // Estado para controlar el modal de importación Excel
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [search, setSearch] = useState('');
    const [tipoVista, setTipoVista] = useState<'tabla' | 'cards'>('tabla');

    // Estados para Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    // Estado del Drawer de Filtros Lateral
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Estados para Selección Múltiple de Empresas
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Estado para el Modal de Gráficas Estadísticas
    const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);

    // Estados para Filtros Múltiples
    const [selectedTamanos, setSelectedTamanos] = useState<string[]>([]);
    const [selectedTiposEmpresa, setSelectedTiposEmpresa] = useState<string[]>(['Empresa directorio']);
    const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
    const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([]);
    const [selectedEstatus, setSelectedEstatus] = useState<string[]>([]);
    const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
    const [selectedExporta, setSelectedExporta] = useState<string>('');
    const [selectedPaisesDestino, setSelectedPaisesDestino] = useState<string[]>([]);
    const [selectedCertificaciones, setSelectedCertificaciones] = useState<string[]>([]);
    const [selectedApoyos, setSelectedApoyos] = useState<string[]>([]);
    const [selectedTipoOperaciones, setSelectedTipoOperaciones] = useState<string[]>([]);
    const [selectedTipoSuministro, setSelectedTipoSuministro] = useState<string[]>([]);
    const [selectedPaisOrigen, setSelectedPaisOrigen] = useState<string[]>([]);
    const [selectedSectores, setSelectedSectores] = useState<string[]>([]);
    const [selectedProductos, setSelectedProductos] = useState<string[]>([]);
    const [selectedFechaDesde, setSelectedFechaDesde] = useState<string>('');
    const [selectedFechaHasta, setSelectedFechaHasta] = useState<string>('');

    // Estados para Modal Crear/Editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyFormData | null>(null);

    // Estados para Modal de Detalles
    const [viewingCompany, setViewingCompany] = useState<CompanyFormData | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Estados para Modal de Seguimiento (CompaniesFollowPage)
    const [followCompany, setFollowCompany] = useState<CompanyFormData | null>(null);
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

    // Dentro del componente CompaniesPage:
    const [sortField, setSortField] = useState<CompanySortField>('nombreComercial');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // ORDENAMIENTO DE EMPRESAS
    // 1. PRIMERO: FILTRADO DE EMPRESAS EN EL CLIENTE
    const filteredCompanies = useMemo(() => {
        return companies.filter((comp: any) => {
            const query = search.toLowerCase().trim();
            const matchSearch = !query ||
                comp.nombreComercial?.toLowerCase().includes(query) ||
                comp.razonSocial?.toLowerCase().includes(query) ||
                comp.rfc?.toLowerCase().includes(query);

            const matchTamano = selectedTamanos.length === 0 || selectedTamanos.includes(comp.tamanoEmpresa);
            const matchTipoEmpresa = selectedTiposEmpresa.length === 0 || selectedTiposEmpresa.includes(comp.tipoEmpresa);
            const matchEstado = selectedEstados.length === 0 || selectedEstados.includes(comp.ubicacion?.estado);
            const matchMunicipio = selectedMunicipios.length === 0 || selectedMunicipios.includes(comp.ubicacion?.municipio);

            const matchEstatus = selectedEstatus.length === 0 || (
                (selectedEstatus.includes('Activo') && comp.activa) ||
                (selectedEstatus.includes('Inactivo') && !comp.activa)
            );

            const matchEtiquetas = selectedEtiquetas.length === 0 || (
                comp.etiquetas && selectedEtiquetas.some((etq) => comp.etiquetas.includes(etq))
            );

            const pctExp = Number(comp.informacionEmpresa?.porcentajeExportaciones) || 0;
            const matchExporta =
                selectedExporta === '' ||
                (selectedExporta === 'si' && pctExp > 0) ||
                (selectedExporta === 'no' && pctExp === 0);

            const matchPaises = selectedPaisesDestino.length === 0 || selectedExporta === 'no' || (
                comp.informacionEmpresa?.destinoExportaciones &&
                selectedPaisesDestino.some((p) => comp.informacionEmpresa.destinoExportaciones.includes(p))
            );

            const matchCert = selectedCertificaciones.length === 0 || (
                comp.informacionEmpresa?.certificaciones?.lista &&
                selectedCertificaciones.some((c) => comp.informacionEmpresa.certificaciones.lista.includes(c))
            );

            const matchApoyos = selectedApoyos.length === 0 || (
                comp.apoyosYNecesidades?.tipos &&
                selectedApoyos.some((a) => comp.apoyosYNecesidades.tipos.includes(a))
            );

            const matchTipoOp = selectedTipoOperaciones.length === 0 || (
                comp.tipoOperaciones &&
                selectedTipoOperaciones.some((op) => comp.tipoOperaciones.includes(op))
            );

            const matchTipoSum = selectedTipoSuministro.length === 0 || (
                comp.tipoSuministro &&
                selectedTipoSuministro.some((sum) => comp.tipoSuministro.includes(sum))
            );

            const matchPaisOrigen = selectedPaisOrigen.length === 0 || (
                comp.informacionEmpresa?.paisOrigen &&
                selectedPaisOrigen.includes(comp.informacionEmpresa.paisOrigen)
            );

            const matchSectores = selectedSectores.length === 0 || (
                comp.informacionEmpresa?.sectoresPertenece?.lista &&
                selectedSectores.some((s) => comp.informacionEmpresa.sectoresPertenece.lista.includes(s))
            );

            const productosEmpresa = SECTOR_PRODUCT_KEYS.flatMap(
                (key) => comp.informacionEmpresa?.[key]?.lista || []
            );
            const matchProductos = selectedProductos.length === 0 ||
                selectedProductos.some((p) => productosEmpresa.includes(p));

            // Lógica para rango de fechas
            const compFecha = comp.createdAt ? new Date(comp.createdAt).getTime() : null;
            let matchFecha = true;

            if (compFecha) {
                if (selectedFechaDesde) {
                    const desdeTime = new Date(`${selectedFechaDesde}T00:00:00`).getTime();
                    if (compFecha < desdeTime) matchFecha = false;
                }
                if (selectedFechaHasta) {
                    const hastaTime = new Date(`${selectedFechaHasta}T23:59:59.999`).getTime();
                    if (compFecha > hastaTime) matchFecha = false;
                }
            } else if (selectedFechaDesde || selectedFechaHasta) {
                matchFecha = false;
            }

            return matchSearch && matchTamano && matchTipoEmpresa && matchEstado && matchMunicipio && matchEstatus &&
                matchEtiquetas && matchExporta && matchPaises && matchCert &&
                matchApoyos && matchTipoOp && matchTipoSum && matchPaisOrigen &&
                matchSectores && matchProductos && matchFecha;
        });
    }, [
        companies, search, selectedTamanos, selectedTiposEmpresa, selectedEstados, selectedMunicipios, // 👈 Agregar selectedTiposEmpresa en dependencias
        selectedEstatus, selectedEtiquetas, selectedExporta,
        selectedPaisesDestino, selectedCertificaciones, selectedApoyos,
        selectedTipoOperaciones, selectedTipoSuministro, selectedPaisOrigen,
        selectedSectores, selectedProductos, selectedFechaDesde, selectedFechaHasta
    ]);

    // 2. DESPUÉS: ORDENAMIENTO DE EMPRESAS
    const sortedCompanies = useMemo(() => {
        return [...filteredCompanies].sort((a: any, b: any) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'createdAt':
                    aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    break;
                case 'estado':
                    aValue = a.ubicacion?.estado || '';
                    bValue = b.ubicacion?.estado || '';
                    break;
                case 'municipio':
                    aValue = a.ubicacion?.municipio || '';
                    bValue = b.ubicacion?.municipio || '';
                    break;
                case 'paisOrigen':
                    aValue = a.informacionEmpresa?.paisOrigen || '';
                    bValue = b.informacionEmpresa?.paisOrigen || '';
                    break;
                case 'tamanoEmpresa':
                    const pesoTamano: Record<string, number> = { 'Micro': 1, 'Pequeña': 2, 'Mediana': 3, 'Grande': 4 };
                    aValue = pesoTamano[a.tamanoEmpresa] || 0;
                    bValue = pesoTamano[b.tamanoEmpresa] || 0;
                    break;
                case 'activa':
                    aValue = a.activa ? 1 : 0;
                    bValue = b.activa ? 1 : 0;
                    break;
                default:
                    aValue = a[sortField] || '';
                    bValue = b[sortField] || '';
                    break;
            }

            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue), 'es', { sensitivity: 'base' });
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [filteredCompanies, sortField, sortOrder]);

    const handleOpenDetails = (company: CompanyFormData) => {
        setViewingCompany(company);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setViewingCompany(null);
        setIsDetailsOpen(false);
    };

    const handleOpenFollow = (company: CompanyFormData) => {
        setFollowCompany(company);
        setIsFollowModalOpen(true);
    };

    const handleCloseFollow = () => {
        setFollowCompany(null);
        setIsFollowModalOpen(false);
    };

    // Al montar la vista, se llama a fetchCompanies() sin parámetros.
    // Zustand sabrá si ya las tiene cargadas o si necesita traerlas.
    // useEffect(() => {
    //     fetchCompanies();
    // }, [fetchCompanies]);

    // Reseteamos a la primera página cuando cambie la búsqueda en el input
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

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
        setSelectedTiposEmpresa(['Empresa directorio']);
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
        setSelectedFechaDesde('');
        setSelectedFechaHasta('');
        setCurrentPage(1);
    };

    // const displayedCompanies = useMemo(() => {
    //     if (showOnlySelected) {
    //         return companies.filter((c) => c._id && selectedCompanyIds.has(c._id));
    //     }
    //     return filteredCompanies;
    // }, [showOnlySelected, companies, selectedCompanyIds, filteredCompanies]);

    const displayedCompanies = useMemo(() => {
        if (showOnlySelected) {
            return sortedCompanies.filter((c) => c._id && selectedCompanyIds.has(c._id));
        }
        return sortedCompanies;
    }, [showOnlySelected, sortedCompanies, selectedCompanyIds]);

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
            html: `Está a punto de eliminar a <strong>${nombre}</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: '!bg-app-card !text-app-text !border !border-app-border'
            },
            allowOutsideClick: true,
            allowEscapeKey: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/companies/${id}`);
                    toast.success(`La empresa ${nombre} ha sido eliminada correctamente.`);

                    // Actualización local en el store sin hacer petición HTTP adicional
                    removeCompanyFromStore(id); // O la función que definiste en tu Zustand
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
        selectedTiposEmpresa.length +
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
        selectedProductos.length +
        (selectedFechaDesde ? 1 : 0) +
        (selectedFechaHasta ? 1 : 0);

    const handleExportExcel = async () => {
        await exportCompaniesToExcel(displayedCompanies, user);
    };

    /* MOSTRAR REPORTES */
    const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);
    const reportsMenuRef = useRef<HTMLDivElement>(null);

    // Cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reportsMenuRef.current && !reportsMenuRef.current.contains(event.target as Node)) {
                setIsReportsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extrae las empresas que tienen coordenadas válidas
    const mapableCompanies = useMemo(() => {
        return displayedCompanies.filter(
            emp =>
                typeof emp.ubicacion?.latitud === 'number' &&
                typeof emp.ubicacion?.longitud === 'number' &&
                !isNaN(emp.ubicacion?.latitud) &&
                !isNaN(emp.ubicacion?.longitud)
        );
    }, [displayedCompanies]);

    return (
        <>
            {/* BARRA SUPERIOR DE ACCIONES */}
            <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 w-full 2xl:w-auto flex-wrap">
                    {/* Botón de Recargar */}
                    <button
                        onClick={async () => {
                            const previousCount = companies.length;
                            await fetchCompanies(true);
                            const currentCount = useCompanyStore.getState().companies.length;
                            const diff = currentCount - previousCount;

                            if (diff > 0) {
                                toast.success(`Consulta actualizada. Se encontraron ${diff} empresa(s) nueva(s).`);
                            } else {
                                toast.success('Consulta actualizada. No se encontraron registros nuevos.');
                            }
                        }}
                        className="p-2 bg-app-card border border-app-border hover:bg-app-button-hover text-app-muted hover:text-app-text rounded-lg transition-colors"
                        title="Recargar consulta actual"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Botón de Importar Excel */}
                    {isAdmin && (
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="p-2 bg-app-card border border-app-border hover:bg-app-button-hover text-app-muted hover:text-app-text rounded-lg transition-colors"
                            title="Importar catálogo desde Excel (.xlsx)"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                    )}
                    {/* Input de Búsqueda */}
                    <div className="relative flex-1 sm:w-72 min-w-50">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RFC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-app-card border border-app-border rounded-lg py-2 pl-10 pr-4 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Botón Filtros */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={`sm:col-span-3 md:col-span-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${totalFiltrosActivos > 0
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                            : 'bg-app-card border-app-border text-app-text hover:border-blue-500/50'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Filtros</span>
                        {totalFiltrosActivos > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                {totalFiltrosActivos}
                            </span>
                        )}
                    </button>

                    {filteredCompanies.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Botón Seleccionar Visibles */}
                            <button
                                type="button"
                                onClick={toggleSelectAllVisible}
                                title={allVisibleSelected ? 'Deseleccionar las visibles' : 'Seleccionar las visibles'}
                                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shrink-0 border ${allVisibleSelected
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-app-card border-app-border text-app-text hover:border-blue-500/50'
                                    }`}
                            >
                                <ListChecks className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
                                </span>
                            </button>

                            {/* Botón Mostrar Seleccionadas */}
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
                                        : 'bg-app-card border border-app-border text-app-text hover:border-blue-500/50'
                                        }`}
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        {showOnlySelected ? 'Mostrar los resultados' : `Mostrar seleccionadas (${selectedCompanyIds.size})`}
                                    </span>
                                </button>
                            )}

                            {/* 📑 BOTÓN MENÚ DE REPORTES DESPLEGABLE */}
                            <div className="relative shrink-0" ref={reportsMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsReportsMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Reportes</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isReportsMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Menú Flotante de Reportes */}
                                {isReportsMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-app-card border border-app-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {/* Gráficas Estadísticas */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsReportsMenuOpen(false);
                                                setIsChartsModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                        >
                                            <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                                            <span>Ver Gráficas</span>
                                        </button>

                                        {/* Exportar Excel */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsReportsMenuOpen(false);
                                                handleExportExcel();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>Exportar a Excel</span>
                                        </button>

                                        <div className="my-1 border-t border-app-border" />

                                        {/* 📄 1. Descargar PDF Tabla */}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsReportsMenuOpen(false);
                                                const { pdf } = await import('@react-pdf/renderer');
                                                const doc = <CompanySheetPDFDocument companies={displayedCompanies} />;
                                                const blob = await pdf(doc).toBlob();
                                                const fecha = new Date().toISOString().split('T')[0];
                                                saveAs(blob, `Reporte_Empresas_Tabla_${fecha}.pdf`);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                                            <span>PDF Tabla</span>
                                        </button>

                                        {/* 📇 2. Descargar PDF Fichas (Normal) */}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsReportsMenuOpen(false);
                                                const { pdf } = await import('@react-pdf/renderer');
                                                const doc = <CompaniesPDFDocument companies={displayedCompanies} full={false} user={user} />;
                                                const blob = await pdf(doc).toBlob();
                                                const fecha = new Date().toISOString().split('T')[0];
                                                saveAs(blob, `Fichas_Tecnicas_Empresas_${fecha}.pdf`);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span>PDF Fichas Técnicas</span>
                                        </button>

                                        {/* 📇 3. Descargar PDF Fichas (FULL) */}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsReportsMenuOpen(false);
                                                const { pdf } = await import('@react-pdf/renderer');
                                                const doc = <CompaniesPDFDocument companies={displayedCompanies} full={true} user={user} />;
                                                const blob = await pdf(doc).toBlob();
                                                const fecha = new Date().toISOString().split('T')[0];
                                                saveAs(blob, `Fichas_Tecnicas_Empresas_FULL_${fecha}.pdf`);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                                            <span>PDF Fichas Completas</span>
                                        </button>

                                        {/* Enviar al Mapa (si hay empresas filtradas y representan un subconjunto) */}
                                        {mapableCompanies.length > 0 && companies.length > mapableCompanies.length && (
                                            <>
                                                <div className="my-1 border-t border-app-border" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsReportsMenuOpen(false);
                                                        setMapCompanies(mapableCompanies);
                                                        toast.success(`${mapableCompanies.length} empresas enviadas al mapa correctamente`);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-app-text hover:bg-app-border/40 transition-colors text-left"
                                                >
                                                    <Map className="w-4 h-4 text-teal-400 shrink-0" />
                                                    <span>Enviar al Mapa ({mapableCompanies.length})</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Alternador de Vista (Tabla / Tarjetas) y Nueva Empresa */}
                <div className="flex items-center gap-3 justify-between 2xl:justify-end shrink-0">
                    {companies.length > 0 && (
                        <div className="flex items-center bg-app-card p-1 rounded-lg border border-app-border">
                            <button
                                onClick={() => setTipoVista('tabla')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tipoVista === 'tabla'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-app-muted hover:text-app-text'
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
                                    : 'text-app-muted hover:text-app-text'
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
                <div className="flex items-center gap-2 mb-6 flex-wrap bg-app-card/60 p-3 rounded-xl border border-app-border">
                    <span className="text-xs text-app-muted font-medium">Filtros aplicados:</span>

                    {selectedCompanyIds.size > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 text-blue-400 text-xs rounded-lg border border-blue-500/30 font-medium">
                            <CheckSquare className="w-3.5 h-3.5" />
                            Empresas seleccionadas: {selectedCompanyIds.size}
                            <button onClick={clearSelection} className="hover:text-app-text" title="Quitar selección">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {search.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-lg border border-amber-500/20">
                            Búsqueda: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {canEdit && selectedEstatus.map((est) => (
                        <span key={est} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-lg border border-emerald-500/20">
                            Estatus: {est}
                            <button onClick={() => toggleFilter(est, selectedEstatus, setSelectedEstatus)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedTamanos.map((tamano) => (
                        <span key={tamano} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Tamaño: {tamano}
                            <button onClick={() => toggleFilter(tamano, selectedTamanos, setSelectedTamanos)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedTiposEmpresa.map((tipo) => (
                        <span key={tipo} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Tipo Empresa: {tipo}
                            <button onClick={() => toggleFilter(tipo, selectedTiposEmpresa, setSelectedTiposEmpresa)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedSectores.map((sec) => (
                        <span key={sec} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                            Sector: {sec.toLowerCase().includes('otro especif') ? 'Otro' : sec}
                            <button onClick={() => toggleFilter(sec, selectedSectores, setSelectedSectores)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedProductos.map((prod) => (
                        <span key={prod} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-lg border border-emerald-500/20">
                            Producto/Servicio: {prod.toLowerCase().includes('otro especif') ? 'Otro' : prod}
                            <button onClick={() => toggleFilter(prod, selectedProductos, setSelectedProductos)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedTipoOperaciones.map((op) => (
                        <span key={op} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-500 text-xs rounded-lg border border-cyan-500/20">
                            Operación: {op.toLowerCase().includes('otro especifique') ? 'Otro' : op}
                            <button onClick={() => toggleFilter(op, selectedTipoOperaciones, setSelectedTipoOperaciones)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedTipoSuministro.map((sum) => (
                        <span key={sum} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 text-teal-500 text-xs rounded-lg border border-teal-500/20">
                            Suministro: {sum.toLowerCase().includes('otro especifique') ? 'Otro' : sum}
                            <button onClick={() => toggleFilter(sum, selectedTipoSuministro, setSelectedTipoSuministro)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedPaisOrigen.map((pais) => (
                        <span key={pais} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg border border-violet-500/20">
                            Origen: {pais.toLowerCase().includes('otro especifique') ? 'Otro' : pais}
                            <button onClick={() => toggleFilter(pais, selectedPaisOrigen, setSelectedPaisOrigen)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedEstados.map((estado) => (
                        <span key={estado} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-lg border border-emerald-500/20">
                            Estado: {estado}
                            <button onClick={() => toggleFilter(estado, selectedEstados, setSelectedEstados)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedMunicipios.map((muni) => (
                        <span key={muni} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20">
                            Municipio: {muni}
                            <button onClick={() => toggleFilter(muni, selectedMunicipios, setSelectedMunicipios)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedExporta !== '' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-lg border border-sky-500/20">
                            Exporta: {selectedExporta === 'si' ? 'Sí' : 'No'}
                            <button onClick={() => { setCurrentPage(1); setSelectedExporta(''); }} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedPaisesDestino.map((pais) => (
                        <span key={pais} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs rounded-lg border border-fuchsia-500/20">
                            Destino: {pais.toLowerCase().includes('otro especifique') ? 'Otro' : pais}
                            <button onClick={() => toggleFilter(pais, selectedPaisesDestino, setSelectedPaisesDestino)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedCertificaciones.map((cert) => (
                        <span key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-lg border border-rose-500/20">
                            Certificación: {cert.toLowerCase().includes('otro especifique') ? 'Otro' : cert}
                            <button onClick={() => toggleFilter(cert, selectedCertificaciones, setSelectedCertificaciones)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedApoyos.map((apoyo) => (
                        <span key={apoyo} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20">
                            Apoyo: {apoyo.toLowerCase().includes('otro especifique') ? 'Otro' : apoyo}
                            <button onClick={() => toggleFilter(apoyo, selectedApoyos, setSelectedApoyos)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedEtiquetas.map((etq) => (
                        <span key={etq} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                            Etiqueta: {etq.toLowerCase().includes('otro especifique') ? 'Otro' : etq}
                            <button onClick={() => toggleFilter(etq, selectedEtiquetas, setSelectedEtiquetas)} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedFechaDesde && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Desde: {selectedFechaDesde}
                            <button onClick={() => { setCurrentPage(1); setSelectedFechaDesde(''); }} className="hover:text-app-text">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}

                    {selectedFechaHasta && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                            Hasta: {selectedFechaHasta}
                            <button onClick={() => { setCurrentPage(1); setSelectedFechaHasta(''); }} className="hover:text-app-text">
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

            {/* CONTADOR DE RESULTADOS Y CONTROL DE ORDENAMIENTO */}
            {!loading && displayedCompanies.length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-app-card border border-app-border px-4 py-2.5 rounded-lg text-sm text-app-text shadow-sm">

                    {/* Texto de Resultados Encontrados */}
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            Se {displayedCompanies.length === 1 ? 'encontró' : 'encontraron'}{' '}
                            <strong className="text-blue-500 font-semibold">{displayedCompanies.length}</strong>{' '}
                            {displayedCompanies.length === 1 ? 'resultado' : 'resultados'}
                        </span>

                        {displayedCompanies.length !== companies.length && (
                            <span className="text-xs text-app-muted hidden md:inline">
                                (filtrados de un total de {companies.length})
                            </span>
                        )}
                    </div>

                    {/* Control Unificado de Ordenamiento */}
                    <div className="flex items-center gap-1.5 bg-app-bg border border-app-border rounded-lg p-1 text-sm self-end sm:self-auto">
                        <span className="text-xs text-app-muted pl-2 font-medium hidden sm:inline">Ordenar:</span>
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as CompanySortField)}
                            className="bg-transparent text-xs sm:text-sm text-app-text font-medium focus:outline-none cursor-pointer py-1 px-1"
                        >
                            {SORT_OPTIONS.map((opt) => (
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

            {/* TABLA O TARJETAS */}
            {loading ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    Cargando datos...
                </div>
            ) : displayedCompanies.length === 0 ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    {showOnlySelected
                        ? 'No hay empresas seleccionadas.'
                        : 'No se encontraron empresas con los criterios seleccionados.'}
                </div>
            ) : (
                <>
                    {tipoVista === 'tabla' && (
                        <div className="bg-app-card border border-app-border rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-app-text">
                                    <thead className="bg-app-bg text-app-muted text-xs uppercase border-b border-app-border">
                                        <tr>
                                            <th className="px-4 py-4 w-10"></th>
                                            <th className="px-6 py-4">#</th>
                                            <th className="px-6 py-4">Empresa</th>
                                            <th className="px-6 py-4">RFC</th>
                                            <th className="px-6 py-4">Ubicación</th>
                                            <th className="px-6 py-4">Tamaño</th>
                                            {canEdit && <th className="px-6 py-4">Estatus</th>}
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-app-border">
                                        {paginatedCompanies.map((comp, index) => {
                                            const isSelected = Boolean(comp._id && selectedCompanyIds.has(comp._id));
                                            const globalIndex = pageSize === 'all' ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                                            return (
                                                <tr
                                                    key={comp._id}
                                                    className={`transition-colors ${isSelected
                                                        ? 'bg-blue-500/10 hover:bg-blue-500/15'
                                                        : 'hover:bg-app-border/40'
                                                        }`}
                                                >
                                                    <td className="px-4 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCompanySelection(comp._id)}
                                                            title={isSelected ? 'Quitar selección' : 'Seleccionar empresa'}
                                                            className={`p-1 rounded-md transition-colors ${isSelected
                                                                ? 'text-blue-400'
                                                                : 'text-app-muted hover:text-app-text'
                                                                }`}
                                                        >
                                                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-app-muted text-xs">
                                                        {globalIndex}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-app-text">
                                                        <div>{comp.nombreComercial}</div>
                                                        <div className="text-xs text-app-muted">{comp.razonSocial}</div>
                                                        {selectedTiposEmpresa.length > 1 && (
                                                            <span
                                                                className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap font-medium ${comp.tipoEmpresa === 'Empresa incompleta'
                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                                    }`}
                                                            >
                                                                {comp.tipoEmpresa}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-app-muted">{comp.rfc}</td>
                                                    <td className="px-6 py-4 text-app-muted">
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

                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenDetails(comp)}
                                                                className="p-1.5 bg-app-border/50 hover:bg-app-border text-blue-400 rounded-md transition-colors"
                                                                title="Ver detalles"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenFollow(comp)}
                                                                className="p-1.5 bg-app-border/50 hover:bg-app-border text-amber-400 rounded-md transition-colors"
                                                                title="Ver seguimientos"
                                                            >
                                                                <ChartGantt className="w-4 h-4" />
                                                            </button>

                                                            {canEdit && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openModal(comp)}
                                                                        className="p-1.5 bg-app-border/50 hover:bg-app-border text-app-text rounded-md transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
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
                                                        </div>
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
                            {paginatedCompanies.map((comp, index) => {
                                const isSelected = Boolean(comp._id && selectedCompanyIds.has(comp._id));
                                const globalIndex = pageSize === 'all' ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                                return (
                                    <div
                                        key={comp._id}
                                        className={`bg-app-card border rounded-xl p-5 shadow-md flex flex-col justify-between transition-colors ${isSelected
                                            ? 'border-blue-500 ring-1 ring-blue-500/40'
                                            : 'border-app-border hover:border-app-muted/50'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-start gap-2">
                                                    {/* 👈 Numerador en Card */}
                                                    <span className="px-2 py-0.5 bg-app-border/60 text-app-muted text-xs rounded font-bold shrink-0 mt-0.5">
                                                        #{globalIndex}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-bold text-app-text text-base leading-snug">{comp.nombreComercial}</h3>
                                                        <p className="text-xs text-app-muted line-clamp-1">{comp.razonSocial}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 whitespace-nowrap">
                                                        {comp.tamanoEmpresa}
                                                    </span>

                                                    {selectedTiposEmpresa.length > 1 && (
                                                        <span
                                                            className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap font-medium ${comp.tipoEmpresa === 'Empresa incompleta'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                                }`}
                                                        >
                                                            {comp.tipoEmpresa}
                                                        </span>
                                                    )}

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

                                            <div className="space-y-2 text-xs text-app-text my-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-app-muted shrink-0" />
                                                    <span>RFC: {comp.rfc || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-app-muted shrink-0" />
                                                    <span>Inicio de operaciones: {comp.anioInicio || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-app-muted shrink-0" />
                                                    <span>{comp.ubicacion?.municipio}, {comp.ubicacion?.estado}</span>
                                                </div>
                                                {comp.informacionEmpresa?.paisOrigen && (
                                                    <div className="flex items-center gap-2">
                                                        <Flag className="w-4 h-4 text-app-muted shrink-0" />
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
                                                        <Globe className="w-4 h-4 text-app-muted shrink-0" />
                                                        <a
                                                            href={formatUrl(comp.sitioWeb)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-400 hover:underline truncate"
                                                        >
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

                                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-3 border-t border-app-border mt-2">
                                            <button
                                                onClick={() => toggleCompanySelection(comp._id)}
                                                title={isSelected ? 'Quitar selección' : 'Seleccionar empresa'}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium mr-auto sm:mr-auto ${isSelected
                                                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                                                    : 'bg-app-border/50 hover:bg-app-border text-app-text'
                                                    }`}
                                            >
                                                {isSelected ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                                                <span className="hidden xl:inline">{isSelected ? 'Seleccionada' : 'Seleccionar'}</span>
                                            </button>

                                            <button
                                                onClick={() => handleOpenDetails(comp)}
                                                className="p-1.5 bg-app-border/50 hover:bg-app-border text-blue-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                                                title="Ver detalles"
                                            >
                                                <Eye className="w-4 h-4 shrink-0" />
                                            </button>

                                            <button
                                                onClick={() => handleOpenFollow(comp)}
                                                className="p-1.5 bg-app-border/50 hover:bg-app-border text-amber-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                                                title="Ver seguimientos"
                                            >
                                                <ChartGantt className="w-4 h-4 shrink-0" />
                                            </button>

                                            {canEdit && (
                                                <>
                                                    <button
                                                        onClick={() => openModal(comp)}
                                                        className="p-1.5 bg-app-border/50 hover:bg-app-border text-app-text rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4 shrink-0" />
                                                    </button>
                                                    <button
                                                        onClick={() => comp._id && handleDelete(comp._id, comp.nombreComercial)}
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4 shrink-0" />
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
                opcionesTipoEmpresa={OPCIONES_TIPO_EMPRESA}
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
                selectedTiposEmpresa={selectedTiposEmpresa}
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
                selectedFechaDesde={selectedFechaDesde}
                selectedFechaHasta={selectedFechaHasta}
                onToggleTamano={(val) => toggleFilter(val, selectedTamanos, setSelectedTamanos)}
                onToggleTipoEmpresa={(val) => toggleFilter(val, selectedTiposEmpresa, setSelectedTiposEmpresa)}
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
                onChangeFechaDesde={(val) => { setCurrentPage(1); setSelectedFechaDesde(val); }}
                onChangeFechaHasta={(val) => { setCurrentPage(1); setSelectedFechaHasta(val); }}
                onClearAll={clearAllFilters}
                totalResultados={filteredCompanies.length}
            />

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
                    <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                        <div className="p-6 border-b border-app-border flex items-center justify-between">
                            <h2 className="text-lg font-bold text-app-text">
                                {editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
                            </h2>
                            <button onClick={closeModal} className="text-app-muted hover:text-app-text transition-colors">
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
                                            const res = await api.put(`/companies/${editingCompany._id}`, data);
                                            toast.success('Empresa actualizada correctamente');

                                            // Actualización local
                                            updateCompanyInStore(res.data.company || res.data);
                                        } else {
                                            const res = await api.post('/companies', data);
                                            toast.success('Empresa registrada correctamente');

                                            // Inserción local
                                            addCompanyToStore(res.data.company || res.data);
                                        }
                                        closeModal();
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

            {/* MODAL CON COMPANIESFOLLOWPAGE */}
            {isFollowModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col my-auto overflow-hidden">
                        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
                            <CompaniesFollowPage
                                company={followCompany}
                                onClose={handleCloseFollow}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Importación Excel */}
            <CompanyImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => fetchCompanies(true)}
            />
        </>
    );
};
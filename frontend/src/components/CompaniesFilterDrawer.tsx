// src/components/CompaniesFilterDrawer.tsx
import { useState } from 'react';
import { Filter, X, ChevronDown, Check } from 'lucide-react';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    canEdit?: boolean;
    // Opciones
    opcionesTamano: string[];
    opcionesEstados: string[];
    opcionesMunicipios: string[];
    opcionesEtiquetas: string[];
    opcionesPaisesDestino: string[];
    opcionesCertificaciones: string[];
    opcionesApoyos: string[];
    opcionesTipoOperaciones: string[];
    opcionesTipoSuministro: string[];
    opcionesPaisOrigen: string[];
    opcionesSectores: string[];
    opcionesProductos: string[];         // 👈 NUEVO: Opciones de productos/servicios
    // Selecciones
    selectedTamanos: string[];
    selectedEstados: string[];
    selectedMunicipios: string[];
    selectedEstatus?: string[];
    selectedEtiquetas: string[];
    selectedExporta: string; // '' | 'si' | 'no'
    selectedPaisesDestino: string[];
    selectedCertificaciones: string[];
    selectedApoyos: string[];
    selectedTipoOperaciones: string[];
    selectedTipoSuministro: string[];
    selectedPaisOrigen: string[];
    selectedSectores: string[];
    selectedProductos: string[];         // 👈 NUEVO: Productos/servicios seleccionados
    // Handlers
    onToggleTamano: (val: string) => void;
    onToggleEstado: (val: string) => void;
    onToggleMunicipio: (val: string) => void;
    onToggleEstatus?: (val: string) => void;
    onToggleEtiqueta: (val: string) => void;
    onChangeExporta: (val: string) => void;
    onTogglePaisDestino: (val: string) => void;
    onToggleCertificacion: (val: string) => void;
    onToggleApoyo: (val: string) => void;
    onToggleTipoOperacion: (val: string) => void;
    onToggleTipoSuministro: (val: string) => void;
    onTogglePaisOrigen: (val: string) => void;
    onToggleSector: (val: string) => void;
    onToggleProducto: (val: string) => void;     // 👈 NUEVO: Handler para toggle de productos
    onClearAll: () => void;
    totalResultados: number;
}

export const CompaniesFilterDrawer = ({
    isOpen,
    onClose,
    canEdit = false,
    opcionesTamano,
    opcionesEstados,
    opcionesMunicipios,
    opcionesEtiquetas,
    opcionesPaisesDestino,
    opcionesCertificaciones,
    opcionesApoyos,
    opcionesTipoOperaciones,
    opcionesTipoSuministro,
    opcionesPaisOrigen,
    opcionesSectores,
    opcionesProductos,                 // 👈 NUEVO
    selectedTamanos,
    selectedEstados,
    selectedMunicipios,
    selectedEstatus = [],
    selectedEtiquetas,
    selectedExporta,
    selectedPaisesDestino,
    selectedCertificaciones,
    selectedApoyos,
    selectedTipoOperaciones,
    selectedTipoSuministro,
    selectedPaisOrigen,
    selectedSectores,
    selectedProductos,                 // 👈 NUEVO
    onToggleTamano,
    onToggleEstado,
    onToggleMunicipio,
    onToggleEstatus,
    onToggleEtiqueta,
    onChangeExporta,
    onTogglePaisDestino,
    onToggleCertificacion,
    onToggleApoyo,
    onToggleTipoOperacion,
    onToggleTipoSuministro,
    onTogglePaisOrigen,
    onToggleSector,
    onToggleProducto,                  // 👈 NUEVO
    onClearAll,
    totalResultados,
}: FilterDrawerProps) => {
    const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

    // Búsquedas internas
    const [searchTamano, setSearchTamano] = useState('');
    const [searchEstado, setSearchEstado] = useState('');
    const [searchMunicipio, setSearchMunicipio] = useState('');
    const [searchEtiqueta, setSearchEtiqueta] = useState('');
    const [searchPais, setSearchPais] = useState('');
    const [searchCert, setSearchCert] = useState('');
    const [searchApoyo, setSearchApoyo] = useState('');
    const [searchTipoOp, setSearchTipoOp] = useState('');
    const [searchTipoSum, setSearchTipoSum] = useState('');
    const [searchPaisOrigen, setSearchPaisOrigen] = useState('');
    const [searchSector, setSearchSector] = useState('');
    const [searchProducto, setSearchProducto] = useState(''); // 👈 NUEVO: Estado de búsqueda interna para productos

    if (!isOpen) return null;

    const opcionesEstatus = ['Activo', 'Inactivo'];
    const opcionesExportacion = [
        { label: 'Sí (Realiza exportaciones)', value: 'si' },
        { label: 'No (Sin exportaciones)', value: 'no' }
    ];

    // Helper para formatear y ordenar listas (Mueve "Otro especifique" -> "Otro" al final)
    const formatAndSortOptions = (items: string[]) => {
        const cleaned = items.map(item => ({
            original: item,
            label: item.toLowerCase().includes('otro especif') ? 'Otro' : item
        }));

        const normal = cleaned.filter(i => i.label !== 'Otro').sort((a, b) => a.label.localeCompare(b.label));
        const otro = cleaned.filter(i => i.label === 'Otro');

        return [...normal, ...otro];
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={() => {
                    if (openFilterMenu) {
                        setOpenFilterMenu(null);
                    } else {
                        onClose();
                    }
                }}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-app-card border-l border-app-border text-app-text flex flex-col shadow-2xl">

                    {/* ENCABEZADO */}
                    <div className="p-4 sm:p-5 border-b border-app-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-bold text-app-text">Filtros de Búsqueda</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-app-muted hover:text-app-text p-1 rounded-lg hover:bg-app-border/50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* CUERPO DEL DRAWER */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">

                        {/* Filtro: Estatus */}
                        {canEdit && (
                            <div className="relative w-full text-left">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterMenu(openFilterMenu === 'estatus' ? null : 'estatus')}
                                    className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedEstatus.length > 0
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                        }`}
                                >
                                    <span>
                                        Estatus
                                        {selectedEstatus.length > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                                {selectedEstatus.length}
                                            </span>
                                        )}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'estatus' ? 'rotate-180' : ''}`} />
                                </button>

                                {openFilterMenu === 'estatus' && (
                                    <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-1">
                                        {opcionesEstatus.map((est) => {
                                            const isSelected = selectedEstatus.includes(est);
                                            return (
                                                <button
                                                    key={est}
                                                    type="button"
                                                    onClick={() => onToggleEstatus && onToggleEstatus(est)}
                                                    className={`flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${est === 'Activo' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                                        {est}
                                                    </span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filtro: Tamaño */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'tamano' ? null : 'tamano')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedTamanos.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Tamaño
                                    {selectedTamanos.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedTamanos.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'tamano' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'tamano' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar tamaño..."
                                        value={searchTamano}
                                        onChange={(e) => setSearchTamano(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {opcionesTamano.filter((t) => t.toLowerCase().includes(searchTamano.toLowerCase())).map((tamano) => {
                                            const isSelected = selectedTamanos.includes(tamano);
                                            return (
                                                <button
                                                    key={tamano}
                                                    type="button"
                                                    onClick={() => onToggleTamano(tamano)}
                                                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                        }`}
                                                >
                                                    <span>{tamano}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Sectores */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'sector' ? null : 'sector')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedSectores.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Sectores
                                    {selectedSectores.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedSectores.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'sector' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'sector' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar sector..."
                                        value={searchSector}
                                        onChange={(e) => setSearchSector(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesSectores)
                                            .filter((item) => item.label.toLowerCase().includes(searchSector.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedSectores.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleSector(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Productos o Servicios */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'producto' ? null : 'producto')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedProductos.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Productos o Servicios
                                    {selectedProductos.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedProductos.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'producto' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'producto' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar producto o servicio..."
                                        value={searchProducto}
                                        onChange={(e) => setSearchProducto(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesProductos)
                                            .filter((item) => item.label.toLowerCase().includes(searchProducto.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedProductos.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleProducto(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Tipo de Operaciones */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'tipoOp' ? null : 'tipoOp')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedTipoOperaciones.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Tipo de Operaciones
                                    {selectedTipoOperaciones.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedTipoOperaciones.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'tipoOp' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'tipoOp' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo de operación..."
                                        value={searchTipoOp}
                                        onChange={(e) => setSearchTipoOp(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesTipoOperaciones)
                                            .filter((item) => item.label.toLowerCase().includes(searchTipoOp.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedTipoOperaciones.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleTipoOperacion(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Tipo de Suministro */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'tipoSum' ? null : 'tipoSum')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedTipoSuministro.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Tipo de Suministro
                                    {selectedTipoSuministro.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedTipoSuministro.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'tipoSum' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'tipoSum' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo de suministro..."
                                        value={searchTipoSum}
                                        onChange={(e) => setSearchTipoSum(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesTipoSuministro)
                                            .filter((item) => item.label.toLowerCase().includes(searchTipoSum.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedTipoSuministro.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleTipoSuministro(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: País de Origen */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'paisOrigen' ? null : 'paisOrigen')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedPaisOrigen.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    País de Origen
                                    {selectedPaisOrigen.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedPaisOrigen.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'paisOrigen' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'paisOrigen' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar país de origen..."
                                        value={searchPaisOrigen}
                                        onChange={(e) => setSearchPaisOrigen(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesPaisOrigen)
                                            .filter((item) => item.label.toLowerCase().includes(searchPaisOrigen.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedPaisOrigen.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onTogglePaisOrigen(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Estado */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'estado' ? null : 'estado')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedEstados.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Estado
                                    {selectedEstados.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedEstados.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'estado' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'estado' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar estado..."
                                        value={searchEstado}
                                        onChange={(e) => setSearchEstado(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {opcionesEstados
                                            .filter((e) => e.toLowerCase().includes(searchEstado.toLowerCase()))
                                            .map((estado) => {
                                                const isSelected = selectedEstados.includes(estado);
                                                return (
                                                    <button
                                                        key={estado}
                                                        type="button"
                                                        onClick={() => onToggleEstado(estado)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{estado}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Municipio */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'municipio' ? null : 'municipio')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedMunicipios.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Municipio
                                    {selectedMunicipios.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedMunicipios.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'municipio' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'municipio' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar municipio..."
                                        value={searchMunicipio}
                                        onChange={(e) => setSearchMunicipio(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {opcionesMunicipios
                                            .filter((m) => m.toLowerCase().includes(searchMunicipio.toLowerCase()))
                                            .map((muni) => {
                                                const isSelected = selectedMunicipios.includes(muni);
                                                return (
                                                    <button
                                                        key={muni}
                                                        type="button"
                                                        onClick={() => onToggleMunicipio(muni)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{muni}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Realiza Exportaciones */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'exporta' ? null : 'exporta')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedExporta !== ''
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    ¿Realiza Exportaciones?
                                    {selectedExporta !== '' && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            1
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'exporta' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'exporta' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-1">
                                    {opcionesExportacion.map((opt) => {
                                        const isSelected = selectedExporta === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => onChangeExporta(isSelected ? '' : opt.value)}
                                                className={`flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                    }`}
                                            >
                                                <span>{opt.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Filtro: Países Destino de Exportación */}
                        {selectedExporta !== 'no' && (
                            <div className="relative w-full text-left">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterMenu(openFilterMenu === 'pais' ? null : 'pais')}
                                    className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedPaisesDestino.length > 0
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                        }`}
                                >
                                    <span>
                                        País Destino Exportación
                                        {selectedPaisesDestino.length > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                                {selectedPaisesDestino.length}
                                            </span>
                                        )}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'pais' ? 'rotate-180' : ''}`} />
                                </button>

                                {openFilterMenu === 'pais' && (
                                    <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Buscar país..."
                                            value={searchPais}
                                            onChange={(e) => setSearchPais(e.target.value)}
                                            className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                        />
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                            {formatAndSortOptions(opcionesPaisesDestino)
                                                .filter((item) => item.label.toLowerCase().includes(searchPais.toLowerCase()))
                                                .map((item) => {
                                                    const isSelected = selectedPaisesDestino.includes(item.original);
                                                    return (
                                                        <button
                                                            key={item.original}
                                                            type="button"
                                                            onClick={() => onTogglePaisDestino(item.original)}
                                                            className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                                }`}
                                                        >
                                                            <span>{item.label}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filtro: Certificaciones */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'certificacion' ? null : 'certificacion')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedCertificaciones.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Certificaciones
                                    {selectedCertificaciones.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedCertificaciones.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'certificacion' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'certificacion' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar certificación..."
                                        value={searchCert}
                                        onChange={(e) => setSearchCert(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesCertificaciones)
                                            .filter((item) => item.label.toLowerCase().includes(searchCert.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedCertificaciones.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleCertificacion(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Apoyos Requeridos */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'apoyo' ? null : 'apoyo')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedApoyos.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Apoyos Requeridos
                                    {selectedApoyos.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedApoyos.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'apoyo' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'apoyo' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo de apoyo..."
                                        value={searchApoyo}
                                        onChange={(e) => setSearchApoyo(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesApoyos)
                                            .filter((item) => item.label.toLowerCase().includes(searchApoyo.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedApoyos.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleApoyo(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro: Etiquetas */}
                        <div className="relative w-full text-left">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'etiqueta' ? null : 'etiqueta')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${selectedEtiquetas.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-app-card border-app-border text-app-text hover:bg-app-border/30'
                                    }`}
                            >
                                <span>
                                    Etiquetas
                                    {selectedEtiquetas.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                                            {selectedEtiquetas.length}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${openFilterMenu === 'etiqueta' ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterMenu === 'etiqueta' && (
                                <div className="mt-2 w-full bg-app-card border border-app-border rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar etiqueta..."
                                        value={searchEtiqueta}
                                        onChange={(e) => setSearchEtiqueta(e.target.value)}
                                        className="w-full bg-app-bg border border-app-border rounded-md py-1.5 px-3 text-xs text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {formatAndSortOptions(opcionesEtiquetas)
                                            .filter((item) => item.label.toLowerCase().includes(searchEtiqueta.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = selectedEtiquetas.includes(item.original);
                                                return (
                                                    <button
                                                        key={item.original}
                                                        type="button"
                                                        onClick={() => onToggleEtiqueta(item.original)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-app-text hover:bg-app-border/50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* PIE Y BOTONES */}
                    <div className="p-4 sm:p-5 border-t border-app-border flex items-center justify-between bg-app-card/90">
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs text-app-muted hover:text-red-400 underline font-medium transition-colors"
                        >
                            Limpiar todo
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg"
                        >
                            Ver Resultados ({totalResultados})
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
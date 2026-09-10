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
    opcionesEtiquetas: string[]; // 👈 NUEVO
    // Selecciones
    selectedTamanos: string[];
    selectedEstados: string[];
    selectedMunicipios: string[];
    selectedEstatus?: string[];
    selectedEtiquetas: string[]; // 👈 NUEVO
    // Handlers
    onToggleTamano: (val: string) => void;
    onToggleEstado: (val: string) => void;
    onToggleMunicipio: (val: string) => void;
    onToggleEstatus?: (val: string) => void;
    onToggleEtiqueta: (val: string) => void; // 👈 NUEVO
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
    opcionesEtiquetas, // 👈 NUEVO
    selectedTamanos,
    selectedEstados,
    selectedMunicipios,
    selectedEstatus = [],
    selectedEtiquetas, // 👈 NUEVO
    onToggleTamano,
    onToggleEstado,
    onToggleMunicipio,
    onToggleEstatus,
    onToggleEtiqueta, // 👈 NUEVO
    onClearAll,
    totalResultados,
}: FilterDrawerProps) => {
    // Control del dropdown activo: 'tamano' | 'estado' | 'municipio' | 'estatus' | 'etiqueta' | null
    const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

    // Búsquedas internas
    const [searchTamano, setSearchTamano] = useState('');
    const [searchEstado, setSearchEstado] = useState('');
    const [searchMunicipio, setSearchMunicipio] = useState('');
    const [searchEtiqueta, setSearchEtiqueta] = useState(''); // 👈 NUEVO

    if (!isOpen) return null;

    const opcionesEstatus = ['Activo', 'Inactivo'];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop traslúcido */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                onClick={() => {
                    if (openFilterMenu) {
                        setOpenFilterMenu(null);
                    } else {
                        onClose();
                    }
                }}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-slate-800 border-l border-slate-700 text-slate-100 flex flex-col shadow-2xl">

                    {/* ENCABEZADO */}
                    <div className="p-4 sm:p-5 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-bold text-white">Filtros de Búsqueda</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* CUERPO DEL DRAWER CON DROPDOWNS */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

                        {/* Filtro Múltiple: Estatus (Únicamente visible si canEdit es true) */}
                        {canEdit && (
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterMenu(openFilterMenu === 'estatus' ? null : 'estatus')}
                                    className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedEstatus.length > 0
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
                                    <div className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 p-3 space-y-1">
                                        {opcionesEstatus.map((est) => {
                                            const isSelected = selectedEstatus.includes(est);
                                            return (
                                                <button
                                                    key={est}
                                                    type="button"
                                                    onClick={() => onToggleEstatus && onToggleEstatus(est)}
                                                    className={`flex items-center justify-between w-full px-2.5 py-2 rounded-md text-xs transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
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

                        {/* Filtro Múltiple: Tamaño */}
                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'tamano' ? null : 'tamano')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedTamanos.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
                                <div className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar tamaño..."
                                        value={searchTamano}
                                        onChange={(e) => setSearchTamano(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {opcionesTamano.filter((t) => t.toLowerCase().includes(searchTamano.toLowerCase())).map((tamano) => {
                                            const isSelected = selectedTamanos.includes(tamano);
                                            return (
                                                <button
                                                    key={tamano}
                                                    type="button"
                                                    onClick={() => onToggleTamano(tamano)}
                                                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
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

                        {/* Filtro Múltiple: Estado */}
                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'estado' ? null : 'estado')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedEstados.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
                                <div className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar estado..."
                                        value={searchEstado}
                                        onChange={(e) => setSearchEstado(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
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

                        {/* Filtro Múltiple: Municipio */}
                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'municipio' ? null : 'municipio')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedMunicipios.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
                                <div className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar municipio..."
                                        value={searchMunicipio}
                                        onChange={(e) => setSearchMunicipio(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
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

                        {/* Filtro Múltiple: Etiquetas (NUEVO) */}
                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => setOpenFilterMenu(openFilterMenu === 'etiqueta' ? null : 'etiqueta')}
                                className={`flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedEtiquetas.length > 0
                                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
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
                                <div className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Buscar etiqueta..."
                                        value={searchEtiqueta}
                                        onChange={(e) => setSearchEtiqueta(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {opcionesEtiquetas
                                            .filter((etq) => etq.toLowerCase().includes(searchEtiqueta.toLowerCase()))
                                            .map((etq) => {
                                                const isSelected = selectedEtiquetas.includes(etq);
                                                return (
                                                    <button
                                                        key={etq}
                                                        type="button"
                                                        onClick={() => onToggleEtiqueta(etq)}
                                                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                                                            }`}
                                                    >
                                                        <span>{etq}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* PIE Y BOTONES DE ACCIÓN */}
                    <div className="p-4 sm:p-5 border-t border-slate-700 flex items-center justify-between bg-slate-800/90">
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs text-slate-400 hover:text-red-400 underline font-medium transition-colors"
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
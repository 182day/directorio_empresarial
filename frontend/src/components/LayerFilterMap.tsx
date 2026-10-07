// src/components/LayerFilterMap.tsx
import React, { useEffect, useState } from 'react';
import {
    HelpCircle,
    VectorPolygon,
    MapPin,
    Spline,
    Layers,
    X,
    Cylinder,
    Droplet,
    Ambulance,
    GraduationCap,
    Church,
    ShoppingBag,
    TowerControl,
    Cross,
    ShoppingBasket,
    SportShoe,
    Dome,
    Info,
    ChevronDown,
    EyeOff
} from 'lucide-react';
import { CATALOGO_CAPAS, type MapLayerConfig } from '../data/mapCatalog';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';

interface LayerFilterMapProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    capasActivas: string[];
    onToggleCapa: (id: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
    VectorPolygon,
    MapPin,
    Spline,
    Cylinder,
    Droplet,
    Ambulance,
    SportShoe,
    GraduationCap,
    Church,
    Dome,
    ShoppingBag,
    TowerControl,
    Cross,
    ShoppingBasket,
};

export const LayerFilterMap: React.FC<LayerFilterMapProps> = ({
    isMenuOpen,
    setIsMenuOpen,
    capasActivas,
    onToggleCapa,
}) => {
    const mapCompanies = useMapCompaniesStore((state) => state.mapCompanies);

    // Estado para posicionar el tooltip dinámicamente fuera del scroll
    const [tooltipInfo, setTooltipInfo] = useState<{ visible: boolean; top: number; left: number }>({
        visible: false,
        top: 0,
        left: 0,
    });

    // Estado para controlar qué categorías están abiertas en el Acordeón
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    // Agrupación de capas por categoría
    const capasPorCategoria = CATALOGO_CAPAS.reduce<Record<string, MapLayerConfig[]>>((acc, capa) => {
        if (capa.id === 'empresas' && mapCompanies.length === 0) {
            return acc;
        }

        if (!acc[capa.category]) {
            acc[capa.category] = [];
        }
        acc[capa.category].push(capa);
        return acc;
    }, {});

    const toggleCategory = (categoria: string) => {
        setOpenCategories((prev) => ({
            ...prev,
            [categoria]: !prev[categoria],
        }));
    };

    // Función para desactivar todas las capas actualmente seleccionadas
    const handleDesactivarTodas = () => {
        [...capasActivas].forEach((id) => onToggleCapa(id));
    };

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'map-companies-storage' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed?.state?.mapCompanies) {
                        useMapCompaniesStore.setState({ mapCompanies: parsed.state.mapCompanies });
                    }
                } catch (err) {
                    console.error('Error al sincronizar empresas del mapa:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleToggleCapa = (id: string) => {
        const estaActiva = capasActivas.includes(id);

        if (!estaActiva) {
            if (id === 'empresas' && capasActivas.includes('empresasDirectorio')) {
                onToggleCapa('empresasDirectorio');
            }
            if (id === 'empresasDirectorio' && capasActivas.includes('empresas')) {
                onToggleCapa('empresas');
            }
        }

        onToggleCapa(id);
    };

    const handleMouseEnterInfo = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const asideElement = target.closest('aside');
        if (!asideElement) return;

        const rectTarget = target.getBoundingClientRect();
        const rectAside = asideElement.getBoundingClientRect();

        setTooltipInfo({
            visible: true,
            top: rectTarget.top - rectAside.top - 8,
            left: rectTarget.left - rectAside.left + rectTarget.width / 2,
        });
    };

    const handleMouseLeaveInfo = () => {
        setTooltipInfo((prev) => ({ ...prev, visible: false }));
    };

    return (
        <>
            <button
                onClick={() => setIsMenuOpen(true)}
                className="absolute top-4 right-4 z-47 flex items-center gap-2 bg-app-card text-app-text font-medium px-4 py-2.5 rounded-lg shadow-xl border border-app-border hover:bg-app-button-hover transition-all cursor-pointer"
            >
                <div className="relative flex items-center justify-center">
                    <Layers className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                </div>

                <span className="hidden sm:inline">Capas</span>

                {/* Badge con el contador de capas activas */}
                {capasActivas.length > 0 && (
                    <span className="flex items-center justify-center min-w-1.25 h-5 px-1.5 text-[11px] font-bold rounded-full bg-cyan-500 text-white shadow-sm">
                        {capasActivas.length}
                    </span>
                )}
            </button>

            {isMenuOpen && (
                <div
                    className="absolute inset-0 z-48 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <aside
                className={`absolute top-0 right-0 h-full w-80 sm:w-96 bg-app-card border-l border-app-border p-5 flex flex-col gap-4 z-51 shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header del Panel */}
                <div className="flex items-center justify-between pb-2 border-b border-app-border/60 shrink-0">
                    <div>
                        <h2 className="text-xs font-semibold text-app-muted uppercase tracking-wider font-mono">
                            Panel de Control
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-app-button transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Botón condicional para deshabilitar todas las capas si hay más de 2 activas */}
                {capasActivas.length > 2 && (
                    <button
                        type="button"
                        onClick={handleDesactivarTodas}
                        className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                        <EyeOff className="w-4 h-4 shrink-0" />
                        <span>Desactivar todas las capas ({capasActivas.length})</span>
                    </button>
                )}

                {/* Contenedor de Categorías con Scroll Independiente */}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-none">
                    {Object.entries(capasPorCategoria).map(([categoria, capas]) => {
                        const isOpen = openCategories[categoria] ?? false;
                        const capasActivasEnCategoria = capas.filter((c) => capasActivas.includes(c.id)).length;

                        return (
                            <div
                                key={categoria}
                                className="flex flex-col rounded-xl border border-app-border bg-app-bg/50 overflow-hidden shrink-0 transition-all duration-200"
                            >
                                {/* Encabezado del Accordion */}
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(categoria)}
                                    className="flex items-center justify-between p-3 text-left hover:bg-app-button/50 transition-colors cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">
                                            {categoria}
                                        </h3>
                                        {capasActivasEnCategoria > 0 && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                                                {capasActivasEnCategoria}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 text-app-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {/* Contenido colapsable */}
                                {isOpen && (
                                    <div className="p-2 pt-0 flex flex-col gap-2 border-t border-app-border/40">
                                        {capas.map((capa) => {
                                            const activa = capasActivas.includes(capa.id);
                                            const IconComponent = ICON_MAP[capa.icon] || HelpCircle;

                                            return (
                                                <button
                                                    key={capa.id}
                                                    type="button"
                                                    onClick={() => handleToggleCapa(capa.id)}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all duration-200 outline-none group cursor-pointer ${activa
                                                            ? 'bg-cyan-500/10 border-cyan-500 text-app-text shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                                            : 'bg-app-card border-app-border text-app-muted hover:border-cyan-500/50 hover:text-app-text'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                        <IconComponent className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${capa.color}`} />
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="text-xs font-medium tracking-wide truncate">
                                                                {capa.label}
                                                                {capa.id === 'empresas' && ` (${mapCompanies.length})`}
                                                            </span>

                                                            {capa.id === 'c_otros' && (
                                                                <div
                                                                    className="flex items-center shrink-0"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onMouseEnter={handleMouseEnterInfo}
                                                                    onMouseLeave={handleMouseLeaveInfo}
                                                                >
                                                                    <Info className="w-3.5 h-3.5 text-app-muted hover:text-cyan-500 transition-colors cursor-help" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all ${activa ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-app-border group-hover:border-cyan-500/50'}`}>
                                                        {activa && <span className="text-[10px] font-black">✓</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Tooltip flotante fuera del scroll */}
                {tooltipInfo.visible && (
                    <div
                        style={{
                            top: `${tooltipInfo.top}px`,
                            left: `${tooltipInfo.left}px`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-full w-60 p-2.5 bg-app-card text-app-text text-[11px] leading-snug rounded-xl shadow-2xl border border-app-border z-60 pointer-events-none transition-opacity duration-150"
                    >
                        <span className="font-semibold text-app-muted block mb-1">
                            Incluye las siguientes vías:
                        </span>
                        Andador, Callejón, Calzada, Camino, Cerrada, Circuito, Enlace, Glorieta, Privada, Prolongación, Retorno U, Vereda y Viaducto.

                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-app-border" />
                    </div>
                )}
            </aside>
        </>
    );
};
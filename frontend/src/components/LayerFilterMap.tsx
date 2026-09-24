// src/components/LayerFilterMap.tsx
import React, { useEffect } from 'react';
import { HelpCircle, VectorPolygon, MapPin, Spline, Layers, X } from 'lucide-react';
import { CATALOGO_CAPAS, type MapLayerConfig } from '../data/mapCatalog';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';

interface LayerFilterMapProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    capasActivas: string[];
    onToggleCapa: (id: string) => void;
}

// Mapa de íconos para renderizado dinámico
const ICON_MAP: Record<string, React.ElementType> = {
    VectorPolygon,
    MapPin,
    Spline,
};

export const LayerFilterMap: React.FC<LayerFilterMapProps> = ({
    isMenuOpen,
    setIsMenuOpen,
    capasActivas,
    onToggleCapa,
}) => {
    // Obtenemos mapCompanies directamente del store
    const mapCompanies = useMapCompaniesStore((state) => state.mapCompanies);

    // Escuchar cambios de localStorage si el usuario navega entre pestañas
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

    // Maneja la conmutación de capas respetando la exclusión mutua
    const handleToggleCapa = (id: string) => {
        const estaActiva = capasActivas.includes(id);

        if (!estaActiva) {
            // Si vamos a activar 'empresas' (filtradas), desactivamos 'empresasDirectorio' si está activa
            if (id === 'empresas' && capasActivas.includes('empresasDirectorio')) {
                onToggleCapa('empresasDirectorio');
            }
            // Si vamos a activar 'empresasDirectorio', desactivamos 'empresas' si está activa
            if (id === 'empresasDirectorio' && capasActivas.includes('empresas')) {
                onToggleCapa('empresas');
            }
        }

        // Alterna el estado de la capa seleccionada
        onToggleCapa(id);
    };

    return (
        <>
            {/* Botón flotante para abrir el menú de capas */}
            <button
                onClick={() => setIsMenuOpen(true)}
                className="absolute top-4 right-4 z-47 flex items-center gap-2 bg-app-card text-app-text font-medium px-4 py-2.5 rounded-lg shadow-xl border border-app-border hover:bg-app-button-hover transition-all cursor-pointer"
            >
                <Layers className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                <span>Capas y Filtros</span>
            </button>

            {/* Backdrop traslúcido */}
            {isMenuOpen && (
                <div
                    className="absolute inset-0 z-48 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Menú Lateral de Capas (Drawer) */}
            <aside
                className={`absolute top-0 right-0 h-full w-80 bg-app-card border-l border-app-border p-6 flex flex-col gap-6 z-51 shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Cabecera del Panel */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1 font-mono">
                            Panel de Control
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-lg text-app-muted hover:text-app-text hover:bg-app-button transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Listado de Capas Interactivas */}
                {/* Listado de Capas Interactivas */}
                <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
                    {CATALOGO_CAPAS.map((capa: MapLayerConfig) => {
                        // Ocultar 'Empresas filtradas' si no hay empresas en el store
                        if (capa.id === 'empresas' && mapCompanies.length === 0) {
                            return null;
                        }

                        const activa = capasActivas.includes(capa.id);
                        // Seleccionar el componente de ícono dinámicamente o fallback a HelpCircle
                        const IconComponent = ICON_MAP[capa.icon] || HelpCircle;
                        return (
                            <button
                                key={capa.id}
                                onClick={() => handleToggleCapa(capa.id)}
                                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 outline-none group cursor-pointer ${activa
                                        ? 'bg-cyan-500/10 border-cyan-500 text-app-text shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                        : 'bg-app-bg border-app-border text-app-muted hover:border-cyan-500/50 hover:text-app-text'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Renderizado dinámico del Ícono en lugar del span redondo */}
                                    <IconComponent className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${capa.color}`} />
                                    
                                    <span className="text-sm font-medium tracking-wide">
                                        {capa.label}
                                        {capa.id === 'empresas' && ` (${mapCompanies.length})`}
                                    </span>
                                </div>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${activa ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-app-border group-hover:border-cyan-500/50'
                                    }`}>
                                    {activa && <span className="text-[10px] font-black">✓</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Contador de empresas activas en el mapa */}
                {/* <div className="text-xs text-app-muted mt-2 pt-2 border-t border-app-border flex justify-between items-center">
                    <span>Empresas filtradas:</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {mapCompanies.length}
                    </span>
                </div> */}
            </aside>
        </>
    );
};
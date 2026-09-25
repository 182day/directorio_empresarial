// src/components/LayerFilterMap.tsx
import React, { useEffect } from 'react';
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
    SportShoe, // Alternativa para Dome / Gobernación
    Dome  // Alternativa para SportShoe / Deporte
} from 'lucide-react';
import { CATALOGO_CAPAS, type MapLayerConfig } from '../data/mapCatalog';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';

interface LayerFilterMapProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    capasActivas: string[];
    onToggleCapa: (id: string) => void;
}

// Mapa de íconos para renderizado dinámico en la lista
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

    return (
        <>
            <button
                onClick={() => setIsMenuOpen(true)}
                className="absolute top-4 right-4 z-47 flex items-center gap-2 bg-app-card text-app-text font-medium px-4 py-2.5 rounded-lg shadow-xl border border-app-border hover:bg-app-button-hover transition-all cursor-pointer"
            >
                <Layers className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                <span className="hidden sm:inline">Capas</span>
            </button>

            {isMenuOpen && (
                <div
                    className="absolute inset-0 z-48 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <aside
                className={`absolute top-0 right-0 h-full w-80 bg-app-card border-l border-app-border p-6 flex flex-col gap-6 z-51 shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
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

                <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1 scrollbar-none">
                    {Object.entries(capasPorCategoria).map(([categoria, capas]) => (
                        <div key={categoria} className="flex flex-col gap-2">
                            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider px-1">
                                {categoria}
                            </h3>

                            {capas.map((capa) => {
                                const activa = capasActivas.includes(capa.id);
                                const IconComponent = ICON_MAP[capa.icon] || HelpCircle;

                                return (
                                    <button
                                        key={capa.id}
                                        onClick={() => handleToggleCapa(capa.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 outline-none group cursor-pointer ${activa
                                                ? 'bg-cyan-500/10 border-cyan-500 text-app-text shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                                : 'bg-app-bg border-app-border text-app-muted hover:border-cyan-500/50 hover:text-app-text'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
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
                    ))}
                </div>
            </aside>
        </>
    );
};
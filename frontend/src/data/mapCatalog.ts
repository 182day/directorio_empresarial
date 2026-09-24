// src/data/mapCatalog.ts

export interface MapLayerConfig {
    id: string;
    label: string;
    color: string;
    icon: string;
    activaInicialmente?: boolean;
    layer?: string;
    zIndex?: number;
}

export const CATALOGO_CAPAS: MapLayerConfig[] = [
    { id: 'estado', label: 'Límite Estatal', color: 'text-slate-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'estado', zIndex: 1 },
    { id: 'municipios', label: 'Municipios', color: 'text-blue-500', icon: 'VectorPolygon', activaInicialmente: true, zIndex: 2 },
    { id: 'empresasDirectorio', label: 'Empresas Directorio', color: 'text-blue-500', icon: 'MapPin', activaInicialmente: false, zIndex: 3 },
    { id: 'empresas', label: 'Empresas Filtradas', color: 'text-emerald-500', icon: 'MapPin', activaInicialmente: false, zIndex: 3 },
    
    { id: 'agua', label: 'Cuerpos de Agua', color: 'text-cyan-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'agua', zIndex: 3 },
    { id: 'ageb', label: 'AGEB', color: 'text-fuchsia-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'ageb', zIndex: 3 },

    { id: 'pib', label: 'PIB Estatal / Regional', color: 'text-fuchsia-500', icon: 'Spline', activaInicialmente: false, zIndex: 3 },
    { id: 'densidad', label: 'Densidad Empresarial', color: 'text-cyan-500', icon: 'Spline', activaInicialmente: false, zIndex: 3 },
    { id: 'empleo', label: 'Empleo por Sector', color: 'text-emerald-500', icon: 'Spline', activaInicialmente: false, zIndex: 3},
    { id: 'nodos', label: 'Nodos Logísticos', color: 'text-amber-500', icon: 'MapPin', activaInicialmente: false, zIndex: 3 },
];
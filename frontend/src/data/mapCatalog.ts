// src/data/mapCatalog.ts

export interface MapLayerConfig {
    id: string;
    label: string;
    color: string;
    icon: string;
    activaInicialmente?: boolean;
    layer?: string;
    zIndex?: number;
    category: string;
}

export const CATALOGO_CAPAS: MapLayerConfig[] = [
    // Categoría: Información básica
    { id: 'republica', label: 'Estados de la República', color: 'text-slate-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'republica', zIndex: 1, category: 'Información básica' },
    { id: 'estado', label: 'Límite Estatal', color: 'text-red-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'estado', zIndex: 2, category: 'Información básica' },
    { id: 'municipios', label: 'Municipios', color: 'text-blue-500', icon: 'VectorPolygon', activaInicialmente: true, zIndex: 3, category: 'Información básica' },
    { id: 'ageb', label: 'AGEB', color: 'text-fuchsia-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'ageb', zIndex: 4, category: 'Información básica' },
    
    // Categoría: Empresas
    { id: 'empresasDirectorio', label: 'Empresas Directorio', color: 'text-blue-500', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Empresas' },
    { id: 'empresas', label: 'Empresas Filtradas', color: 'text-emerald-500', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Empresas' },

    // Categoría: Otros
    { id: 'cementerio', label: 'Cementerio', color: 'text-stone-500', icon: 'Cross', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'centrodeasistenciamedica', label: 'Centro de Asistencia Médica', color: 'text-red-500', icon: 'Ambulance', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'agua', label: 'Cuerpos de Agua', color: 'text-cyan-500', icon: 'VectorPolygon', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'escuela', label: 'Escuela', color: 'text-blue-500', icon: 'GraduationCap', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciondecomunicacion', label: 'Instalación de Comunicación', color: 'text-gray-500', icon: 'TowerControl', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciondeportivaorecreativa', label: 'Instalación Deportiva o Recreativa', color: 'text-sky-500', icon: 'SportShoe', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciongubernamental', label: 'Instalación Gubernamental', color: 'text-emerald-500', icon: 'Dome', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'mercado', label: 'Mercado', color: 'text-orange-500', icon: 'ShoppingBasket', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'plaza', label: 'Plaza', color: 'text-orange-500', icon: 'ShoppingBag', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'pozo', label: 'Pozo', color: 'text-cyan-500', icon: 'Droplet', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'tanquedeagua', label: 'Tanque de Agua', color: 'text-teal-500', icon: 'Cylinder', activaInicialmente: false, layer: 'sip', zIndex: 4, category: 'Otros' },
    { id: 'templo', label: 'Templo', color: 'text-amber-500', icon: 'Church', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },

    // Categoría: Estadística
    { id: 'densidad', label: 'Densidad Empresarial', color: 'text-cyan-500', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    { id: 'empleo', label: 'Empleo por Sector', color: 'text-emerald-500', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    { id: 'nodos', label: 'Nodos Logísticos', color: 'text-amber-500', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    { id: 'pib', label: 'PIB Estatal / Regional', color: 'text-fuchsia-500', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
];
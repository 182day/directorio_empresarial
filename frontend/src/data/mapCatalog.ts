// src/data/mapCatalog.ts

export interface MapLayerConfig {
    id: string;
    label: string;
    color: string;
    icon: string;
    type: string;
    activaInicialmente?: boolean;
    layer?: string;
    zIndex?: number;
    category: string;
}

export const CATALOGO_CAPAS: MapLayerConfig[] = [
    // Categoría: Empresas
    { id: 'empresasDirectorio', label: 'Empresas Directorio', color: 'text-blue-500', type: 'Marker', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Empresas' },
    { id: 'empresas', label: 'Empresas Filtradas', color: 'text-emerald-500', type: 'Marker', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Empresas' },

    // Categoría: Información básica
    { id: 'republica', label: 'Estados de la República', color: 'text-slate-500', type: 'Polygon', icon: 'VectorPolygon', activaInicialmente: false, layer: 'republica', zIndex: 1, category: 'Información básica' },
    { id: 'estado', label: 'Límite Estatal', color: 'text-red-500', type: 'Polygon', icon: 'VectorPolygon', activaInicialmente: false, layer: 'estado', zIndex: 2, category: 'Información básica' },
    { id: 'municipios', label: 'Municipios', color: 'text-blue-500', type: 'Polygon', icon: 'VectorPolygon', activaInicialmente: true, zIndex: 3, category: 'Información básica' },
    { id: 'ageb', label: 'AGEB', color: 'text-fuchsia-500', type: 'Polygon', icon: 'VectorPolygon', activaInicialmente: false, layer: 'ageb', zIndex: 4, category: 'Información básica' },
    
    // Categoría: Conectividad
    { id: 'car_federal', label: 'Carretera Federal', color: 'text-red-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'car_estatal', label: 'Carretera Estatal', color: 'text-blue-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'car_municipal', label: 'Carretera Municipal', color: 'text-yellow-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'c_avenida', label: 'Avenida', color: 'text-sky-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'c_boulevard', label: 'Boulevard', color: 'text-indigo-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'c_calle', label: 'Calle', color: 'text-teal-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },
    { id: 'c_otros', label: 'Otros', color: 'text-stone-400', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Conectividad' },

    // Categoría: Otros
    { id: 'cementerio', label: 'Cementerio', color: 'text-stone-500', type: 'Marker', icon: 'Cross', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'centrodeasistenciamedica', label: 'Centro de Asistencia Médica', type: 'Marker', color: 'text-red-500', icon: 'Ambulance', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'agua', label: 'Cuerpos de Agua', color: 'text-cyan-500', type: 'Polygon', icon: 'VectorPolygon', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'escuela', label: 'Escuela', color: 'text-blue-500', type: 'Marker', icon: 'GraduationCap', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciondecomunicacion', label: 'Instalación de Comunicación', color: 'text-gray-500', type: 'Marker', icon: 'TowerControl', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciondeportivaorecreativa', label: 'Instalación Deportiva o Recreativa', color: 'text-sky-500', type: 'Marker', icon: 'SportShoe', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'instalaciongubernamental', label: 'Instalación Gubernamental', color: 'text-emerald-500', type: 'Marker', icon: 'Dome', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'mercado', label: 'Mercado', color: 'text-orange-500', type: 'Marker', icon: 'ShoppingBasket', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'plaza', label: 'Plaza', color: 'text-orange-500', type: 'Marker', icon: 'ShoppingBag', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'pozo', label: 'Pozo', color: 'text-cyan-500', type: 'Marker', icon: 'Droplet', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },
    { id: 'tanquedeagua', label: 'Tanque de Agua', color: 'text-teal-500', type: 'Marker', icon: 'Cylinder', activaInicialmente: false, layer: 'sip', zIndex: 4, category: 'Otros' },
    { id: 'templo', label: 'Templo', color: 'text-amber-500', type: 'Marker', icon: 'Church', activaInicialmente: false, layer: 'agua', zIndex: 4, category: 'Otros' },

    // Categoría: Estadística
    // { id: 'densidad', label: 'Densidad Empresarial', color: 'text-cyan-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    // { id: 'empleo', label: 'Empleo por Sector', color: 'text-emerald-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    // { id: 'nodos', label: 'Nodos Logísticos', color: 'text-amber-500', type: 'Line', icon: 'MapPin', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
    // { id: 'pib', label: 'PIB Estatal / Regional', color: 'text-fuchsia-500', type: 'Line', icon: 'Spline', activaInicialmente: false, zIndex: 4, category: 'Estadística' },
];
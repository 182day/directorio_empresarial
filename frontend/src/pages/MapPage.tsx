// src/pages/MapPage.tsx
import { useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { useTheme } from '../context/ThemeContext';
import { useCompanyStore } from '../stores/useCompanyStore';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import { type CompanyFormData } from '../interfaces/company.interface';
import {
    Building2, MapPin, Cylinder, Droplet, Ambulance, GraduationCap,
    Church, ShoppingBag, TowerControl, Cross, ShoppingBasket, SportShoe, Dome, HelpCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { LayerFilterMap } from '../components/LayerFilterMap';
import { CATALOGO_CAPAS, type MapLayerConfig } from '../data/mapCatalog';
import 'leaflet/dist/leaflet.css';
import { normalizeKey } from '../utils/formUtils';

// --- Importación de capas GeoJSON ---
import localidadesData from '../data/layers/localidades.json';
import municipioGeoJson from '../data/layers/municipios.json';
import agebGeoJson from '../data/layers/ageb.json';
import aguaGeoJson from '../data/layers/agua.json';
import estadoGeoJson from '../data/layers/estado.json';
import republicaGeoJson from '../data/layers/republica.json';
import sipGeoJson from '../data/layers/sip.json';

// Tipado del catálogo de localidades
interface Localidad {
    CVE_MUN: string;
    NOM_MUN: string;
    CVE_LOC: string;
    NOM_LOC: string;
    AMBITO: string;
    LATITUD: string;
    LONGITUD: string;
}

const GEOJSON_DATA_MAP: Record<string, any> = {
    estado: estadoGeoJson,
    agua: aguaGeoJson,
    ageb: agebGeoJson,
};

const ICON_COMPONENTS: Record<string, any> = {
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
    MapPin
};

// Función auxiliar para mapear clases de Tailwind text-* a colores Hexadecimales para SVG/Leaflet
const getHexFromColorClass = (colorClass: string): string => {
    if (colorClass.includes('slate') || colorClass.includes('dark')) return '#64748b';
    if (colorClass.includes('stone')) return '#78716c';
    if (colorClass.includes('gray')) return '#6b7280';
    if (colorClass.includes('teal')) return '#14b8a6';
    if (colorClass.includes('cyan')) return '#06b6d4';
    if (colorClass.includes('sky')) return '#0ea5e9';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('fuchsia')) return '#d946ef';
    if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10b981';
    if (colorClass.includes('amber')) return '#f59e0b';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('red')) return '#ef4444';
    return '#3b82f6'; // Azul por defecto
};

const BASE_URL_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const BASE_URL_LIGHT = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

const posicionInicial: LatLngExpression = [20.8563, -99.8302];
const API_KEY = import.meta.env.VITE_API_KEY;

// Generador de Marker Icon personalizado según el icono Lucide de la capa
const createDynamicMarkerIcon = (colorClass: string, iconName?: string) => {
    const hexColor = getHexFromColorClass(colorClass);
    const IconComponent = (iconName && ICON_COMPONENTS[iconName]) ? ICON_COMPONENTS[iconName] : HelpCircle;

    const iconHtml = renderToString(<IconComponent size={16} color="#ffffff" strokeWidth={2.5} />);

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 32px; 
                height: 32px; 
                background-color: ${hexColor}; 
                border-radius: 50%; 
                border: 2px solid white; 
                box-shadow: 0px 4px 6px rgba(0,0,0,0.3);
            ">
                ${iconHtml}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

const ResizeMap = () => {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        if (!container) return;

        // Observer para detectar cambios de dimensión en el contenedor del mapa
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        resizeObserver.observe(container);

        // Disparo inicial tras montar el componente
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [map]);

    return null;
};

export const MapPage = () => {
    const { theme } = useTheme();

    const { companies } = useCompanyStore();
    const { mapCompanies } = useMapCompaniesStore();

    const BASE_URL = theme === 'dark' ? BASE_URL_DARK : BASE_URL_LIGHT;
    const urlMapa = API_KEY ? `${BASE_URL}?api_key=${API_KEY}` : BASE_URL;

    const [capasActivas, setCapasActivas] = useState<string[]>(() =>
        CATALOGO_CAPAS.filter((capa) => capa.activaInicialmente).map((capa) => capa.id)
    );
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    const [viewingCompany, setViewingCompany] = useState<CompanyFormData | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

    const handleOpenDetails = (companyData: CompanyFormData) => {
        setViewingCompany(companyData);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setViewingCompany(null);
    };

    const toggleCapa = (id: string) => {
        setCapasActivas((prev) =>
            prev.includes(id) ? prev.filter((capa) => capa !== id) : [...prev, id]
        );
    };

    const estiloEstado = {
        color: '#fff',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#c4c4c4',
        fillOpacity: 0.15,
    };

    const estiloMunicipios = {
        color: '#2563eb',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
    };

    const crearCargadorInformacion = (estiloBase: L.PathOptions) => (feature: any, layer: any) => {
        const { NOMGEO, URL } = feature.properties || {};

        layer.bindPopup(`
        <div class="p-1 space-y-2 text-app-text font-sans">
            <div>
                <h4 class="m-0 font-bold text-sm text-blue-500 leading-tight">
                    <strong>${NOMGEO || 'Desconocido'}</strong>
                </h4>
            </div>
            <div class="pt-2 border-t border-app-border flex justify-end">
                <a
                    href="https://www.economia.gob.mx/datamexico/es/profile/geo/${URL || ''}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-1.5 text-app-muted hover:text-cyan-500 hover:bg-app-bg rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium no-underline cursor-pointer"
                    title="Ver perfil económico en Data México"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up shrink-0 text-cyan-500">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                        <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                    <span>Ficha Económica</span>
                </a>
            </div>
        </div>
    `);

        layer.on({
            mouseover: (e: any) => {
                e.target.setStyle({ fillOpacity: 0.4, weight: 2.5 });
            },
            mouseout: (e: any) => {
                // Restaura exactamente el estilo base de esta capa en particular
                e.target.setStyle(estiloBase);
            },
        });
    };

    const capaActivaId = capasActivas.includes('empresas')
        ? 'empresas'
        : capasActivas.includes('empresasDirectorio')
            ? 'empresasDirectorio'
            : null;

    const capaConfig = CATALOGO_CAPAS.find((c) => c.id === capaActivaId);

    const listaEmpresasAVisualizar = capaActivaId === 'empresas'
        ? mapCompanies
        : capaActivaId === 'empresasDirectorio'
            ? companies
            : [];

    const customIcon = capaConfig ? createDynamicMarkerIcon(capaConfig.color, capaConfig.icon) : undefined;

    const empresasConCoordenadas = listaEmpresasAVisualizar.filter((emp) => {
        const lat = emp.ubicacion?.latitud;
        const lng = emp.ubicacion?.longitud;
        return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    });

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-app-bg overflow-hidden transition-colors duration-200">
            <LayerFilterMap
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                capasActivas={capasActivas}
                onToggleCapa={toggleCapa}
            />

            <MapContainer
                center={posicionInicial}
                zoom={8.5}
                maxZoom={22}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <ResizeMap />

                <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://www.inegi.org.mx/" target="_blank">INEGI</a>'
                    url={urlMapa}
                    maxNativeZoom={18}
                    maxZoom={22}
                />

                {/* Municipios */}
                {capasActivas.includes('municipios') && (
                    <GeoJSON
                        data={municipioGeoJson as any}
                        style={estiloMunicipios}
                        onEachFeature={crearCargadorInformacion(estiloMunicipios)}
                    />
                )}

                {/* Estados */}
                {capasActivas.includes('republica') && (
                    <GeoJSON
                        data={republicaGeoJson as any}
                        style={estiloEstado}
                        onEachFeature={crearCargadorInformacion(estiloEstado)}
                    />
                )}

                {/* Capas GeoJSON Vectoriales (estado, agua, ageb, etc.) */}
                {CATALOGO_CAPAS.filter(
                    (capa: MapLayerConfig) => capa.layer && capasActivas.includes(capa.id)
                ).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((capa: MapLayerConfig) => {
                    const geoData = GEOJSON_DATA_MAP[capa.layer as string];
                    if (!geoData) return null;

                    const hexColor = getHexFromColorClass(capa.color);

                    return (
                        <GeoJSON
                            key={capa.id}
                            data={geoData as any}
                            interactive={false}
                            style={{
                                color: hexColor,
                                weight: 2,
                                opacity: 0.8,
                                fillColor: hexColor,
                                fillOpacity: 0.2,
                            }}
                        />
                    );
                })}

                {/* Marcadores Filtrados Dináminamente desde sip.json con su respectivo Icono Lucide */}
                {(() => {
                    const features = (sipGeoJson as any).features || [];

                    const featuresFiltradas = features.filter((feature: any) => {
                        const valorGeografico = feature.properties?.GEOGRAFICO || '';
                        const idNormalizado = normalizeKey(valorGeografico);
                        return capasActivas.includes(idNormalizado);
                    });

                    return featuresFiltradas.map((feature: any, index: number) => {
                        const coordinates = feature.geometry?.coordinates;
                        if (!coordinates || coordinates.length < 2) return null;

                        const [lng, lat] = coordinates;
                        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null;

                        const valorGeografico = feature.properties?.GEOGRAFICO || '';
                        const idNormalizado = normalizeKey(valorGeografico);

                        // Búsqueda del municipio y localidad en el catálogo localidades.json
                        const cveMun = feature.properties?.CVE_MUN;
                        const cveLoc = feature.properties?.CVE_LOC;

                        const infoLocalidad = (localidadesData as Localidad[]).find(
                            (loc) => loc.CVE_MUN === cveMun && loc.CVE_LOC === cveLoc
                        );

                        const nombreMunicipio = infoLocalidad?.NOM_MUN || `Mun. ${cveMun || 'N/A'}`;
                        const nombreLocalidad = infoLocalidad?.NOM_LOC || feature.properties?.NOMBRE || feature.properties?.DENOMINACION || `Loc. ${cveLoc || 'N/A'}`;

                        // Se obtiene la configuración dinámica desde mapCatalog
                        const configCapa = CATALOGO_CAPAS.find((c) => c.id === idNormalizado);
                        const markerIcon = createDynamicMarkerIcon(
                            configCapa?.color || 'text-red-500',
                            configCapa?.icon
                        );

                        return (
                            <Marker
                                key={feature.id || `sip-${idNormalizado}-${index}`}
                                position={[lat, lng]}
                                icon={markerIcon}
                            >
                                <Popup className={theme}>
                                    <div className="p-1 space-y-1 text-app-text min-w-40">
                                        {/* Badge de tipo/valor geográfico */}
                                        <div className="flex justify-start mb-2">
                                            <span
                                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-block mb-1"
                                                style={{
                                                    color: getHexFromColorClass(configCapa?.color || 'text-red-500'),
                                                    backgroundColor: `${getHexFromColorClass(configCapa?.color || 'text-red-500')}1A`, // 1A equivale a ~10% de opacidad
                                                    borderColor: `${getHexFromColorClass(configCapa?.color || 'text-red-500')}33`, // 33 equivale a ~20% de opacidad
                                                }}
                                            >
                                                {valorGeografico}
                                            </span>
                                        </div>

                                        {/* Nombre de la Localidad (NOM_LOC) */}
                                        <h4 className="font-bold text-sm leading-tight">
                                            {nombreLocalidad}
                                        </h4>

                                        {/* Nombre del Municipio (NOM_MUN) */}
                                        <p className="text-xs text-app-muted uppercase">
                                            {nombreMunicipio}
                                        </p>

                                        {/* Información adicional del SIP (Condición, Servicio, etc.) */}
                                        {feature.properties?.CONDICION && (
                                            <div className="pt-1 text-[11px] border-t border-gray-200/20 space-y-0.5">
                                                <p>
                                                    <span className="font-medium">Condición:</span> {feature.properties.CONDICION}
                                                </p>
                                                {(feature.properties?.NOMSERV && feature.properties?.NOMSERV !== 'Ninguno') && (
                                                    <p>
                                                        <span className="font-medium">Servicio:</span> {feature.properties.NOMSERV}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    });
                })()}

                {/* Capa de Marcadores de Empresas */}
                {(capasActivas.includes('empresas') || capasActivas.includes('empresasDirectorio')) &&
                    empresasConCoordenadas.map((empresa) => {
                        const lat = empresa.ubicacion.latitud as number;
                        const lng = empresa.ubicacion.longitud as number;

                        return (
                            <Marker
                                key={empresa._id || `${lat}-${lng}`}
                                position={[lat, lng]}
                                icon={customIcon}
                            >
                                <Popup className={theme}>
                                    <div className="p-1 space-y-2 text-app-text min-w-50 rounded-xl">
                                        <div className="flex items-start justify-between gap-2 border-b border-app-border pb-2">
                                            <div>
                                                <h4 className="font-bold text-sm text-app-text leading-tight">
                                                    {empresa.nombreComercial}
                                                </h4>
                                                {empresa.razonSocial && (
                                                    <p className="text-xs text-app-muted mt-0.5">
                                                        {empresa.razonSocial}
                                                    </p>
                                                )}
                                            </div>

                                            {empresa.tamanoEmpresa && (
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-semibold rounded-full border border-blue-500/20 whitespace-nowrap shrink-0">
                                                    {empresa.tamanoEmpresa}
                                                </span>
                                            )}
                                        </div>

                                        {empresa.ubicacion && (
                                            <div className="flex items-center gap-1.5 text-xs text-app-muted">
                                                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span>
                                                    {[empresa.ubicacion.municipio, empresa.ubicacion.estado].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-app-border flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDetails(empresa)}
                                                className="p-1.5 text-app-muted hover:text-blue-500 hover:bg-app-bg rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                                                title="Ver detalles de la empresa"
                                            >
                                                <Building2 className="w-4 h-4" />
                                                <span>Ver detalles</span>
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
            </MapContainer>

            <CompanyDetailsModal
                isOpen={isDetailsOpen}
                company={viewingCompany}
                onClose={handleCloseDetails}
            />
        </div>
    );
};
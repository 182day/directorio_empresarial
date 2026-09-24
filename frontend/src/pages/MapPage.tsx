// src/pages/MapPage.tsx
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCompanyStore } from '../stores/useCompanyStore';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import { type CompanyFormData } from '../interfaces/company.interface';
import { Building2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import datosGeoJson from '../data/qro_mun.json';
import { LayerFilterMap } from '../components/LayerFilterMap';
import { CATALOGO_CAPAS, type MapLayerConfig } from '../data/mapCatalog';
import 'leaflet/dist/leaflet.css';

// --- Importación de las capas GeoJSON dinámicas ---
import agebGeoJson from '../data/layers/ageb.json';
import aguaGeoJson from '../data/layers/agua.json';
import estadoGeoJson from '../data/layers/estado.json';

// Diccionario que vincula el string de la propiedad 'layer' con el archivo GeoJSON importado
const GEOJSON_DATA_MAP: Record<string, any> = {
    estado: estadoGeoJson,
    agua: aguaGeoJson,
    ageb: agebGeoJson,
};

// Función auxiliar para mapear clases de Tailwind text-* a colores Hexadecimales para SVG/Leaflet
const getHexFromColorClass = (colorClass: string): string => {
    if (colorClass.includes('slate') || colorClass.includes('dark')) return '#64748b';
    if (colorClass.includes('cyan')) return '#06b6d4';
    if (colorClass.includes('fuchsia')) return '#d946ef';
    if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10b981';
    if (colorClass.includes('amber')) return '#f59e0b';
    return '#3b82f6'; // Azul por defecto
};

const BASE_URL_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const BASE_URL_LIGHT = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

const posicionInicial: LatLngExpression = [20.8563, -99.8302];
const API_KEY = import.meta.env.VITE_API_KEY;

// Función para generar un icono SVG dinámico de Leaflet con el color de la capa
const createCustomMarkerIcon = (colorClass: string) => {
    const hexColor = getHexFromColorClass(colorClass);

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${hexColor}" width="28" height="28" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
    });
};

const ResizeMap = () => {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);

        const handleResize = () => {
            map.invalidateSize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
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

    const estiloMunicipios = {
        color: '#2563eb',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
    };

    const alCargarCadaMunicipio = (feature: any, layer: any) => {
        const { NOMGEO, CVEGEO, URL } = feature.properties || {};

        layer.bindPopup(`
        <div class="p-1 space-y-2 text-app-text font-sans">
            <div>
                <h4 class="m-0 font-bold text-sm text-blue-500 leading-tight">
                    Municipio: <strong>${NOMGEO || 'Desconocido'}</strong>
                </h4>
                <p class="m-0 text-xs text-app-muted mt-0.5">
                    Clave Geográfica: <code class="px-1 py-0.5 bg-app-bg border border-app-border rounded text-app-text font-mono">${CVEGEO || 'N/A'}</code>
                </p>
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
                e.target.setStyle(estiloMunicipios);
            },
        });
    };

    // Identificamos el ID de la capa de empresas actualmente activa
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

    const customIcon = capaConfig ? createCustomMarkerIcon(capaConfig.color) : undefined;

    const empresasConCoordenadas = listaEmpresasAVisualizar.filter((emp) => {
        const lat = emp.ubicacion?.latitud;
        const lng = emp.ubicacion?.longitud;
        return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    });

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-app-bg overflow-hidden transition-colors duration-200">
            {/* Componente del Filtro de Capas */}
            <LayerFilterMap
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                capasActivas={capasActivas}
                onToggleCapa={toggleCapa}
            />

            {/* Contenedor del Mapa */}
            <MapContainer
                center={posicionInicial}
                zoom={8.5}
                maxZoom={22}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <ResizeMap />

                <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    url={urlMapa}
                    maxNativeZoom={18}
                    maxZoom={22}
                />

                {/* Capa de Vectoriales GeoJSON de Municipios */}
                {capasActivas.includes('municipios') && (
                    <GeoJSON
                        data={datosGeoJson as any}
                        style={estiloMunicipios}
                        onEachFeature={alCargarCadaMunicipio}
                    />
                )}

                {/* Renderizado dinámico de Capas GeoJSON adicionales (estado, agua, ageb, etc.) */}
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

                {/* Capa de Marcadores de Empresas (Filtradas OR Directorio) */}
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

                                        <div className="pt-2 border-t border-app-border flex justify-end">
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
            
            {/* MODAL VER DETALLES DE LA EMPRESA */}
            <CompanyDetailsModal
                isOpen={isDetailsOpen}
                company={viewingCompany}
                onClose={handleCloseDetails}
            />
        </div>
    );
};
// src/pages/MapPage.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { useTheme } from '../context/ThemeContext';
import { useCompanyStore } from '../stores/useCompanyStore';
import { useMapCompaniesStore } from '../stores/useMapCompaniesStore';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import { type CompanyFormData } from '../interfaces/company.interface';
import {
    Building2, MapPin, Cylinder, Droplet, Ambulance, GraduationCap, Radius, X,
    Church, ShoppingBag, TowerControl, Cross, ShoppingBasket, SportShoe, Dome, HelpCircle, Check, MousePointerClick,
    ChevronDown
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Circle, useMap } from 'react-leaflet';
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
import carreterasGeoJson from '../data/layers/carreteras.json';
import callesGeoJson from '../data/layers/calles.json';

interface Localidad {
    CVE_MUN: string;
    NOM_MUN: string;
    CVE_LOC: string;
    NOM_LOC: string;
    AMBITO: string;
    LATITUD: string;
    LONGITUD: string;
}

interface BufferGroup {
    config: MapLayerConfig;
    items: Array<{
        id: string;
        nombre: string;
        subtitulo?: string;
        isEmpresa: boolean;
        rawCompany?: CompanyFormData;
        badge?: string;
        lat?: number;
        lng?: number;
    }>;
}

const GEOJSON_DATA_MAP: Record<string, any> = {
    estado: estadoGeoJson,
    agua: aguaGeoJson,
    ageb: agebGeoJson,
};

const CARRETERAS_ADMIN_MAP: Record<string, string> = {
    car_federal: 'Federal',
    car_estatal: 'Estatal',
    car_municipal: 'Municipal',
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

// Componente para desactivar eventos interactivos y capturar el clic al seleccionar ubicación
const MapSelectionMode: React.FC<{
    isSelecting: boolean;
    onMapClick: (lat: number, lng: number) => void;
}> = ({ isSelecting, onMapClick }) => {
    const map = useMap();

    useEffect(() => {
        if (!isSelecting) return;

        const style = document.createElement('style');
        style.id = 'leaflet-selection-override';
        style.innerHTML = `
            .leaflet-container {
                cursor: crosshair !important;
            }
            .leaflet-interactive, .leaflet-marker-pane, .leaflet-popup-pane {
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        const handleNativeClick = (e: L.LeafletMouseEvent) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        };

        map.on('click', handleNativeClick);

        return () => {
            map.off('click', handleNativeClick);
            const styleElement = document.getElementById('leaflet-selection-override');
            if (styleElement) {
                styleElement.remove();
            }
        };
    }, [isSelecting, map, onMapClick]);

    return null;
};

const getHexFromColorClass = (colorClass: string): string => {
    if (colorClass.includes('slate') || colorClass.includes('dark')) return '#64748b';
    if (colorClass.includes('stone')) return '#78716c';
    if (colorClass.includes('gray')) return '#6b7280';
    if (colorClass.includes('teal')) return '#14b8a6';
    if (colorClass.includes('cyan')) return '#06b6d4';
    if (colorClass.includes('sky')) return '#0ea5e9';
    if (colorClass.includes('indigo')) return '#6366f1';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('fuchsia')) return '#d946ef';
    if (colorClass.includes('emerald') || colorClass.includes('green')) return '#10b981';
    if (colorClass.includes('amber')) return '#f59e0b';
    if (colorClass.includes('yellow')) return '#eab308';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('red')) return '#ef4444';
    return '#3b82f6';
};

const BASE_URL_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const BASE_URL_LIGHT = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

const posicionInicial: LatLngExpression = [20.8563, -99.8302];
const API_KEY = import.meta.env.VITE_API_KEY;

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

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        resizeObserver.observe(container);

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

// --- Subcomponente para cada Grupo de Acordeón ---
const BufferAccordionItem: React.FC<{
    group: BufferGroup;
    isOpen: boolean;
    onToggle: () => void;
    onLocateMarker: (lat: number, lng: number, markerId: string) => void;
}> = ({ group, isOpen, onToggle, onLocateMarker }) => {
    const IconComponent = ICON_COMPONENTS[group.config.icon] || HelpCircle;
    const hexColor = getHexFromColorClass(group.config.color);

    return (
        <div className="border border-app-border rounded-lg bg-app-bg overflow-hidden transition-all">
            {/* Cabecera del Acordeón */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between p-2 text-left hover:bg-app-button transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="p-1 rounded-full shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${hexColor}20`, color: hexColor }}
                    >
                        <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-app-text truncate">
                        {group.config.label}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-app-muted border border-slate-500/20">
                        {group.items.length}
                    </span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-app-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </button>

            {/* Contenido desplegable del Acordeón */}
            {isOpen && (
                <div className="p-1.5 border-t border-app-border/60 space-y-1 bg-app-card/50">
                    {group.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 text-[11px] p-1.5 rounded bg-app-bg hover:bg-app-button border border-app-border/40 transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-medium truncate text-app-text leading-tight">
                                    {item.nombre}
                                </p>
                                {item.subtitulo && (
                                    <p className="text-[10px] text-app-muted truncate mt-0.5">
                                        {item.subtitulo}
                                    </p>
                                )}
                            </div>

                            {/* Botón Ubicar */}
                            {item.lat !== undefined && item.lng !== undefined && (
                                <button
                                    type="button"
                                    onClick={() => onLocateMarker(item.lat!, item.lng!, item.id)}
                                    className="flex items-center gap-1 text-cyan-500 hover:text-cyan-400 text-[10px] shrink-0 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-cyan-500/10 transition-colors"
                                    title="Centrar y abrir popup en el mapa"
                                >
                                    <MapPin className="w-3 h-3" />
                                    <span>Ubicar</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const MapPage = () => {
    const { theme } = useTheme();

    // Diccionario de referencias para los marcadores
    const markerRefs = useRef<Record<string, L.Marker | null>>({});

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

    // --- Estados del Buffer ---
    const [isBufferToolActive, setIsBufferToolActive] = useState(false);
    const [radioKm, setRadioKm] = useState<number>(1);
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [bufferCenter, setBufferCenter] = useState<{ lat: number; lng: number } | null>(null);

    // Estado para controlar qué acordeón está abierto en el popup del Buffer
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

    const handleConfirmKm = () => {
        if (radioKm > 0) {
            setIsSelectingLocation(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmKm();
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        setBufferCenter({ lat, lng });
        setIsSelectingLocation(false);
        setOpenAccordionId(null);
    };

    const handleClearBuffer = () => {
        setBufferCenter(null);
        setIsSelectingLocation(false);
        setIsBufferToolActive(false);
        setOpenAccordionId(null);
    };

    const handleOpenDetails = (companyData: CompanyFormData) => {
        setViewingCompany(companyData);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setViewingCompany(null);
    };

    const handleLocateMarker = (lat: number, lng: number, markerId: string) => {
        const marker = markerRefs.current[markerId];
        if (!marker) return;

        const map = (marker as any)._map as L.Map | undefined;
        if (!map) return;

        // 1. Cerrar el popup actual (el del buffer)
        map.closePopup();

        // 2. Mover el mapa suavemente al punto de destino
        map.flyTo([lat, lng], 17, { duration: 1.2 });

        // 3. Abrir el popup del marcador objetivo
        setTimeout(() => {
            marker.openPopup();
        }, 300);
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

    // --- Cálculo de elementos dentro del Buffer estructurados por CATALOGO_CAPAS (Marker) ---
    const bufferGroups = useMemo(() => {
        if (!bufferCenter || radioKm <= 0) return { groups: [], total: 0 };

        const centerLatLng = L.latLng(bufferCenter.lat, bufferCenter.lng);
        const maxDistMetros = radioKm * 1000;

        // Filtrar solo configuraciones del catálogo que tengan type === 'Marker'
        const markerConfigs = CATALOGO_CAPAS.filter((c) => c.type === 'Marker');
        const groupsMap: Record<string, BufferGroup> = {};

        let countTotal = 0;

        // 1. Procesar Empresas si la capa está activa
        const empresasCapaId = capaActivaId;
        if (empresasCapaId && capasActivas.includes(empresasCapaId)) {
            const configEmpresa = markerConfigs.find((c) => c.id === empresasCapaId);

            if (configEmpresa) {
                const empresasEnBuffer = empresasConCoordenadas.filter((emp) => {
                    const point = L.latLng(emp.ubicacion.latitud as number, emp.ubicacion.longitud as number);
                    return centerLatLng.distanceTo(point) <= maxDistMetros;
                });

                if (empresasEnBuffer.length > 0) {
                    countTotal += empresasEnBuffer.length;
                    groupsMap[configEmpresa.id] = {
                        config: configEmpresa,
                        items: empresasEnBuffer.map((emp) => ({
                            id: emp._id || emp.nombreComercial,
                            nombre: emp.nombreComercial,
                            subtitulo: emp.ubicacion?.municipio || emp.razonSocial,
                            isEmpresa: true,
                            rawCompany: emp,
                            lat: emp.ubicacion.latitud as number,
                            lng: emp.ubicacion.longitud as number,
                        })),
                    };
                }
            }
        }

        // 2. Procesar Marcadores SIP / Puntos de Interés
        const featuresSip = (sipGeoJson as any).features || [];
        featuresSip.forEach((feature: any, idx: number) => {
            const valorGeografico = feature.properties?.GEOGRAFICO || '';
            const idNormalizado = normalizeKey(valorGeografico);

            if (!capasActivas.includes(idNormalizado)) return;

            const configSip = markerConfigs.find((c) => c.id === idNormalizado);
            if (!configSip) return;

            const coordinates = feature.geometry?.coordinates;
            if (!coordinates || coordinates.length < 2) return;

            const [lng, lat] = coordinates;
            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

            const point = L.latLng(lat, lng);
            if (centerLatLng.distanceTo(point) <= maxDistMetros) {
                countTotal++;

                if (!groupsMap[configSip.id]) {
                    groupsMap[configSip.id] = {
                        config: configSip,
                        items: [],
                    };
                }

                const props = feature.properties || {};
                const cveMun = props.CVE_MUN;
                const cveLoc = props.CVE_LOC;

                // Buscar la localidad en localidadesData
                const infoLocalidad = (localidadesData as Localidad[]).find(
                    (loc) => loc.CVE_MUN === cveMun && loc.CVE_LOC === cveLoc
                );
                const nombreMunicipio = infoLocalidad?.NOM_MUN || (cveMun ? `Mun. ${cveMun}` : undefined);
                const nombreLocalidad = infoLocalidad?.NOM_LOC;

                const esOtros = configSip.category === 'Otros';

                const nombreItem = esOtros
                    ? (props.NOMSERV && props.NOMSERV !== 'Ninguno' ? props.NOMSERV : props.NOMBRE || props.DENOMINACION || nombreLocalidad || valorGeografico)
                    : (props.NOMBRE || props.DENOMINACION || nombreLocalidad || valorGeografico);

                const subtituloItem = esOtros
                    ? (nombreMunicipio || props.CONDICION)
                    : (props.CONDICION || props.NOMSERV || nombreMunicipio);

                groupsMap[configSip.id].items.push({
                    id: feature.id || `sip-${idNormalizado}-${idx}`,
                    nombre: nombreItem,
                    subtitulo: subtituloItem,
                    isEmpresa: false,
                    badge: valorGeografico,
                    lat,
                    lng,
                });
            }
        });

        return {
            groups: Object.values(groupsMap),
            total: countTotal,
        };
    }, [bufferCenter, radioKm, empresasConCoordenadas, capasActivas, capaActivaId]);

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-app-bg overflow-hidden transition-colors duration-200">
            <LayerFilterMap
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                capasActivas={capasActivas}
                onToggleCapa={toggleCapa}
            />

            {/* Panel de Buffer */}
            <div className="absolute top-4 left-16 z-100 flex items-center gap-2 bg-app-card p-2 rounded-lg shadow-xl border border-app-border">
                <button
                    onClick={() => {
                        const nuevoEstado = !isBufferToolActive;
                        setIsBufferToolActive(nuevoEstado);
                        if (!nuevoEstado) {
                            setIsSelectingLocation(false);
                            setBufferCenter(null);
                            setOpenAccordionId(null);
                        }
                    }}
                    title="Herramienta de Radio Buffer"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-xs transition-all cursor-pointer ${isBufferToolActive
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-app-bg text-app-text hover:bg-app-button border border-app-border'
                        }`}
                >
                    <Radius className="w-4 h-4" />
                    <span>Buffer</span>
                </button>

                {isBufferToolActive && (
                    <div className="flex items-center gap-2 pl-2 border-l border-app-border">
                        <label className="text-xs text-app-muted whitespace-nowrap">Radio (km):</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.5"
                            value={radioKm}
                            onChange={(e) => setRadioKm(parseFloat(e.target.value) || 0)}
                            onKeyDown={handleKeyDown}
                            className="w-20 px-2 py-1 text-xs rounded border border-app-border bg-app-bg text-app-text focus:outline-none focus:border-cyan-500"
                            placeholder="Km..."
                        />

                        <button
                            type="button"
                            onClick={handleConfirmKm}
                            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${isSelectingLocation
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500'
                                }`}
                            title="Confirmar radio y hacer clic en el mapa"
                        >
                            <Check className="w-4 h-4" />
                        </button>

                        {isSelectingLocation && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 animate-pulse bg-amber-500/10 px-2 py-1 rounded">
                                <MousePointerClick className="w-3.5 h-3.5" />
                                Haz clic en el mapa
                            </span>
                        )}

                        {(bufferCenter || isSelectingLocation) && (
                            <button
                                onClick={handleClearBuffer}
                                title="Eliminar buffer"
                                className="p-1 rounded text-app-muted hover:text-red-500 hover:bg-app-button transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Mapa de Leaflet */}
            <MapContainer
                center={posicionInicial}
                zoom={8.5}
                maxZoom={22}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <ResizeMap />

                <MapSelectionMode
                    isSelecting={isSelectingLocation}
                    onMapClick={handleMapClick}
                />

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

                {/* Capas GeoJSON Vectoriales */}
                {CATALOGO_CAPAS.filter(
                    (capa: MapLayerConfig) => capa.type !== 'Marker' && capa.layer && capasActivas.includes(capa.id)
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

                {/* Carreteras */}
                {['car_federal', 'car_estatal', 'car_municipal'].map((layerId) => {
                    if (!capasActivas.includes(layerId)) return null;

                    const adminTipo = CARRETERAS_ADMIN_MAP[layerId];
                    const configCapa = CATALOGO_CAPAS.find((c) => c.id === layerId);
                    const strokeColor = getHexFromColorClass(configCapa?.color || 'text-red-500');

                    const filteredFeatures = (carreterasGeoJson as any).features?.filter(
                        (feature: any) => feature.properties?.ADMINISTRA === adminTipo
                    );

                    if (!filteredFeatures || filteredFeatures.length === 0) return null;

                    const geoJsonFiltered = {
                        ...(carreterasGeoJson as any),
                        features: filteredFeatures,
                    };

                    return (
                        <GeoJSON
                            key={layerId}
                            data={geoJsonFiltered as any}
                            style={{
                                color: strokeColor,
                                weight: layerId === 'car_federal' ? 3.5 : 2.5,
                                opacity: 0.85,
                            }}
                            onEachFeature={(feature, layer) => {
                                const props = feature.properties || {};
                                layer.bindPopup(`
                                    <div class="p-1 space-y-1 text-app-text min-w-44">
                                        <div class="flex justify-start mb-1">
                                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                Carretera ${props.ADMINISTRA || adminTipo}
                                            </span>
                                        </div>
                                        <h4 class="font-bold text-sm leading-tight text-app-text">
                                            ${props.NOMBRE || 'Sin Nombre'}
                                        </h4>
                                        <div class="pt-1 text-[11px] border-t border-app-border space-y-0.5 text-app-muted">
                                            ${props.CARRILES ? `<p><span class="font-medium text-app-text">Carriles:</span> ${props.CARRILES}</p>` : ''}
                                            ${props.PEAJE ? `<p><span class="font-medium text-app-text">Peaje:</span> ${props.PEAJE}</p>` : ''}
                                        </div>
                                    </div>
                                `);

                                layer.on({
                                    mouseover: (e: any) => {
                                        e.target.setStyle({ weight: (layerId === 'car_federal' ? 3.5 : 2.5) + 2, opacity: 1 });
                                    },
                                    mouseout: (e: any) => {
                                        e.target.setStyle({ weight: layerId === 'car_federal' ? 3.5 : 2.5, opacity: 0.85 });
                                    },
                                });
                            }}
                        />
                    );
                })}

                {/* Calles */}
                {['c_avenida', 'c_boulevard', 'c_calle', 'c_otros'].map((layerId) => {
                    if (!capasActivas.includes(layerId)) return null;

                    const configCapa = CATALOGO_CAPAS.find((c) => c.id === layerId);
                    const strokeColor = getHexFromColorClass(configCapa?.color || 'text-teal-500');

                    const filteredFeatures = (callesGeoJson as any).features?.filter((feature: any) => {
                        const tipoVial = feature.properties?.TIPO_VIAL || '';
                        if (layerId === 'c_avenida') return tipoVial === 'Avenida';
                        if (layerId === 'c_boulevard') return tipoVial === 'Boulevard';
                        if (layerId === 'c_calle') return tipoVial === 'Calle';
                        if (layerId === 'c_otros') {
                            return !['Avenida', 'Boulevard', 'Calle'].includes(tipoVial);
                        }
                        return false;
                    });

                    if (!filteredFeatures || filteredFeatures.length === 0) return null;

                    const geoJsonFiltered = {
                        ...(callesGeoJson as any),
                        features: filteredFeatures,
                    };

                    const strokeWidth = layerId === 'c_boulevard' || layerId === 'c_avenida' ? 2.5 : 1.5;

                    return (
                        <GeoJSON
                            key={layerId}
                            data={geoJsonFiltered as any}
                            style={{
                                color: strokeColor,
                                weight: strokeWidth,
                                opacity: 0.8,
                            }}
                            onEachFeature={(feature, layer) => {
                                const props = feature.properties || {};
                                layer.bindPopup(`
                                    <div class="p-1 space-y-1 text-app-text min-w-44">
                                        <div class="flex justify-start mb-1">
                                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                ${props.TIPO_VIAL || 'Vía Urbana'}
                                            </span>
                                        </div>
                                        <h4 class="font-bold text-sm leading-tight text-app-text">
                                            ${props.NOMBRE || 'Sin Nombre'}
                                        </h4>
                                        <div class="pt-1 text-[11px] border-t border-app-border space-y-0.5 text-app-muted">
                                            ${(props.COND_PAV && props.COND_PAV !== 'N/A') ? `<p><span class="font-medium text-app-text">Pavimento:</span> ${props.COND_PAV}</p>` : ''}
                                            ${(props.RECUBRI && props.RECUBRI !== 'N/A') ? `<p><span class="font-medium text-app-text">Recubrimiento:</span> ${props.RECUBRI}</p>` : ''}
                                        </div>
                                    </div>
                                `);

                                layer.on({
                                    mouseover: (e: any) => {
                                        e.target.setStyle({ weight: strokeWidth + 2, opacity: 1 });
                                    },
                                    mouseout: (e: any) => {
                                        e.target.setStyle({ weight: strokeWidth, opacity: 0.8 });
                                    },
                                });
                            }}
                        />
                    );
                })}

                {/* Marcadores SIP */}
                {(() => {
                    const features = (sipGeoJson as any).features || [];

                    return features.map((feature: any, originalIdx: number) => {
                        const valorGeografico = feature.properties?.GEOGRAFICO || '';
                        const idNormalizado = normalizeKey(valorGeografico);

                        if (!capasActivas.includes(idNormalizado)) return null;

                        const coordinates = feature.geometry?.coordinates;
                        if (!coordinates || coordinates.length < 2) return null;

                        const [lng, lat] = coordinates;
                        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null;

                        const markerId = feature.id || `sip-${idNormalizado}-${originalIdx}`;

                        const cveMun = feature.properties?.CVE_MUN;
                        const cveLoc = feature.properties?.CVE_LOC;

                        const infoLocalidad = (localidadesData as Localidad[]).find(
                            (loc) => loc.CVE_MUN === cveMun && loc.CVE_LOC === cveLoc
                        );

                        const nombreMunicipio = infoLocalidad?.NOM_MUN || `Mun. ${cveMun || 'N/A'}`;
                        const nombreLocalidad = infoLocalidad?.NOM_LOC || feature.properties?.NOMBRE || feature.properties?.DENOMINACION || `Loc. ${cveLoc || 'N/A'}`;

                        const configCapa = CATALOGO_CAPAS.find((c) => c.id === idNormalizado);
                        const markerIcon = createDynamicMarkerIcon(
                            configCapa?.color || 'text-red-500',
                            configCapa?.icon
                        );

                        return (
                            <Marker
                                key={markerId}
                                ref={(ref) => {
                                    markerRefs.current[markerId] = ref;
                                }}
                                position={[lat, lng]}
                                icon={markerIcon}
                            >
                                <Popup className={theme}>
                                    <div className="p-1 space-y-1 text-app-text min-w-40">
                                        <div className="flex justify-start mb-2">
                                            <span
                                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-block mb-1"
                                                style={{
                                                    color: getHexFromColorClass(configCapa?.color || 'text-red-500'),
                                                    backgroundColor: `${getHexFromColorClass(configCapa?.color || 'text-red-500')}1A`,
                                                    borderColor: `${getHexFromColorClass(configCapa?.color || 'text-red-500')}33`,
                                                }}
                                            >
                                                {valorGeografico}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-sm leading-tight">
                                            {nombreLocalidad}
                                        </h4>

                                        <p className="text-xs text-app-muted uppercase">
                                            {nombreMunicipio}
                                        </p>

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

                {/* Marcadores Empresas */}
                {(capasActivas.includes('empresas') || capasActivas.includes('empresasDirectorio')) &&
                    empresasConCoordenadas.map((empresa) => {
                        const lat = empresa.ubicacion.latitud as number;
                        const lng = empresa.ubicacion.longitud as number;
                        const empresaId = empresa._id || `${lat}-${lng}`;

                        return (
                            <Marker
                                key={empresaId}
                                ref={(ref) => { markerRefs.current[empresaId] = ref; }}
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

                {/* Renderizado del Círculo del Buffer y Popup con Acordeón por Capa */}
                {bufferCenter && radioKm > 0 && (
                    <Circle
                        center={[bufferCenter.lat, bufferCenter.lng]}
                        radius={radioKm * 1000}
                        pathOptions={{
                            color: '#06b6d4',
                            fillColor: '#06b6d4',
                            fillOpacity: 0.25,
                            weight: 2,
                            dashArray: '4, 4',
                        }}
                    >
                        <Popup className={theme}>
                            <div className="p-1 min-w-68 max-w-76 max-h-80 overflow-y-auto space-y-2.5 text-app-text font-sans custom-scrollbar">
                                {/* Encabezado Fijo */}
                                <div className="border-b border-app-border pb-2 sticky top-0 bg-app-card z-10 pt-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-cyan-500 font-bold text-xs uppercase tracking-wide">
                                            <Radius className="w-4 h-4" />
                                            <span>Área del Buffer</span>
                                        </div>
                                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[10px] font-semibold rounded-full border border-cyan-500/20">
                                            {radioKm} km
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-app-muted mt-1">
                                        Total de elementos encontrados: <strong className="text-app-text">{bufferGroups.total}</strong>
                                    </p>
                                </div>

                                {/* Lista de Grupos Desplegables (Acordeón) */}
                                {bufferGroups.total === 0 ? (
                                    <p className="text-xs text-app-muted italic text-center py-3">
                                        No hay elementos ni capas de marcadores activas dentro de este radio.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {bufferGroups.groups.map((group) => (
                                            <BufferAccordionItem
                                                key={group.config.id}
                                                group={group}
                                                isOpen={openAccordionId === group.config.id}
                                                onToggle={() =>
                                                    setOpenAccordionId((prev) =>
                                                        prev === group.config.id ? null : group.config.id
                                                    )
                                                }
                                                onLocateMarker={handleLocateMarker}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Circle>
                )}
            </MapContainer>

            <CompanyDetailsModal
                isOpen={isDetailsOpen}
                company={viewingCompany}
                onClose={handleCloseDetails}
            />
        </div>
    );
};
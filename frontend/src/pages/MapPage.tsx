// src/pages/MapPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { Layers, X, FolderUp } from 'lucide-react';
import L from 'leaflet';
import datosGeoJson from '../data/qro_mun.json';
import 'leaflet/dist/leaflet.css';

// --- Fix de Iconos para Leaflet en Vite/TypeScript ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const BASE_URL_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const BASE_URL_LIGHT = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';

const posicionInicial: LatLngExpression = [20.8563, -99.8302];
const BASE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const API_KEY = import.meta.env.VITE_API_KEY;

// Catálogo estático de capas del dashboard económico
const catalogos = [
    { id: 'municipios', label: 'Municipios de Qro.', color: 'bg-fuchsia-600' },
    { id: 'pib', label: 'PIB Estatal / Regional', color: 'bg-fuchsia-500' },
    { id: 'densidad', label: 'Densidad Empresarial', color: 'bg-cyan-500' },
    { id: 'empleo', label: 'Empleo por Sector', color: 'bg-emerald-500' },
    { id: 'nodos', label: 'Nodos Logísticos', color: 'bg-amber-500' },
];

// Componente auxiliar para corregir el cálculo de dimensiones en Leaflet
const ResizeMap = () => {
    const map = useMap();

    useEffect(() => {
        // Redimensionar cuando el componente carga
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300); // 300ms le da tiempo suficiente al layout flex de establecerse

        // Redimensionar automáticamente si la ventana cambia de tamaño
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

    // URL base según el tema activo
    // Estilo claro

    const BASE_URL = theme === 'dark' ? BASE_URL_DARK : BASE_URL_LIGHT;
    const urlMapa = API_KEY ? `${BASE_URL}?api_key=${API_KEY}` : BASE_URL;

    // Estados
    const [capasActivas, setCapasActivas] = useState<string[]>(['municipios']);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función para alternar capas
    const toggleCapa = (id: string) => {
        setCapasActivas((prev) =>
            prev.includes(id) ? prev.filter((capa) => capa !== id) : [...prev, id]
        );
    };

    const handleFileChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;
        console.log("Archivo espacial seleccionado:", archivo.name);
    };

    // Estilo base elegante para los municipios
    const estiloMunicipios = {
        color: theme === 'dark' ? '#00f2fe' : '#2563eb',       // Azul cian en oscuro, azul rey en claro
        weight: 1.5,
        opacity: 0.7,
        fillColor: theme === 'dark' ? '#00f2fe' : '#3b82f6',
        fillOpacity: theme === 'dark' ? 0.1 : 0.15
    };

    const alCargarCadaMunicipio = (feature: any, layer: any) => {
        const { NOMGEO, CVEGEO } = feature.properties || {};
        layer.bindPopup(`
            <div style="color: #070a10; font-family: sans-serif; padding: 2px;">
                <h4 style="margin: 0 0 5px 0; color: #00b4db; font-size: 14px;">
                    Municipio: <strong>${NOMGEO || 'Desconocido'}</strong>
                </h4>
                <p style="margin: 0; font-size: 12px; color: #555;">
                    Clave Geográfica: <code>${CVEGEO || 'N/A'}</code>
                </p>
            </div>
        `);
        layer.on({
            mouseover: (e: any) => {
                e.target.setStyle({ fillOpacity: 0.4, weight: 2.5 });
            },
            mouseout: (e: any) => {
                e.target.setStyle(estiloMunicipios);
            }
        });
    };

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-[#070a10] overflow-hidden">

            {/* Botón flotante para abrir el menú de capas */}
            <button
                onClick={() => setIsMenuOpen(true)}
                className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-slate-800 text-white font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 hover:bg-slate-700 hover:border-cyan-500 transition-all"
            >
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Capas y Filtros</span>
            </button>

            {/* Menú Lateral de Capas (Overlay + Drawer) */}
            {isMenuOpen && (
                <div
                    className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)} // Cierra al presionar fuera
                />
            )}

            <aside
                className={`absolute top-0 right-0 h-full w-80 bg-[#0d131f] border-l border-gray-800 p-6 flex flex-col gap-6 z-[2001] shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Cabecera del Panel */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                            Panel de Control
                        </h2>
                        <h3 className="text-lg font-bold text-white">Catálogo de Capas</h3>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Listado de Capas Interactivas */}
                <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
                    {catalogos.map((capa) => {
                        const activa = capasActivas.includes(capa.id);
                        return (
                            <button
                                key={capa.id}
                                onClick={() => toggleCapa(capa.id)}
                                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 outline-none group ${activa
                                    ? 'bg-[#161f30] border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                                    : 'bg-[#090d16] border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110 ${capa.color}`}></span>
                                    <span className="text-sm font-medium tracking-wide">{capa.label}</span>
                                </div>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${activa ? 'bg-cyan-500 border-cyan-500 text-[#0d131f]' : 'border-gray-600 group-hover:border-gray-400'
                                    }`}>
                                    {activa && <span className="text-[10px] font-black">✓</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Cargar Archivos Espaciales */}
                <div className="border-t border-gray-800/80 pt-5">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".kml,.kmz,.geojson,.json"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-[#090d16] border border-dashed border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                    >
                        <FolderUp className="w-6 h-6" />
                        <span className="font-medium text-sm">Subir archivo KML/GeoJSON</span>
                        <span className="text-[10px] text-gray-500 font-mono">Límite: 20MB</span>
                    </button>
                </div>

                {/* Filtro Temporal */}
                <div className="border-t border-gray-800/80 pt-5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2 font-mono">
                        Filtro Temporal
                    </label>
                    <div className="bg-[#090d16] p-3.5 rounded-xl border border-gray-800">
                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                            <span>Año de Análisis:</span>
                            <span className="text-cyan-400 font-bold drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">2026</span>
                        </div>
                        <input
                            type="range"
                            min="2015"
                            max="2026"
                            defaultValue="2026"
                            className="w-full accent-cyan-500 bg-gray-800 rounded-lg appearance-none h-1 cursor-pointer"
                        />
                    </div>
                </div>
            </aside>

            {/* Contenedor del Mapa */}
            <MapContainer
                center={posicionInicial}
                zoom={8.5}
                maxZoom={22} // 👈 1. Permite ampliar la vista hasta el nivel 22
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <ResizeMap />

                <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    url={urlMapa}
                    maxNativeZoom={18} // 👈 2. Indica que el servidor solo entrega imágenes hasta nivel 18
                    maxZoom={22}       // 👈 3. Le permite a Leaflet escalar digitalmente la imagen para zoom tipo "calle"
                />

                <Marker position={posicionInicial}>
                    <Popup>Mapa base oscuro en <strong>Querétaro</strong>.</Popup>
                </Marker>

                {capasActivas.includes('municipios') && (
                    <GeoJSON
                        data={datosGeoJson as any}
                        style={estiloMunicipios}
                        onEachFeature={alCargarCadaMunicipio}
                    />
                )}
            </MapContainer>
        </div>
    );
};
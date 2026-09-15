// src/components/CompanyDetailsModal.tsx
import React, { useContext } from 'react';
import { X, Building2, MapPin, Phone, Mail, ShieldCheck, Tag, Users, Award, FileText, Calendar, Hash, Edit2, Trash2, Globe, Briefcase, ExternalLink } from 'lucide-react';
import { saveAs } from 'file-saver';
import { type CompanyFormData } from '../interfaces/company.interface';
import { AuthContext } from '../context/AuthContext';
import { CompaniesPDFDocument } from './CompaniesPDFDocument';
import { SECTORES_CONFIG, type ColorTheme } from './CompanyForm';

interface CompanyDetailsModalProps {
    company: CompanyFormData | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (company: CompanyFormData) => void;
    onDelete?: (id: string, nombre: string) => void;
}

const COLOR_CLASSES: Record<ColorTheme, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({ company, isOpen, onClose, onEdit, onDelete }) => {
    const { user } = useContext(AuthContext);

    if (!isOpen || !company) return null;

    const isAdmin = user?.rol === 'admin';
    const canEdit = user?.rol === 'admin' || user?.rol === 'editor';
    const isAuthenticated = Boolean(user);

    const {
        _id,
        nombreComercial,
        razonSocial,
        rfc,
        sitioWeb,
        tamanoEmpresa,
        activa,
        ubicacion,
        contactos,
        informacionEmpresa,
        etiquetas,
        presentacionComercial,
        anioInicio,
        retosActuales,
        apoyosYNecesidades,
        correoElectronico
    } = company;

    // Helper para construir la URL de Google Maps
    const getGoogleMapsUrl = (): string | null => {
        if (!ubicacion) return null;

        const hasLat = ubicacion.latitud !== undefined && ubicacion.latitud !== null && ubicacion.latitud !== '';
        const hasLng = ubicacion.longitud !== undefined && ubicacion.longitud !== null && ubicacion.longitud !== '';

        // Opción A: Usar coordenadas si están disponibles
        if (hasLat && hasLng) {
            return `https://www.google.com/maps/search/?api=1&query=${ubicacion.latitud},${ubicacion.longitud}`;
        }

        // Opción B: Construir búsqueda basada en la dirección física
        const partesDireccion = [
            ubicacion.direccion,
            ubicacion.colonia,
            ubicacion.municipio,
            ubicacion.estado,
            ubicacion.codigoPostal ? `C.P. ${ubicacion.codigoPostal}` : '',
            'México'
        ].filter(Boolean).join(', ');

        if (partesDireccion.trim()) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partesDireccion)}`;
        }

        return null;
    };

    const googleMapsUrl = getGoogleMapsUrl();

    const productosPorSector = informacionEmpresa
        ? SECTORES_CONFIG.map((sector) => {
            const sectorData = (informacionEmpresa as any)[sector.keyName];
            const lista: string[] = sectorData?.lista || [];
            const otro: string[] = sectorData?.otroEspecifique ? [sectorData.otroEspecifique] : [];
            return {
                title: sector.title,
                colorTheme: sector.colorTheme,
                productos: [...lista, ...otro],
            };
        }).filter((grupo) => grupo.productos.length > 0)
        : [];

    const handleDownloadPDF = async () => {
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const doc = <CompaniesPDFDocument company={company} />;
            const blob = await pdf(doc).toBlob();
            const nombreLimpio = (nombreComercial || 'Empresa').replace(/[^a-zA-Z0-9_-]/g, '_');
            saveAs(blob, `Ficha_Tecnica_${nombreLimpio}.pdf`);
        } catch (error) {
            console.error('Error generando el PDF:', error);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">

                {/* Encabezado */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/80 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{nombreComercial || 'Detalles de la Empresa'}</h2>
                            <p className="text-xs text-slate-400">{razonSocial || 'Sin razón social'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cuerpo con Scroll */}
                <div className="max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] scrollbar-none p-6 space-y-6">

                    {/* Fila 1: Resumen e Identificación */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/60">
                        {isAdmin && _id && (
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">ID (Sistema)</span>
                                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs truncate">
                                    <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="truncate">{_id}</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">RFC</span>
                            <div className="flex items-center gap-1.5 text-white font-medium">
                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                <span>{rfc || 'N/A'}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tamaño</span>
                            <span className="inline-block px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-full">
                                {tamanoEmpresa || 'No definido'}
                            </span>
                        </div>

                        {canEdit && (
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Estatus</span>
                                <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${activa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {activa ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Información General */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" /> Información General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-sm">
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                <strong className="text-slate-400">Correo Principal:</strong> {correoElectronico || 'N/A'}
                            </p>
                            <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <strong className="text-slate-400">Año de Inicio:</strong> {anioInicio || 'N/A'}
                            </p>
                            {presentacionComercial && (
                                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                        <strong className="text-slate-400">Presentación Comercial:</strong>
                                    </div>
                                    <a
                                        href={presentacionComercial.startsWith('http') ? presentacionComercial : `https://${presentacionComercial}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-400 hover:underline break-all pl-6 block"
                                    >
                                        {presentacionComercial}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ubicación y Sitio Web */}
                    <div className="space-y-3 border-t border-slate-700/60 pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-400" /> Ubicación
                            </h3>

                            {/* Botón "Ver Ubicación" */}
                            {googleMapsUrl && (
                                <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-colors"
                                    title="Ver ubicación en Google Maps"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Ver ubicación</span>
                                </a>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-sm">
                            <div>
                                <p><strong className="text-slate-400">Dirección:</strong> {ubicacion?.direccion || 'N/A'}</p>
                                <p><strong className="text-slate-400">Colonia:</strong> {ubicacion?.colonia || 'N/A'}</p>
                                <p><strong className="text-slate-400">C.P.:</strong> {ubicacion?.codigoPostal || 'N/A'}</p>
                            </div>
                            <div>
                                <p><strong className="text-slate-400">Municipio:</strong> {ubicacion?.municipio || 'N/A'}</p>
                                <p><strong className="text-slate-400">Estado:</strong> {ubicacion?.estado || 'N/A'}</p>
                                <p><strong className="text-slate-400">Parque Industrial:</strong> {ubicacion?.parqueIndustrial || 'N/A'}</p>
                            </div>
                            {sitioWeb && (
                                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                                        <strong className="text-slate-400">Sitio Web:</strong>
                                    </div>
                                    <a href={sitioWeb.startsWith('http') ? sitioWeb : `https://${sitioWeb}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline pl-6 block break-all">
                                        {sitioWeb}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contactos por Área */}
                    {contactos && (
                        (() => {
                            const listaContactos = [
                                { titulo: 'Director General', data: contactos.directorGeneral },
                                { titulo: 'Compras', data: contactos.compras },
                                { titulo: 'Ventas', data: contactos.ventas },
                                { titulo: 'Recursos Humanos', data: contactos.recursosHumanos },
                            ].filter(item => item.data?.nombreCompleto);

                            if (listaContactos.length === 0) return null;

                            return (
                                <div className="space-y-3 border-t border-slate-700/60 pt-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-400" /> Contactos
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {listaContactos.map((item, index) => {
                                            const nombreContacto = item.data?.nombreCompleto || 'contacto';
                                            const empresaNombre = nombreComercial || 'la empresa';

                                            const telefonoCrudo = item.data?.celularWhatsapp || item.data?.telefono || '';
                                            const telefonoLimpio = telefonoCrudo.replace(/\D/g, '');

                                            const textoWhatsapp = encodeURIComponent(
                                                `Hola ${nombreContacto}, te escribo de SEDESU en relación a ${empresaNombre}.`
                                            );
                                            const urlWhatsapp = telefonoLimpio ? `https://wa.me/${telefonoLimpio}?text=${textoWhatsapp}` : '';

                                            const correo = item.data?.correoElectronico;

                                            return (
                                                <div key={index} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-sm space-y-1.5">
                                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-2">{item.titulo}</span>
                                                    <p className="text-white font-medium">{nombreContacto}</p>

                                                    {'cargo' in (item.data || {}) && (item.data as any)?.cargo && (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <span>{(item.data as any).cargo}</span>
                                                        </p>
                                                    )}

                                                    {correo && (
                                                        <div className="flex items-center gap-1.5 text-xs pt-1">
                                                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <a
                                                                href={`mailto:${correo}?subject=Contacto%20desde%20SEDESU%20-%20${encodeURIComponent(empresaNombre)}`}
                                                                className="text-blue-400 hover:underline truncate"
                                                            >
                                                                {correo}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {telefonoCrudo && (
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            {urlWhatsapp ? (
                                                                <a
                                                                    href={urlWhatsapp}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                                                                    title="Enviar mensaje de WhatsApp"
                                                                >
                                                                    <span>{telefonoCrudo}</span>
                                                                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1 rounded text-emerald-300">WhatsApp</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400">{telefonoCrudo}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    {/* Información Industrial */}
                    {informacionEmpresa && (
                        <div className="space-y-3 border-t border-slate-700/60 pt-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-blue-400" /> Información Industrial
                            </h3>
                            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">

                                <p><strong className="text-slate-400">Productos que fabrica:</strong> {informacionEmpresa.productosFabrica || 'N/A'}</p>
                                <p><strong className="text-slate-400">Principales Clientes:</strong> {informacionEmpresa.principalesClientes || 'N/A'}</p>
                                <p><strong className="text-slate-400">Sector Principal:</strong> {informacionEmpresa.principalSectorAtiende || 'N/A'}</p>

                                {informacionEmpresa.sectoresPertenece?.lista && informacionEmpresa.sectoresPertenece.lista.length > 0 && (
                                    <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Sectores a los que pertenece</span>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {informacionEmpresa.sectoresPertenece.lista.map((sec, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                                                    {sec}
                                                </span>
                                            ))}
                                            {informacionEmpresa.sectoresPertenece.otroEspecifique && (
                                                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                                                    Otro: {informacionEmpresa.sectoresPertenece.otroEspecifique}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {productosPorSector.length > 0 && (
                                    <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Productos o Servicios</span>
                                        <div className="space-y-2.5">
                                            {productosPorSector.map((grupo) => (
                                                <div key={grupo.title}>
                                                    <span className="text-[11px] font-medium text-slate-500 block mb-1">{grupo.title}</span>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {grupo.productos.map((prod, idx) => (
                                                            <span key={idx} className={`px-2.5 py-1 rounded-md border ${COLOR_CLASSES[grupo.colorTheme]}`}>
                                                                {prod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {informacionEmpresa.certificaciones?.lista && informacionEmpresa.certificaciones.lista.length > 0 && (
                                    <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Certificaciones</span>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {informacionEmpresa.certificaciones.lista.map((cert, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                                                    {cert}
                                                </span>
                                            ))}
                                            {informacionEmpresa.certificaciones.otroEspecifique && (
                                                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                                                    Otra: {informacionEmpresa.certificaciones.otroEspecifique}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {informacionEmpresa.porcentajeExportaciones !== '' && (
                                    <div className="pt-2 border-t border-slate-800 text-xs">
                                        <span className="text-slate-400 font-semibold block">Exportación:</span>
                                        <span>
                                            {informacionEmpresa.porcentajeExportaciones}% | Destinos: {informacionEmpresa.destinoExportaciones?.join(', ') || 'N/A'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Retos y Apoyos */}
                    {(retosActuales || apoyosYNecesidades) && (
                        <div className="space-y-3 border-t border-slate-700/60 pt-4">
                            <h3 className="text-base font-bold text-white">Retos y Apoyos Requeridos</h3>
                            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                                {retosActuales && <p><strong className="text-slate-400">Retos Actuales:</strong> {retosActuales}</p>}
                                {apoyosYNecesidades?.tipos && apoyosYNecesidades.tipos.length > 0 && (
                                    <div>
                                        <strong className="text-slate-400 block mb-1">Apoyos Requeridos:</strong>
                                        <div className="flex flex-wrap gap-1.5">
                                            {apoyosYNecesidades.tipos.map((apoyo, idx) => (
                                                <span key={idx} className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                                                    {apoyo}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Etiquetas */}
                    {isAuthenticated && etiquetas && etiquetas.length > 0 && (
                        <div className="border-t border-slate-700/60 pt-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-blue-400" /> Etiquetas / Tags
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {etiquetas.map((tag, idx) => (
                                    <span key={idx} className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Pie del Modal */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Descargar Ficha Técnica PDF</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {canEdit && onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(company);
                                }}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>Editar</span>
                            </button>
                        )}

                        {canEdit && onDelete && _id && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onDelete(_id, nombreComercial);
                                }}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Eliminar</span>
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
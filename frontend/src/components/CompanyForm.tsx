// src/components/CompanyForm.tsx
import { useState, useEffect, type KeyboardEvent } from 'react';
import Swal from 'sweetalert2';
import api from '../api/axios';
import { CheckCircle, X, ChevronDown, Building2, MapPin, Users, Briefcase, HelpCircle, Copy, Check, ToggleLeft, ToggleRight, FileText, Plus, Minus, Trash2, Upload } from 'lucide-react';
import { SectorCheckboxGroup } from './SectorCheckboxGroup';
import {
    OPCIONES_TAMANO,
    OPCIONES_OPERACIONES,
    OPCIONES_SUMINISTRO,
    OPCIONES_CERTIFICACIONES,
    OPCIONES_SECTORES,
    OPCIONES_SECTOR_PLASTICOS,
    OPCIONES_SECTOR_METALMECANICO,
    OPCIONES_SECTOR_ELECTRICA_ELECTRONICA,
    OPCIONES_SECTOR_EMPAQUE,
    OPCIONES_SECTOR_TI_I40,
    OPCIONES_SECTOR_TEXTIL,
    OPCIONES_SECTOR_SERVICIOS_ESPECIALIZADOS,
    OPCIONES_SECTOR_MROS,
    OPCIONES_SECTOR_MINERO,
    OPCIONES_APOYOS,
    TIPOS_DOCUMENTO
} from '../data/companyCatalog';
import { toast } from 'sonner';
import { OPCIONES_PAISES } from '../data/countryCatalog';
import { ESTADOS_MEXICO, getMunicipiosByEstado } from '../data/locationCatalog';
import {
    RFC_REGEX,
    EMAIL_REGEX,
    PHONE_REGEX,
    normalizeText,
    sanitizePhoneNumber,
    formatFileSize,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_ACCEPT,
    ALLOWED_ALL_EXTENSIONS,
    ALLOWED_ALL_ACCEPT,
    isImageType,
    extSee,
    getFileIconAndColor
} from '../utils/formUtils';
import { type CompanyFormData, type TipoEmpresa } from '../interfaces/company.interface';
import { useCompanyStore } from '../stores/useCompanyStore';
import { viewCompanyDocument } from '../helpers/documentHelper';

interface CompanyFormProps {
    initialValues?: Partial<CompanyFormData>;
    initialData?: Partial<CompanyFormData>;
    isEditing?: boolean;
    isPublicRegistration?: boolean;
    defaultTipoEmpresa?: 'Empresa directorio' | 'Empresa incompleta';
    onSubmit?: (data: CompanyFormData) => Promise<void> | void;
    onCancel?: () => void;
    submitButtonText?: string;
}

export type ColorTheme = 'blue' | 'purple' | 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'orange' | 'yellow';

interface SectorConfig {
    id: string;
    title: string;
    colorTheme: ColorTheme;
    options: string[];
    keyName: keyof CompanyFormData['informacionEmpresa'];
    matchSectores: string[];
}

export const SECTORES_CONFIG: SectorConfig[] = [
    {
        id: 'plasticos',
        title: 'Sector Plásticos',
        colorTheme: 'blue',
        options: OPCIONES_SECTOR_PLASTICOS,
        keyName: 'sectorPlasticos',
        matchSectores: ['Plásticos'],
    },
    {
        id: 'metalmecanico',
        title: 'Sector Metalmecánico',
        colorTheme: 'purple',
        options: OPCIONES_SECTOR_METALMECANICO,
        keyName: 'sectorMetalmecanico',
        matchSectores: ['Metalmecánico'],
    },
    {
        id: 'electricaElectronica',
        title: 'Sector eléctrica-electrónica',
        colorTheme: 'amber',
        options: OPCIONES_SECTOR_ELECTRICA_ELECTRONICA,
        keyName: 'sectorElectricaElectronica',
        matchSectores: ['Eléctrica-Electrónica'],
    },
    {
        id: 'empaque',
        title: 'Sector empaque',
        colorTheme: 'emerald',
        options: OPCIONES_SECTOR_EMPAQUE,
        keyName: 'sectorEmpaque',
        matchSectores: ['Empaque'],
    },
    {
        id: 'tiI40',
        title: 'Sector de tecnologías e información',
        colorTheme: 'cyan',
        options: OPCIONES_SECTOR_TI_I40,
        keyName: 'sectorTiI40',
        matchSectores: ['TI e I4.0'],
    },
    {
        id: 'textil',
        title: 'Sector textil',
        colorTheme: 'rose',
        options: OPCIONES_SECTOR_TEXTIL,
        keyName: 'sectorTextil',
        matchSectores: ['Textil'],
    },
    {
        id: 'serviciosEspecializados',
        title: 'Sector servicios especializados',
        colorTheme: 'indigo',
        options: OPCIONES_SECTOR_SERVICIOS_ESPECIALIZADOS,
        keyName: 'sectorServiciosEspecializados',
        matchSectores: ['Servicios', 'Hospitalario', 'Biotecnología', 'Logística'],
    },
    {
        id: 'mros',
        title: 'Sector MROS',
        colorTheme: 'orange',
        options: OPCIONES_SECTOR_MROS,
        keyName: 'sectorMros',
        matchSectores: ['Aeroespacial', 'Automotriz', 'Energético'],
    },
    {
        id: 'minero',
        title: 'Sector minero',
        colorTheme: 'yellow',
        options: OPCIONES_SECTOR_MINERO,
        keyName: 'sectorMinero',
        matchSectores: ['Minero'],
    },
];

export const CompanyForm = ({
    initialValues,
    initialData,
    isEditing = false,
    isPublicRegistration = false,
    defaultTipoEmpresa,
    onSubmit,
    onCancel,
    submitButtonText
}: CompanyFormProps) => {
    const fetchCompanies = useCompanyStore((state) => state.fetchCompanies);
    const baseData = initialValues || initialData;

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        general: true,
        ubicacion: false,
        contactos: false,
        operacion: false,
        retos: false,
        productos: false,
        documentacion: false
    });

    // Estado para controlar la visibilidad del formulario de agregar documento
    const [showDocForm, setShowDocForm] = useState(false);

    // Estado del formulario de nuevo documento
    const [docFormData, setDocFormData] = useState<{
        titulo: string;
        descripcion: string;
        archivo: File | null;
        tipoDocumento: string;
    }>({
        titulo: '',
        descripcion: '',
        archivo: null,
        tipoDocumento: ''
    });
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const [docErrors, setDocErrors] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState<CompanyFormData>({
        tipoEmpresa: initialValues?.tipoEmpresa || defaultTipoEmpresa || 'Empresa directorio',
        correoElectronico: '',
        nombreComercial: '',
        razonSocial: '',
        rfc: '',
        tamanoEmpresa: '',
        anioInicio: 0,
        sitioWeb: '',
        etiquetas: [],
        tipoOperaciones: [],
        tipoSuministro: [],

        ubicacion: {
            estado: '',
            municipio: '',
            direccion: '',
            colonia: '',
            codigoPostal: '',
            parqueIndustrial: '',
            latitud: '',
            longitud: ''
        },

        contactos: {
            directorGeneral: { nombreCompleto: '', telefono: '', celularWhatsapp: '', correoElectronico: '' },
            compras: { nombreCompleto: '', cargo: '', telefono: '', celularWhatsapp: '', correoElectronico: '' },
            ventas: { nombreCompleto: '', cargo: '', telefono: '', celularWhatsapp: '', correoElectronico: '' },
            recursosHumanos: { nombreCompleto: '', cargo: '', telefono: '', celularWhatsapp: '', correoElectronico: '' }
        },

        informacionEmpresa: {
            productosFabrica: '',
            principalesClientes: '',
            paisOrigen: 'México',
            porcentajeInversionNacional: 100,
            porcentajeInversionExtranjero: 0,
            certificaciones: { lista: [], otroEspecifique: '' },
            sectoresPertenece: { lista: [], otroEspecifique: '' },
            sectorPlasticos: { lista: [], otroEspecifique: '' },
            sectorMetalmecanico: { lista: [], otroEspecifique: '' },
            sectorElectricaElectronica: { lista: [], otroEspecifique: '' },
            sectorEmpaque: { lista: [], otroEspecifique: '' },
            sectorTiI40: { lista: [], otroEspecifique: '' },
            sectorTextil: { lista: [], otroEspecifique: '' },
            sectorServiciosEspecializados: { lista: [], otroEspecifique: '' },
            sectorMinero: { lista: [], otroEspecifique: '' },
            sectorMros: { lista: [], otroEspecifique: '' },
            principalSectorAtiende: '',
            principalSectorAtiendeOtro: '',
            porcentajeExportaciones: 0,
            destinoExportaciones: []
        },

        retosActuales: '',
        apoyosYNecesidades: { tipos: [], otroEspecifique: '' },
        presentacionComercial: '',
        activa: true,
        ...baseData
    });

    const [tagList, setTagList] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    // Estados para el Typeahead de Destino de Exportaciones
    const [countrySearch, setCountrySearch] = useState('');
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    useEffect(() => {
        if (baseData) {
            setFormData((prev) => ({
                ...prev,
                ...baseData,
                documentos: baseData.documentos || prev.documentos || [],
                // Si es registro público fuerza 'Empresa directorio'
                tipoEmpresa: isPublicRegistration
                    ? 'Empresa directorio'
                    : baseData.tipoEmpresa || prev.tipoEmpresa || 'Empresa directorio',
                ubicacion: {
                    ...prev.ubicacion,
                    ...(baseData.ubicacion || {})
                },
                contactos: {
                    directorGeneral: {
                        ...prev.contactos?.directorGeneral,
                        ...(baseData.contactos?.directorGeneral || {})
                    },
                    compras: {
                        ...prev.contactos?.compras,
                        ...(baseData.contactos?.compras || {})
                    },
                    ventas: {
                        ...prev.contactos?.ventas,
                        ...(baseData.contactos?.ventas || {})
                    },
                    recursosHumanos: {
                        ...prev.contactos?.recursosHumanos,
                        ...(baseData.contactos?.recursosHumanos || {})
                    }
                },
                informacionEmpresa: {
                    ...prev.informacionEmpresa,
                    ...(baseData.informacionEmpresa || {}),
                    certificaciones: {
                        ...prev.informacionEmpresa?.certificaciones,
                        ...(baseData.informacionEmpresa?.certificaciones || {})
                    }
                },
                activa: baseData.activa ?? prev.activa ?? true
            }));

            if (baseData.etiquetas) {
                if (Array.isArray(baseData.etiquetas)) {
                    setTagList(baseData.etiquetas);
                } else if (typeof baseData.etiquetas === 'string') {
                    const initialTags = (baseData.etiquetas as string)
                        .split(',')
                        .map((t) => t.trim())
                        .filter((t) => t !== '');
                    setTagList(initialTags);
                }
            }
        }
    }, [baseData, isPublicRegistration]);

    const sectoresSeleccionados = formData.informacionEmpresa?.sectoresPertenece?.lista || [];
    const esSectorPlasticosSeleccionado = sectoresSeleccionados.includes('Plásticos');
    const esSectorMetalmecanicoSeleccionado = sectoresSeleccionados.includes('Metalmecánico');
    const esSectorElectricaElectronicaSeleccionado = sectoresSeleccionados.includes('Eléctrica-Electrónica');
    const esSectorEmpaqueSeleccionado = sectoresSeleccionados.includes('Empaque');
    const esSectorTiI40Seleccionado = sectoresSeleccionados.includes('TI e I4.0');
    const esSectorTextilSeleccionado = sectoresSeleccionados.includes('Textil');
    const esSectorServiciosEspecializadosSeleccionado =
        sectoresSeleccionados.includes('Servicios') ||
        sectoresSeleccionados.includes('Hospitalario') ||
        sectoresSeleccionados.includes('Biotecnología') ||
        sectoresSeleccionados.includes('Logística');
    const esSectorMrosSeleccionado =
        sectoresSeleccionados.includes('Aeroespacial') ||
        sectoresSeleccionados.includes('Automotriz') ||
        sectoresSeleccionados.includes('Energético');
    const esSectorMineroSeleccionado = sectoresSeleccionados.includes('Minero');

    const opcionesPrincipalSector = sectoresSeleccionados.map((sec) =>
        sec === 'Otro especifica' ? 'Otro' : sec
    );

    useEffect(() => {
        if (
            formData.informacionEmpresa.principalSectorAtiende &&
            !opcionesPrincipalSector.includes(formData.informacionEmpresa.principalSectorAtiende)
        ) {
            setFormData((prev) => ({
                ...prev,
                informacionEmpresa: {
                    ...prev.informacionEmpresa,
                    principalSectorAtiende: ''
                }
            }));
        }
    }, [sectoresSeleccionados]);

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const municipiosDisponibles = getMunicipiosByEstado(formData.ubicacion.estado);

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoEstado = e.target.value;
        setFormData((prev) => ({
            ...prev,
            ubicacion: {
                ...prev.ubicacion,
                estado: nuevoEstado,
                municipio: ''
            }
        }));
        if (nuevoEstado) {
            setErrors((prev) => ({ ...prev, 'ubicacion.estado': false }));
        }
    };

    const handleChange = (field: string, value: any) => {
        const val = field === 'rfc' ? String(value).toUpperCase() : value;

        setFormData((prev) => {
            const keys = field.split('.');
            if (keys.length === 1) return { ...prev, [field]: val };
            if (keys.length === 2) {
                const [k1, k2] = keys as [keyof CompanyFormData, string];
                return { ...prev, [k1]: { ...(prev[k1] as any), [k2]: val } };
            }
            if (keys.length === 3) {
                const [k1, k2, k3] = keys as [keyof CompanyFormData, string, string];
                return {
                    ...prev,
                    [k1]: {
                        ...(prev[k1] as any),
                        [k2]: {
                            ...((prev[k1] as any)[k2]),
                            [k3]: val
                        }
                    }
                };
            }
            return prev;
        });

        if (val !== '' && val !== null && val !== undefined) {
            setErrors((prev) => ({ ...prev, [field]: false }));
        }
    };

    const handleTagPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');

        // Separa por comas o saltos de línea
        const newTags = pastedText
            .split(/,|\n/)
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0 && !tagList.includes(tag));

        if (newTags.length > 0) {
            setTagList((prev) => [...prev, ...newTags]);
            setTagInput(''); // Limpia el textarea
        }
    };

    const handlePhoneInput = (path: string, rawValue: string) => {
        const cleaned = sanitizePhoneNumber(rawValue, 10);
        handleChange(path, cleaned);
    };

    const handlePercentageInput = (field: string, rawValue: string) => {
        if (rawValue === '') {
            handleChange(field, '');
            return;
        }

        let num = parseInt(rawValue, 10);
        if (isNaN(num)) return;

        if (num < 0) num = 0;
        if (num > 100) num = 100;

        handleChange(field, num);

        if (field.includes('porcentajeInversion')) {
            setErrors((prev) => ({
                ...prev,
                'informacionEmpresa.porcentajeInversionNacional': false,
                'informacionEmpresa.porcentajeInversionExtranjero': false,
                porcentajeInversionSumaInvalid: false
            }));
        } else {
            setErrors((prev) => ({ ...prev, [field]: false }));
        }
    };

    const toggleExportDestination = (countryName: string) => {
        const currentDestinations = formData.informacionEmpresa.destinoExportaciones || [];
        const updated = currentDestinations.includes(countryName)
            ? currentDestinations.filter((c) => c !== countryName)
            : [...currentDestinations, countryName];

        handleChange('informacionEmpresa.destinoExportaciones', updated);
    };

    const selectedDestinations = formData.informacionEmpresa.destinoExportaciones || [];

    const filteredCountries = OPCIONES_PAISES.filter((pais) => {
        const isAlreadySelected = selectedDestinations.includes(pais.nombre);
        const matchesSearch = normalizeText(pais.nombre).includes(normalizeText(countrySearch));
        return !isAlreadySelected && matchesSearch;
    });

    const copyDirectorData = (targetArea: 'compras' | 'ventas' | 'recursosHumanos') => {
        const director = formData.contactos.directorGeneral;

        setFormData((prev) => ({
            ...prev,
            contactos: {
                ...prev.contactos,
                [targetArea]: {
                    nombreCompleto: director.nombreCompleto,
                    cargo: 'Director General',
                    telefono: director.telefono,
                    celularWhatsapp: director.celularWhatsapp,
                    correoElectronico: director.correoElectronico
                }
            }
        }));

        setErrors((prev) => ({
            ...prev,
            [`contactos.${targetArea}.correoElectronico`]: false,
            [`contactos.${targetArea}.telefono`]: false,
            [`contactos.${targetArea}.celularWhatsapp`]: false
        }));

        toast.info(`Datos copiados a ${targetArea === 'recursosHumanos' ? 'Recursos Humanos' : targetArea}`);
    };

    const toggleArrayItem = (path: string, item: string) => {
        const keys = path.split('.');
        setFormData((prev: any) => {
            let currentArray: string[] = [];

            if (keys.length === 1) {
                currentArray = prev[keys[0]] || [];
            } else if (keys.length === 2) {
                currentArray = prev[keys[0]]?.[keys[1]] || [];
            } else if (keys.length === 3) {
                currentArray = prev[keys[0]]?.[keys[1]]?.[keys[2]] || [];
            }

            const newArray = currentArray.includes(item)
                ? currentArray.filter((i) => i !== item)
                : [...currentArray, item];

            if (keys.length === 1) {
                return { ...prev, [keys[0]]: newArray };
            }
            if (keys.length === 2) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...prev[keys[0]],
                        [keys[1]]: newArray
                    }
                };
            }
            if (keys.length === 3) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...prev[keys[0]],
                        [keys[1]]: {
                            ...prev[keys[0]][keys[1]],
                            [keys[2]]: newArray
                        }
                    }
                };
            }
            return prev;
        });

        setErrors((prev: any) => {
            const newErrors = { ...prev };
            delete newErrors[path];

            if (keys.length === 1) {
                delete newErrors[keys[0]];
            } else if (keys.length === 2 && newErrors[keys[0]]) {
                newErrors[keys[0]] = { ...newErrors[keys[0]] };
                delete newErrors[keys[0]][keys[1]];
            } else if (keys.length === 3 && newErrors[keys[0]]?.[keys[1]]) {
                newErrors[keys[0]] = {
                    ...newErrors[keys[0]],
                    [keys[1]]: { ...newErrors[keys[0]][keys[1]] }
                };
                delete newErrors[keys[0]][keys[1]][keys[2]];
            }

            return newErrors;
        });
    };

    const selectSingleOption = (field: string, item: string) => {
        setFormData((prev) => {
            const currentArray: string[] = (prev as any)[field] || [];
            const newArray = currentArray.includes(item) ? [] : [item];
            return { ...prev, [field]: newArray };
        });
        setErrors((prev) => ({ ...prev, [field]: false }));
    };

    const addTag = (value: string) => {
        const cleanTag = value.replace(/,/g, '').trim();
        if (cleanTag && !tagList.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
            setTagList((prev) => [...prev, cleanTag]);
        }
        setTagInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput);
        }
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (val.includes(',')) {
            addTag(val);
        } else {
            setTagInput(val);
        }
    };

    const removeTag = (indexToRemove: number) => {
        setTagList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // Manejadores para el formulario de documento
    const handleDocChange = (field: keyof typeof docFormData, value: any) => {
        setDocFormData((prev) => ({ ...prev, [field]: value }));
        if (value) {
            setDocErrors((prev) => ({ ...prev, [field]: false }));
        }
    };

    const handleDocSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFormData.archivo) {
            toast.error('Por favor selecciona un archivo');
            return;
        }

        // 1. Obtener la extensión del archivo en minúsculas
        const fileExtension = '.' + docFormData.archivo.name.split('.').pop()?.toLowerCase();

        // 2. Determinar las extensiones permitidas según el tipoDocumento
        const isImageDoc = isImageType(docFormData.tipoDocumento);
        const allowedExtensions = isImageDoc ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_ALL_EXTENSIONS;

        // 3. Validar si la extensión es permitida
        if (!allowedExtensions.includes(fileExtension)) {
            if (isImageDoc) {
                toast.error(`Para ${docFormData.tipoDocumento} solo se permiten archivos JPG, JPEG, PNG o GIF.`);
            } else {
                toast.error('Formato de archivo no permitido. Tipos válidos: PDF, JPG, JPEG, PNG, XLSX, XLS, CSV, GIF.');
            }
            return;
        }

        const errors: Record<string, boolean> = {};

        if (!docFormData.titulo.trim()) errors.titulo = true;
        if (!docFormData.archivo) errors.archivo = true;
        if (!docFormData.tipoDocumento) errors.tipoDocumento = true;

        if (Object.keys(errors).length > 0) {
            setDocErrors(errors);
            toast.error('Por favor complete todos los campos obligatorios del documento.');
            return;
        }

        const companyId = (baseData as any)?._id;
        if (!companyId) {
            toast.error('Primero debes guardar la empresa antes de adjuntar documentos.');
            return;
        }

        try {
            setLoading(true);
            setUploadProgress(0); // Inicializamos el contador en 0%

            const data = new FormData();
            data.append('titulo', docFormData.titulo);
            data.append('tipoDocumento', docFormData.tipoDocumento);
            data.append('descripcion', docFormData.descripcion);
            data.append('archivo', docFormData.archivo!);

            // Guardamos la respuesta de la petición HTTP registrando el avance del upload
            const response = await api.post(`/companies/${companyId}/documents`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            });

            // Actualizamos el estado local del formulario inmediatamente
            if (response.data?.documentos) {
                setFormData((prev) => ({
                    ...prev,
                    documentos: response.data.documentos
                }));
            } else if (response.data?.company?.documentos) {
                setFormData((prev) => ({
                    ...prev,
                    documentos: response.data.company.documentos
                }));
            }

            // Recargamos la lista global del store
            await fetchCompanies(true);

            // Notificamos y limpiamos el formulario de documento
            toast.success('Documento subido correctamente.');
            setShowDocForm(false);
            setDocFormData({ titulo: '', descripcion: '', archivo: null, tipoDocumento: '' });
            setDocErrors({});
        } catch (error: any) {
            console.error('Error al subir el documento:', error);
            toast.error(error.response?.data?.message || 'Error al subir el documento.');
        } finally {
            setLoading(false);
            setUploadProgress(null); // Reiniciamos el estado del progreso
        }
    };

    const handleDocDelete = (docId?: string, tituloDoc?: string) => {
        if (!docId) return;

        const companyId = (baseData as any)?._id;
        if (!companyId) return;

        const nombreMostrar = tituloDoc ? `"${tituloDoc}"` : 'este documento';

        Swal.fire({
            title: '¿Eliminar documento?',
            html: `Está a punto de eliminar el documento <strong style="color: inherit;">${nombreMostrar}</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: '!bg-app-card !text-app-text !border !border-app-border'
            },
            allowOutsideClick: true,
            allowEscapeKey: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    const response = await api.delete(`/companies/${companyId}/documents/${docId}`);

                    // Actualizamos el estado local inmediatamente
                    if (response.data?.documentos) {
                        setFormData((prev) => ({
                            ...prev,
                            documentos: response.data.documentos
                        }));
                    } else if (response.data?.company?.documentos) {
                        setFormData((prev) => ({
                            ...prev,
                            documentos: response.data.company.documentos
                        }));
                    } else {
                        // Filtrado manual en caso de que el backend devuelva sólo un mensaje de éxito
                        setFormData((prev) => ({
                            ...prev,
                            documentos: (prev.documentos || []).filter((d) => d._id !== docId)
                        }));
                    }

                    await fetchCompanies(true);
                    toast.success('Documento eliminado correctamente.');
                } catch (error: any) {
                    console.error('Error al eliminar el documento:', error);
                    toast.error(error.response?.data?.message || 'Error al eliminar el documento.');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const pNacional = Number(formData.informacionEmpresa.porcentajeInversionNacional ?? 0);
    const pExtranjero = Number(formData.informacionEmpresa.porcentajeInversionExtranjero ?? 0);
    const sumaInversion = pNacional + pExtranjero;
    const isSumaInversionInvalida =
        formData.informacionEmpresa.porcentajeInversionNacional !== '' &&
        formData.informacionEmpresa.porcentajeInversionExtranjero !== '' &&
        sumaInversion !== 100;

    const toggleTipoEmpresa = () => {
        const nuevoTipo: TipoEmpresa =
            formData.tipoEmpresa === 'Empresa incompleta'
                ? 'Empresa directorio'
                : 'Empresa incompleta';

        setFormData((prev) => ({ ...prev, tipoEmpresa: nuevoTipo }));
        setErrors({});
    };

    const esEmpresaIncompleta = !isPublicRegistration && formData.tipoEmpresa === 'Empresa incompleta';

    const validateForm = (): boolean => {
        const newErrors: Record<string, boolean> = {};

        // --- MODO: EMPRESA INCOMPLETA (Sólo activo en Backoffice/Admin) ---
        if (esEmpresaIncompleta) {
            if (!formData.rfc || !formData.rfc.trim()) {
                newErrors.rfc = true;
            }

            if (!formData.nombreComercial || !formData.nombreComercial.trim()) {
                newErrors.nombreComercial = true;
            }

            setErrors(newErrors);

            if (Object.keys(newErrors).length > 0) {
                setOpenSections((prev) => ({ ...prev, general: true }));

                if (newErrors.rfc && newErrors.nombreComercial) {
                    toast.error('Los campos RFC y Nombre Comercial son obligatorios.');
                } else if (newErrors.rfc) {
                    toast.error('El campo RFC es obligatorio para Registrar/Actualizar una Empresa Incompleta.');
                } else {
                    toast.error('El campo Nombre Comercial es obligatorio.');
                }

                return false;
            }

            return true;
        }

        // --- MODO: EMPRESA DIRECTORIO (O Registro Público) ---
        if (!formData.correoElectronico.trim() || !EMAIL_REGEX.test(formData.correoElectronico.trim())) {
            newErrors.correoElectronico = true;
        }

        if (!formData.nombreComercial.trim()) newErrors.nombreComercial = true;
        if (!formData.razonSocial.trim()) newErrors.razonSocial = true;
        if (!formData.rfc.trim() || !RFC_REGEX.test(formData.rfc.trim())) newErrors.rfc = true;
        if (!formData.tamanoEmpresa.trim()) newErrors.tamanoEmpresa = true;
        if (formData.anioInicio === 0) newErrors.anioInicio = true;

        if (formData.tipoOperaciones.length === 0) newErrors.tipoOperaciones = true;
        if (formData.tipoSuministro.length === 0) newErrors.tipoSuministro = true;

        if (!formData.ubicacion.estado.trim()) newErrors['ubicacion.estado'] = true;
        if (!formData.ubicacion.municipio.trim()) newErrors['ubicacion.municipio'] = true;
        if (!formData.ubicacion.direccion.trim()) newErrors['ubicacion.direccion'] = true;
        if (!formData.ubicacion.colonia.trim()) newErrors['ubicacion.colonia'] = true;
        if (!formData.ubicacion.codigoPostal.trim()) newErrors['ubicacion.codigoPostal'] = true;

        const director = formData.contactos.directorGeneral;
        if (!director.nombreCompleto.trim()) {
            newErrors['contactos.directorGeneral.nombreCompleto'] = true;
        }
        if (!director.correoElectronico.trim() || !EMAIL_REGEX.test(director.correoElectronico.trim())) {
            newErrors['contactos.directorGeneral.correoElectronico'] = true;
        }
        if (director.telefono.trim() && !PHONE_REGEX.test(director.telefono.trim())) {
            newErrors['contactos.directorGeneral.telefono'] = true;
        }
        if (director.celularWhatsapp.trim() && !PHONE_REGEX.test(director.celularWhatsapp.trim())) {
            newErrors['contactos.directorGeneral.celularWhatsapp'] = true;
        }

        const areas = ['compras', 'ventas', 'recursosHumanos'] as const;
        areas.forEach((area) => {
            const contacto = formData.contactos[area];

            if (contacto.correoElectronico.trim() && !EMAIL_REGEX.test(contacto.correoElectronico.trim())) {
                newErrors[`contactos.${area}.correoElectronico`] = true;
            }
            if (contacto.telefono.trim() && !PHONE_REGEX.test(contacto.telefono.trim())) {
                newErrors[`contactos.${area}.telefono`] = true;
            }
            if (contacto.celularWhatsapp.trim() && !PHONE_REGEX.test(contacto.celularWhatsapp.trim())) {
                newErrors[`contactos.${area}.celularWhatsapp`] = true;
            }
        });

        if (!formData.informacionEmpresa.productosFabrica.trim()) newErrors['informacionEmpresa.productosFabrica'] = true;
        if (!formData.informacionEmpresa.paisOrigen.trim()) newErrors['informacionEmpresa.paisOrigen'] = true;

        if (formData.informacionEmpresa.porcentajeInversionNacional === '') {
            newErrors['informacionEmpresa.porcentajeInversionNacional'] = true;
        }
        if (formData.informacionEmpresa.porcentajeInversionExtranjero === '') {
            newErrors['informacionEmpresa.porcentajeInversionExtranjero'] = true;
        }

        if (
            formData.informacionEmpresa.porcentajeInversionNacional !== '' &&
            formData.informacionEmpresa.porcentajeInversionExtranjero !== '' &&
            sumaInversion !== 100
        ) {
            newErrors['informacionEmpresa.porcentajeInversionNacional'] = true;
            newErrors['informacionEmpresa.porcentajeInversionExtranjero'] = true;
            newErrors.porcentajeInversionSumaInvalid = true;
        }

        if (
            formData.informacionEmpresa.certificaciones.lista.includes('Otro especifique') &&
            (!formData.informacionEmpresa.certificaciones.otroEspecifique || !formData.informacionEmpresa.certificaciones.otroEspecifique.trim())
        ) {
            newErrors['informacionEmpresa.certificaciones.otroEspecifique'] = true;
        }

        if (formData.informacionEmpresa.sectoresPertenece.lista.length === 0) {
            newErrors['informacionEmpresa.sectoresPertenece.lista'] = true;
        }
        if (
            formData.informacionEmpresa.sectoresPertenece.lista.includes('Otro especifica') &&
            (!formData.informacionEmpresa.sectoresPertenece.otroEspecifique || !formData.informacionEmpresa.sectoresPertenece.otroEspecifique.trim())
        ) {
            newErrors['informacionEmpresa.sectoresPertenece.otroEspecifique'] = true;
        }

        if (esSectorPlasticosSeleccionado) {
            if (formData.informacionEmpresa.sectorPlasticos.lista.length === 0) {
                newErrors['informacionEmpresa.sectorPlasticos.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorPlasticos.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorPlasticos.otroEspecifique || !formData.informacionEmpresa.sectorPlasticos.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorPlasticos.otroEspecifique'] = true;
            }
        }

        if (esSectorMetalmecanicoSeleccionado) {
            if (formData.informacionEmpresa.sectorMetalmecanico.lista.length === 0) {
                newErrors['informacionEmpresa.sectorMetalmecanico.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorMetalmecanico.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorMetalmecanico.otroEspecifique || !formData.informacionEmpresa.sectorMetalmecanico.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorMetalmecanico.otroEspecifique'] = true;
            }
        }

        if (esSectorElectricaElectronicaSeleccionado) {
            if (formData.informacionEmpresa.sectorElectricaElectronica.lista.length === 0) {
                newErrors['informacionEmpresa.sectorElectricaElectronica.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorElectricaElectronica.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorElectricaElectronica.otroEspecifique || !formData.informacionEmpresa.sectorElectricaElectronica.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorElectricaElectronica.otroEspecifique'] = true;
            }
        }

        if (esSectorEmpaqueSeleccionado) {
            if (formData.informacionEmpresa.sectorEmpaque.lista.length === 0) {
                newErrors['informacionEmpresa.sectorEmpaque.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorEmpaque.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorEmpaque.otroEspecifique || !formData.informacionEmpresa.sectorEmpaque.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorEmpaque.otroEspecifique'] = true;
            }
        }

        if (esSectorTiI40Seleccionado) {
            if (formData.informacionEmpresa.sectorTiI40.lista.length === 0) {
                newErrors['informacionEmpresa.sectorTiI40.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorTiI40.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorTiI40.otroEspecifique || !formData.informacionEmpresa.sectorTiI40.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorTiI40.otroEspecifique'] = true;
            }
        }

        if (esSectorTextilSeleccionado) {
            if (formData.informacionEmpresa.sectorTextil.lista.length === 0) {
                newErrors['informacionEmpresa.sectorTextil.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorTextil.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorTextil.otroEspecifique || !formData.informacionEmpresa.sectorTextil.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorTextil.otroEspecifique'] = true;
            }
        }

        if (esSectorServiciosEspecializadosSeleccionado) {
            if (formData.informacionEmpresa.sectorServiciosEspecializados.lista.length === 0) {
                newErrors['informacionEmpresa.sectorServiciosEspecializados.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorServiciosEspecializados.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorServiciosEspecializados.otroEspecifique || !formData.informacionEmpresa.sectorServiciosEspecializados.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorServiciosEspecializados.otroEspecifique'] = true;
            }
        }

        if (esSectorMrosSeleccionado) {
            if (formData.informacionEmpresa.sectorMros.lista.length === 0) {
                newErrors['informacionEmpresa.sectorMros.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorMros.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorMros.otroEspecifique || !formData.informacionEmpresa.sectorMros.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorMros.otroEspecifique'] = true;
            }
        }

        if (esSectorMineroSeleccionado) {
            if (formData.informacionEmpresa.sectorMinero.lista.length === 0) {
                newErrors['informacionEmpresa.sectorMinero.lista'] = true;
            }
            if (
                formData.informacionEmpresa.sectorMinero.lista.includes('Otro especifica') &&
                (!formData.informacionEmpresa.sectorMinero.otroEspecifique || !formData.informacionEmpresa.sectorMinero.otroEspecifique.trim())
            ) {
                newErrors['informacionEmpresa.sectorMinero.otroEspecifique'] = true;
            }
        }

        if (!formData.informacionEmpresa.principalSectorAtiende.trim()) {
            newErrors['informacionEmpresa.principalSectorAtiende'] = true;
        }

        if (formData.informacionEmpresa.porcentajeExportaciones === '') {
            newErrors['informacionEmpresa.porcentajeExportaciones'] = true;
        }

        if (!formData.retosActuales.trim()) newErrors.retosActuales = true;
        if (formData.apoyosYNecesidades.tipos.length === 0) {
            newErrors['apoyosYNecesidades.tipos'] = true;
        }
        if (
            formData.apoyosYNecesidades.tipos.includes('Otro especifique') &&
            (!formData.apoyosYNecesidades.otroEspecifique || !formData.apoyosYNecesidades.otroEspecifique.trim())
        ) {
            newErrors['apoyosYNecesidades.otroEspecifique'] = true;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setOpenSections({
                general: !!(newErrors.correoElectronico || newErrors.nombreComercial || newErrors.razonSocial || newErrors.rfc),
                ubicacion: !!(newErrors['ubicacion.estado'] || newErrors['ubicacion.municipio'] || newErrors['ubicacion.direccion'] || newErrors['ubicacion.colonia'] || newErrors['ubicacion.codigoPostal']),
                contactos: Object.keys(newErrors).some((key) => key.startsWith('contactos.')),
                operacion: !!(
                    newErrors.tipoOperaciones ||
                    newErrors.tipoSuministro ||
                    newErrors['informacionEmpresa.productosFabrica'] ||
                    newErrors['informacionEmpresa.sectoresPertenece.lista'] ||
                    newErrors['informacionEmpresa.sectoresPertenece.otroEspecifique'] ||
                    newErrors['informacionEmpresa.sectorPlasticos.lista'] ||
                    newErrors['informacionEmpresa.sectorPlasticos.otroEspecifique'] ||
                    newErrors['informacionEmpresa.principalSectorAtiende'] ||
                    newErrors['informacionEmpresa.porcentajeExportaciones'] ||
                    newErrors['informacionEmpresa.paisOrigen'] ||
                    newErrors['informacionEmpresa.porcentajeInversionNacional'] ||
                    newErrors['informacionEmpresa.porcentajeInversionExtranjero'] ||
                    newErrors.porcentajeInversionSumaInvalid ||
                    newErrors['informacionEmpresa.certificaciones.otroEspecifique']
                ),
                productos: Object.keys(newErrors).some((key) =>
                    key.startsWith('informacionEmpresa.sector') && key !== 'informacionEmpresa.sectoresPertenece.lista' && key !== 'informacionEmpresa.sectoresPertenece.otroEspecifique'
                ),
                retos: !!(newErrors.retosActuales || newErrors['apoyosYNecesidades.tipos'] || newErrors['apoyosYNecesidades.otroEspecifique']),
                documentacion: false
            });

            if (newErrors.porcentajeInversionSumaInvalid) {
                toast.error('La suma del porcentaje de inversión nacional y extranjero debe ser igual a 100%.');
            } else {
                toast.error('Por favor, revisa los campos requeridos o con formato incorrecto marcados en rojo.');
            }
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        let finalTags = [...tagList];
        if (tagInput.trim()) {
            const extraTag = tagInput.replace(/,/g, '').trim();
            if (extraTag && !finalTags.some((t) => t.toLowerCase() === extraTag.toLowerCase())) {
                finalTags.push(extraTag);
            }
        }

        finalTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

        const updatedFormData: CompanyFormData = {
            ...formData,
            tipoEmpresa: isPublicRegistration ? 'Empresa directorio' : (formData.tipoEmpresa || 'Empresa directorio'),
            etiquetas: finalTags
        };

        try {
            setLoading(true);

            if (onSubmit) {
                await onSubmit(updatedFormData);
            } else if (isPublicRegistration) {
                await api.post('/companies/public', updatedFormData);
            } else if (isEditing && baseData?._id) {
                await api.put(`/companies/${(baseData as any)._id}`, updatedFormData);
                toast.success('Empresa actualizada exitosamente');
                if (onCancel) onCancel();
            } else {
                await api.post('/companies', updatedFormData);
                toast.success('Empresa creada exitosamente');
                if (onCancel) onCancel();
            }
        } catch (error: any) {
            const responseData = error.response?.data;
            if (responseData?.errors && Array.isArray(responseData.errors)) {
                const newErrorsState: Record<string, boolean> = {};
                responseData.errors.forEach((err: { field: string; message: string }) => {
                    toast.error(err.message);
                    console.log(err.message);

                    if (err.field) newErrorsState[err.field] = true;
                });
                setErrors((prev) => ({ ...prev, ...newErrorsState }));
            } else {
                toast.error(responseData?.message || error.message || 'Error al guardar.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getInputClass = (fieldName: string) => `
    w-full bg-app-bg border rounded-lg p-2.5 text-sm text-app-text placeholder:text-app-muted focus:outline-none transition-colors
    ${errors[fieldName]
            ? 'border-red-500 focus:border-red-500 bg-red-500/5'
            : 'border-app-border focus:border-blue-500'
        }
`;

    const getDocInputClass = (fieldName: string) => `
    w-full bg-app-bg border rounded-lg p-2.5 text-sm text-app-text placeholder:text-app-muted focus:outline-none transition-colors
    ${docErrors[fieldName]
            ? 'border-red-500 focus:border-red-500 bg-red-500/5'
            : 'border-app-border focus:border-blue-500'
        }
`;

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* SWITCH: EMPRESA DIRECTORIO / EMPRESA INCOMPLETA (SOLO SI NO ES REGISTRO PÚBLICO) */}
            {!isPublicRegistration && (
                <div className="bg-app-card border border-app-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div>
                        <span className="text-xs font-semibold text-app-muted uppercase tracking-wider block">
                            Modo de Registro
                        </span>
                        <span className="text-sm font-medium text-app-text">
                            {formData.tipoEmpresa || 'Empresa directorio'}
                        </span>
                        <p className="text-xs text-app-muted mt-0.5">
                            {esEmpresaIncompleta
                                ? 'Solo el campo Nombre Comercial y RFC son obligatorios.'
                                : 'Todos los campos marcados con (*) son obligatorios con validación completa.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={toggleTipoEmpresa}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${esEmpresaIncompleta
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20'
                            }`}
                    >
                        {esEmpresaIncompleta ? (
                            <>
                                <ToggleRight className="w-5 h-5 text-amber-500" />
                                <span>Empresa incompleta</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-5 h-5 text-blue-500" />
                                <span>Empresa directorio</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* 1. SECCIÓN: DATOS GENERALES */}
            <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                <button
                    type="button"
                    onClick={() => toggleSection('general')}
                    className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>Datos Generales</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.general ? 'rotate-180' : ''}`} />
                </button>

                {openSections.general && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-app-border">
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Correo Electrónico Institucional {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="email"
                                value={formData.correoElectronico}
                                onChange={(e) => handleChange('correoElectronico', e.target.value)}
                                className={getInputClass('correoElectronico')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Nombre Comercial <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nombreComercial}
                                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                                className={getInputClass('nombreComercial')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Razón Social {!esEmpresaIncompleta ? <span className="text-red-500">*</span> : "(Sin validación de formato)"}
                            </label>
                            <input
                                type="text"
                                value={formData.razonSocial}
                                onChange={(e) => handleChange('razonSocial', e.target.value)}
                                className={getInputClass('razonSocial')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                RFC <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                maxLength={13}
                                value={formData.rfc}
                                onChange={(e) => handleChange('rfc', e.target.value)}
                                className={getInputClass('rfc')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Tamaño de Empresa {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                value={formData.tamanoEmpresa}
                                onChange={(e) => handleChange('tamanoEmpresa', e.target.value)}
                                className={getInputClass('tamanoEmpresa')}
                            >
                                {OPCIONES_TAMANO.map((tamano) => (
                                    <option key={tamano} value={tamano} className="bg-app-bg text-app-text">
                                        {tamano}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Año de Inicio {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="number"
                                value={formData.anioInicio}
                                onChange={(e) => handleChange('anioInicio', Number(e.target.value))}
                                className={getInputClass('anioInicio')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">Sitio Web</label>
                            <input
                                type="url"
                                placeholder="https://ejemplo.com"
                                value={formData.sitioWeb}
                                onChange={(e) => handleChange('sitioWeb', e.target.value)}
                                className={getInputClass('sitioWeb')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Presentación Comercial (Link de Google Drive)
                            </label>
                            <input
                                type="url"
                                placeholder="https://ejemplo.com"
                                value={formData.presentacionComercial}
                                onChange={(e) => handleChange('presentacionComercial', e.target.value)}
                                className={getInputClass('presentacionComercial')}
                            />
                        </div>

                        {!isPublicRegistration && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-app-muted mb-1">Etiquetas</label>
                                    <div className="bg-app-bg border border-app-border rounded-lg p-2.5 focus-within:border-blue-500 transition-colors">
                                        {tagList.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {tagList.map((tag, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30">
                                                        {tag}
                                                        <button type="button" onClick={() => removeTag(idx)} className="text-blue-500 hover:text-blue-700 dark:hover:text-white transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <textarea
                                            rows={2}
                                            placeholder="Escribe una etiqueta y presiona coma (,) o Enter..."
                                            value={tagInput}
                                            onChange={handleTagInputChange}
                                            onKeyDown={handleKeyDown}
                                            onPaste={handleTagPaste}
                                            className="w-full bg-transparent text-sm text-app-text placeholder:text-app-muted focus:outline-none resize-y"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-app-muted mb-1">Estado de la Cuenta</label>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('activa', !formData.activa)}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${formData.activa
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${formData.activa ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        {formData.activa ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 2. SECCIÓN: UBICACIÓN */}
            <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                <button
                    type="button"
                    onClick={() => toggleSection('ubicacion')}
                    className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>Ubicación</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.ubicacion ? 'rotate-180' : ''}`} />
                </button>

                {openSections.ubicacion && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-app-border">
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Estado {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <select value={formData.ubicacion.estado} onChange={handleEstadoChange} className={getInputClass('ubicacion.estado')}>
                                <option value="" className="bg-app-bg text-app-text">-- Selecciona un Estado --</option>
                                {ESTADOS_MEXICO.map((item) => (
                                    <option key={item.estado} value={item.estado} className="bg-app-bg text-app-text">
                                        {item.estado}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Municipio {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                disabled={!formData.ubicacion.estado}
                                value={formData.ubicacion.municipio}
                                onChange={(e) => handleChange('ubicacion.municipio', e.target.value)}
                                className={`${getInputClass('ubicacion.municipio')} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <option value="" className="bg-app-bg text-app-text">
                                    {formData.ubicacion.estado ? '-- Selecciona un Municipio --' : '-- Primero elige un Estado --'}
                                </option>
                                {municipiosDisponibles.map((muni) => (
                                    <option key={muni} value={muni} className="bg-app-bg text-app-text">{muni}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Dirección (Calle y Número) {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.direccion}
                                onChange={(e) => handleChange('ubicacion.direccion', e.target.value)}
                                className={getInputClass('ubicacion.direccion')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Colonia {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.colonia}
                                onChange={(e) => handleChange('ubicacion.colonia', e.target.value)}
                                className={getInputClass('ubicacion.colonia')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Código Postal {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.codigoPostal}
                                onChange={(e) => handleChange('ubicacion.codigoPostal', e.target.value)}
                                className={getInputClass('ubicacion.codigoPostal')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">Parque Industrial (Opcional)</label>
                            <input
                                type="text"
                                value={formData.ubicacion.parqueIndustrial || ''}
                                onChange={(e) => handleChange('ubicacion.parqueIndustrial', e.target.value)}
                                className={getInputClass('ubicacion.parqueIndustrial')}
                            />
                        </div>

                        {(isEditing || !isPublicRegistration) && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-app-muted mb-1">
                                        Latitud
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="ej. 20.5888"
                                        value={formData.ubicacion.latitud ?? ''}
                                        onChange={(e) => handleChange('ubicacion.latitud', e.target.value === '' ? '' : Number(e.target.value))}
                                        className={getInputClass('ubicacion.latitud')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-app-muted mb-1">
                                        Longitud
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="ej. -100.3899"
                                        value={formData.ubicacion.longitud ?? ''}
                                        onChange={(e) => handleChange('ubicacion.longitud', e.target.value === '' ? '' : Number(e.target.value))}
                                        className={getInputClass('ubicacion.longitud')}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 3. SECCIÓN: CONTACTOS */}
            <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                <button
                    type="button"
                    onClick={() => toggleSection('contactos')}
                    className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>Contactos</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.contactos ? 'rotate-180' : ''}`} />
                </button>

                {openSections.contactos && (
                    <div className="p-4 space-y-4 border-t border-app-border">
                        {/* Director General */}
                        <div className="bg-app-bg/60 p-3.5 border border-app-border rounded-lg space-y-3">
                            <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                                Director General {!esEmpresaIncompleta && '(Obligatorio)'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={esEmpresaIncompleta ? "Nombre Completo" : "Nombre Completo *"}
                                    value={formData.contactos.directorGeneral.nombreCompleto}
                                    onChange={(e) => handleChange('contactos.directorGeneral.nombreCompleto', e.target.value)}
                                    className={getInputClass('contactos.directorGeneral.nombreCompleto')}
                                />
                                <input
                                    type="email"
                                    placeholder={esEmpresaIncompleta ? "Correo Electrónico" : "Correo Electrónico *"}
                                    value={formData.contactos.directorGeneral.correoElectronico}
                                    onChange={(e) => handleChange('contactos.directorGeneral.correoElectronico', e.target.value)}
                                    className={getInputClass('contactos.directorGeneral.correoElectronico')}
                                />
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Teléfono (10 dígitos)"
                                    value={formData.contactos.directorGeneral.telefono}
                                    onChange={(e) => handlePhoneInput('contactos.directorGeneral.telefono', e.target.value)}
                                    className={getInputClass('contactos.directorGeneral.telefono')}
                                />
                                <input
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Celular / WhatsApp (10 dígitos)"
                                    value={formData.contactos.directorGeneral.celularWhatsapp}
                                    onChange={(e) => handlePhoneInput('contactos.directorGeneral.celularWhatsapp', e.target.value)}
                                    className={getInputClass('contactos.directorGeneral.celularWhatsapp')}
                                />
                            </div>
                        </div>

                        {/* Contactos Adicionales */}
                        {(['compras', 'ventas', 'recursosHumanos'] as const).map((area) => (
                            <div key={area} className="bg-app-bg/60 p-3.5 border border-app-border rounded-lg space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                                        Contacto de {area === 'recursosHumanos' ? 'Recursos Humanos' : area}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => copyDirectorData(area)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-md hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Mismo que Director General
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre Completo"
                                        value={formData.contactos[area].nombreCompleto}
                                        onChange={(e) => handleChange(`contactos.${area}.nombreCompleto`, e.target.value)}
                                        className={getInputClass(`contactos.${area}.nombreCompleto`)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cargo"
                                        value={formData.contactos[area].cargo}
                                        onChange={(e) => handleChange(`contactos.${area}.cargo`, e.target.value)}
                                        className={getInputClass(`contactos.${area}.cargo`)}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Correo Electrónico"
                                        value={formData.contactos[area].correoElectronico}
                                        onChange={(e) => handleChange(`contactos.${area}.correoElectronico`, e.target.value)}
                                        className={getInputClass(`contactos.${area}.correoElectronico`)}
                                    />
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="Teléfono (10 dígitos)"
                                        value={formData.contactos[area].telefono}
                                        onChange={(e) => handlePhoneInput(`contactos.${area}.telefono`, e.target.value)}
                                        className={getInputClass(`contactos.${area}.telefono`)}
                                    />
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="Celular / WhatsApp (10 dígitos)"
                                        value={formData.contactos[area].celularWhatsapp}
                                        onChange={(e) => handlePhoneInput(`contactos.${area}.celularWhatsapp`, e.target.value)}
                                        className={getInputClass(`contactos.${area}.celularWhatsapp`)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. SECCIÓN: INFORMACIÓN ACERCA DE LA EMPRESA */}
            <div className={`border border-app-border rounded-lg overflow-hidden bg-app-card ${openSections.operacion ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                    type="button"
                    onClick={() => toggleSection('operacion')}
                    className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>Información acerca de la empresa</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.operacion ? 'rotate-180' : ''}`} />
                </button>

                {openSections.operacion && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-app-border overflow-visible">
                        {/* Tipo de Operaciones */}
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-2">
                                Tipo de Operaciones {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <div className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-colors ${errors.tipoOperaciones ? 'border-red-500 bg-red-500/5' : 'border-transparent'}`}>
                                {OPCIONES_OPERACIONES.map((op) => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => toggleArrayItem('tipoOperaciones', op)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.tipoOperaciones.includes(op)
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : errors.tipoOperaciones
                                                ? 'bg-app-bg border-red-500/50 text-app-muted'
                                                : 'bg-app-bg border-app-border text-app-muted hover:border-blue-500/50'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tipo de Suministro */}
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-2">
                                Tipo de Suministro {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <div className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-colors ${errors.tipoSuministro ? 'border-red-500 bg-red-500/5' : 'border-transparent'}`}>
                                {OPCIONES_SUMINISTRO.map((op) => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => selectSingleOption('tipoSuministro', op)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.tipoSuministro.includes(op)
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : errors.tipoSuministro
                                                ? 'bg-app-bg border-red-500/50 text-app-muted'
                                                : 'bg-app-bg border-app-border text-app-muted hover:border-blue-500/50'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Productos o Servicios */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Productos o Servicios que Fabrica / Ofrece {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                rows={2}
                                value={formData.informacionEmpresa.productosFabrica}
                                onChange={(e) => handleChange('informacionEmpresa.productosFabrica', e.target.value)}
                                className={getInputClass('informacionEmpresa.productosFabrica')}
                            />
                        </div>

                        {/* Principales Clientes */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-app-muted mb-1">Principales Clientes</label>
                            <textarea
                                rows={2}
                                placeholder="Escribe tus principales clientes..."
                                value={formData.informacionEmpresa.principalesClientes}
                                onChange={(e) => handleChange('informacionEmpresa.principalesClientes', e.target.value)}
                                className={getInputClass('informacionEmpresa.principalesClientes')}
                            />
                        </div>

                        {/* País de Origen */}
                        <div className="md:col-span-2 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-app-muted mb-1">
                                    País de Origen {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                                </label>
                                <select
                                    value={formData.informacionEmpresa.paisOrigen}
                                    onChange={(e) => handleChange('informacionEmpresa.paisOrigen', e.target.value)}
                                    className={getInputClass('informacionEmpresa.paisOrigen')}
                                >
                                    <option value="" className="bg-app-bg text-app-text">Selecciona un país</option>
                                    {OPCIONES_PAISES.map((pais) => (
                                        <option key={pais.iso2} value={pais.nombre} className="bg-app-bg text-app-text">
                                            {pais.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.informacionEmpresa.paisOrigen === 'Otro' && (
                                <div>
                                    <label className="block text-xs font-medium text-app-muted mb-1">
                                        Especifique el País de Origen {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Escribe el país de origen"
                                        value={formData.informacionEmpresa.paisOrigenOtro || ''}
                                        onChange={(e) => handleChange('informacionEmpresa.paisOrigenOtro', e.target.value)}
                                        className={getInputClass('informacionEmpresa.paisOrigenOtro')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Porcentajes de Inversión */}
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Porcentaje de inversión nacional (%) {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={formData.informacionEmpresa.porcentajeInversionNacional}
                                onChange={(e) => handlePercentageInput('informacionEmpresa.porcentajeInversionNacional', e.target.value)}
                                className={getInputClass('informacionEmpresa.porcentajeInversionNacional')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Porcentaje de inversión extranjero (%) {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={formData.informacionEmpresa.porcentajeInversionExtranjero}
                                onChange={(e) => handlePercentageInput('informacionEmpresa.porcentajeInversionExtranjero', e.target.value)}
                                className={getInputClass('informacionEmpresa.porcentajeInversionExtranjero')}
                            />
                        </div>

                        {!esEmpresaIncompleta && (isSumaInversionInvalida || errors.porcentajeInversionSumaInvalid) && (
                            <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 font-medium">
                                ⚠️ La suma del porcentaje de inversión nacional y extranjero debe ser igual a 100% (Suma actual: {sumaInversion}%).
                            </div>
                        )}

                        {/* Certificaciones */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-app-muted mb-2">
                                Certificaciones
                            </label>
                            <div className="space-y-2 bg-app-bg/60 p-3 rounded-lg border border-app-border">
                                {OPCIONES_CERTIFICACIONES.map((cert) => {
                                    const isChecked = formData.informacionEmpresa.certificaciones.lista.includes(cert);
                                    return (
                                        <div key={cert} className="flex flex-col gap-2">
                                            <label className="flex items-center gap-3 text-xs text-app-muted cursor-pointer select-none hover:text-app-text transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('informacionEmpresa.certificaciones.lista', cert)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-app-border bg-app-bg accent-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span>{cert}</span>
                                            </label>

                                            {cert === 'Otro especifique' && isChecked && (
                                                <div className="ml-7 mt-1">
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Por favor, especifique las certificaciones con las que cuenta..."
                                                        value={formData.informacionEmpresa.certificaciones.otroEspecifique || ''}
                                                        onChange={(e) => handleChange('informacionEmpresa.certificaciones.otroEspecifique', e.target.value)}
                                                        className={getInputClass('informacionEmpresa.certificaciones.otroEspecifique')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sector(es) al(los) que pertenece(n) */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-app-muted mb-2">
                                Sector(es) al(los) que pertenece(n): {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <div className={`space-y-2 bg-app-bg/60 p-3 rounded-lg border transition-colors ${errors['informacionEmpresa.sectoresPertenece.lista'] ? 'border-red-500 bg-red-500/5' : 'border-app-border'
                                }`}>
                                {OPCIONES_SECTORES.map((sec) => {
                                    const isChecked = formData.informacionEmpresa.sectoresPertenece.lista.includes(sec);
                                    return (
                                        <div key={sec} className="flex flex-col gap-2">
                                            <label className="flex items-center gap-3 text-xs text-app-muted cursor-pointer select-none hover:text-app-text transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('informacionEmpresa.sectoresPertenece.lista', sec)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-app-border bg-app-bg accent-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span>{sec}</span>
                                            </label>

                                            {sec === 'Otro especifica' && isChecked && (
                                                <div className="ml-7 mt-1">
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Por favor, especifique el sector al que pertenece..."
                                                        value={formData.informacionEmpresa.sectoresPertenece.otroEspecifique || ''}
                                                        onChange={(e) => handleChange('informacionEmpresa.sectoresPertenece.otroEspecifique', e.target.value)}
                                                        className={getInputClass('informacionEmpresa.sectoresPertenece.otroEspecifique')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Principal Sector al que Atiende */}
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Principal sector al que atiende {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                value={formData.informacionEmpresa.principalSectorAtiende}
                                onChange={(e) => handleChange('informacionEmpresa.principalSectorAtiende', e.target.value)}
                                disabled={opcionesPrincipalSector.length === 0}
                                className={`${getInputClass('informacionEmpresa.principalSectorAtiende')} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <option value="" className="bg-app-bg text-app-text">
                                    {opcionesPrincipalSector.length > 0
                                        ? '-- Selecciona un sector principal --'
                                        : '-- Selecciona primero al menos un sector arriba --'}
                                </option>
                                {opcionesPrincipalSector.map((sec, idx) => (
                                    <option key={idx} value={sec} className="bg-app-bg text-app-text">
                                        {sec}
                                    </option>
                                ))}
                            </select>
                            {formData.informacionEmpresa.principalSectorAtiendeOtro && (
                                <p className="text-xxs">
                                    <strong className="text-app-muted">Sector Principal (Google Forms):</strong>{' '}
                                    {formData.informacionEmpresa.principalSectorAtiendeOtro}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Porcentaje de exportaciones (%) {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={formData.informacionEmpresa.porcentajeExportaciones}
                                onChange={(e) => handlePercentageInput('informacionEmpresa.porcentajeExportaciones', e.target.value)}
                                className={getInputClass('informacionEmpresa.porcentajeExportaciones')}
                            />
                        </div>

                        {/* Typeahead Multi-select: Destino de Exportaciones */}
                        <div className="md:col-span-2 relative z-30">
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Favor de especificar el destino de sus exportaciones:
                            </label>
                            <div className="relative">
                                <div
                                    className="w-full min-h-10.5 p-2 bg-app-bg border border-app-border rounded-lg focus-within:border-blue-500 flex flex-wrap items-center gap-1.5 cursor-text transition-colors"
                                    onClick={() => setIsCountryDropdownOpen(true)}
                                >
                                    {(formData.informacionEmpresa.destinoExportaciones || []).map((country) => (
                                        <span
                                            key={country}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30"
                                        >
                                            {country}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExportDestination(country);
                                                }}
                                                className="hover:text-blue-700 dark:hover:text-white transition-colors focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}

                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none p-1 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:ring-0 min-w-37.5"
                                        placeholder={
                                            (formData.informacionEmpresa.destinoExportaciones || []).length === 0
                                                ? 'Buscar y seleccionar países...'
                                                : 'Buscar otro país...'
                                        }
                                        value={countrySearch}
                                        onChange={(e) => {
                                            setCountrySearch(e.target.value);
                                            setIsCountryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCountryDropdownOpen(true)}
                                    />

                                    <ChevronDown className="w-4 h-4 text-app-muted mr-1 pointer-events-none" />
                                </div>

                                {isCountryDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsCountryDropdownOpen(false)}
                                        />

                                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-app-card border border-app-border rounded-lg shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map((pais) => {
                                                    const isSelected = (formData.informacionEmpresa.destinoExportaciones || []).includes(pais.nombre);
                                                    return (
                                                        <button
                                                            key={pais.iso2}
                                                            type="button"
                                                            onClick={() => {
                                                                toggleExportDestination(pais.nombre);
                                                                setCountrySearch('');
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-app-border/50 transition-colors ${isSelected ? 'bg-blue-500/20 text-blue-500 font-medium' : 'text-app-text'
                                                                }`}
                                                        >
                                                            <span>{pais.nombre}</span>
                                                            {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-3 py-2 text-xs text-app-muted">
                                                    No se encontraron países
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Productos o Servicios */}
            {(sectoresSeleccionados.length > 0) && (
                <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                    <button
                        type="button"
                        onClick={() => toggleSection('productos')}
                        className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                            <HelpCircle className="w-4 h-4 text-blue-500" />
                            <span>Información de los productos o servicios que ofrecen</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.productos ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.productos && (
                        <div className="p-4 space-y-4 border-t border-app-border">
                            {SECTORES_CONFIG.map((sector) => {
                                const isVisible = sector.matchSectores.some((s) => sectoresSeleccionados.includes(s));

                                if (!isVisible) return null;

                                const sectorData = (formData.informacionEmpresa?.[sector.keyName] as {
                                    lista?: string[];
                                    otroEspecifique?: string;
                                }) || { lista: [], otroEspecifique: '' };

                                return (
                                    <SectorCheckboxGroup
                                        key={sector.id}
                                        isVisible={true}
                                        title={sector.title}
                                        colorTheme={sector.colorTheme}
                                        options={sector.options}
                                        selectedItems={sectorData.lista || []}
                                        otherValue={sectorData.otroEspecifique || ''}
                                        listPath={`informacionEmpresa.${sector.keyName}.lista`}
                                        otherPath={`informacionEmpresa.${sector.keyName}.otroEspecifique`}
                                        hasError={!!errors[`informacionEmpresa.${sector.keyName}.lista`]}
                                        onToggle={toggleArrayItem}
                                        onChange={handleChange}
                                        getInputClass={getInputClass}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 6. SECCIÓN: RETOS Y APOYOS */}
            <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                <button
                    type="button"
                    onClick={() => toggleSection('retos')}
                    className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                        <HelpCircle className="w-4 h-4 text-blue-500" />
                        <span>Retos y Apoyos</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.retos ? 'rotate-180' : ''}`} />
                </button>

                {openSections.retos && (
                    <div className="p-4 space-y-4 border-t border-app-border">
                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-1">
                                Retos Actuales de la Empresa {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Describe los principales retos operativos, financieros o comerciales..."
                                value={formData.retosActuales}
                                onChange={(e) => handleChange('retosActuales', e.target.value)}
                                className={getInputClass('retosActuales')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-app-muted mb-2">
                                Apoyos y Necesidades Requeridos {!esEmpresaIncompleta && <span className="text-red-500">*</span>}
                            </label>
                            <div className={`space-y-2.5 bg-app-bg/60 p-3 rounded-lg border transition-colors ${errors['apoyosYNecesidades.tipos']
                                ? 'border-red-500 bg-red-500/5'
                                : 'border-app-border'
                                }`}>
                                {OPCIONES_APOYOS.map((apoyo) => {
                                    const isChecked = formData.apoyosYNecesidades.tipos.includes(apoyo);
                                    return (
                                        <div key={apoyo} className="flex flex-col gap-2">
                                            <label className="flex items-start gap-3 text-xs text-app-muted cursor-pointer select-none hover:text-app-text transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('apoyosYNecesidades.tipos', apoyo)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-app-border bg-app-bg accent-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span>{apoyo}</span>
                                            </label>

                                            {apoyo === 'Otro especifique' && isChecked && (
                                                <div className="ml-7 mt-1">
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Por favor, especifique las necesidades de su empresa..."
                                                        value={formData.apoyosYNecesidades.otroEspecifique || ''}
                                                        onChange={(e) => handleChange('apoyosYNecesidades.otroEspecifique', e.target.value)}
                                                        className={getInputClass('apoyosYNecesidades.otroEspecifique')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 7. SECCIÓN: DOCUMENTACIÓN (Solo en edición y cuando NO es registro público) */}
            {isEditing && !isPublicRegistration && (
                <div className="border border-app-border rounded-lg overflow-hidden bg-app-card">
                    <button
                        type="button"
                        onClick={() => toggleSection('documentacion')}
                        className="w-full flex items-center justify-between p-3.5 bg-app-border/40 hover:bg-app-border/80 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>Documentación</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${openSections.documentacion ? 'rotate-180' : ''}`} />
                    </button>

                    {openSections.documentacion && (
                        <div className="p-4 space-y-4 border-t border-app-border">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-app-muted">
                                    Administra y adjunta la documentación relacionada con la empresa.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowDocForm(!showDocForm)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                                >
                                    {showDocForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    <span>{showDocForm ? 'Cancelar' : 'Agregar documento'}</span>
                                </button>
                            </div>

                            {/* FORMULARIO DE AGREGAR DOCUMENTO */}
                            {showDocForm && (
                                <div className="p-4 bg-app-bg/60 border border-app-border rounded-lg space-y-4">
                                    <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                                        Nuevo Documento
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-app-muted mb-1">
                                                Título del documento <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Acta Constitutiva, Logotipo HD..."
                                                value={docFormData.titulo}
                                                onChange={(e) => handleDocChange('titulo', e.target.value)}
                                                className={getDocInputClass('titulo')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-app-muted mb-1">
                                                Tipo de documento <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={docFormData.tipoDocumento}
                                                onChange={(e) => handleDocChange('tipoDocumento', e.target.value)}
                                                className={getDocInputClass('tipoDocumento')}
                                            >
                                                <option value="" className="bg-app-bg text-app-text">-- Selecciona un tipo --</option>
                                                {TIPOS_DOCUMENTO.map((tipo) => (
                                                    <option key={tipo} value={tipo} className="bg-app-bg text-app-text">
                                                        {tipo}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-app-muted mb-1">
                                                Descripción del documento <span className="text-app-muted">(Opcional)</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Detalles o notas adicionales sobre el archivo..."
                                                value={docFormData.descripcion}
                                                onChange={(e) => handleDocChange('descripcion', e.target.value)}
                                                className={getDocInputClass('descripcion')}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-app-muted mb-1">
                                                Archivo <span className="text-red-500">*</span> (Formatos permitidos: {
                                                    isImageType(docFormData.tipoDocumento)
                                                        ? ALLOWED_IMAGE_EXTENSIONS
                                                        : ALLOWED_ALL_EXTENSIONS
                                                })
                                            </label>

                                            <div
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const droppedFile = e.dataTransfer.files?.[0];
                                                    if (droppedFile) {
                                                        handleDocChange('archivo', droppedFile);
                                                    }
                                                }}
                                                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 bg-app-bg/50 ${docErrors.archivo
                                                    ? 'border-red-500 bg-red-500/5'
                                                    : docFormData.archivo
                                                        ? 'border-blue-500/50 bg-blue-500/5'
                                                        : 'border-app-border hover:border-blue-500/50 hover:bg-app-border/10'
                                                    }`}
                                            >
                                                <input
                                                    type="file"
                                                    id="company-doc-file-input"
                                                    accept={
                                                        isImageType(docFormData.tipoDocumento)
                                                            ? ALLOWED_IMAGE_ACCEPT
                                                            : ALLOWED_ALL_ACCEPT
                                                    }
                                                    onChange={(e) => handleDocChange('archivo', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />

                                                {docFormData.archivo ? (
                                                    (() => {
                                                        const { iconColorClass, IconComponent } = getFileIconAndColor(docFormData.archivo.name);
                                                        return (
                                                            <div className="flex items-center justify-between p-2.5 bg-app-card border border-app-border rounded-lg shadow-sm">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${iconColorClass}`}>
                                                                        <IconComponent className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="text-left truncate">
                                                                        <p className="text-xs font-semibold text-app-text truncate">
                                                                            {docFormData.archivo.name}
                                                                        </p>
                                                                        <p className="text-[11px] font-mono text-app-muted">
                                                                            {formatFileSize(docFormData.archivo.size)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDocChange('archivo', null)}
                                                                    className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                                    title="Quitar archivo"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <label
                                                        htmlFor="company-doc-file-input"
                                                        className="flex flex-col items-center justify-center cursor-pointer py-3"
                                                    >
                                                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full mb-2">
                                                            <Upload className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-xs font-medium text-app-text mb-0.5">
                                                            <span className="text-blue-500 underline font-semibold">Haz clic para buscar</span> o arrastra y suelta tu archivo aquí
                                                        </p>
                                                        <p className="text-[11px] text-app-muted">
                                                            {isImageType(docFormData.tipoDocumento)
                                                                ? 'Soporta únicamente imágenes en formato JPG, PNG, WEBP o GIF'
                                                                : 'Soporta documentos en formato PDF, imágenes o hojas de cálculo'}
                                                        </p>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Indicador visual de porcentaje de subida (0% a 100%) */}
                                    {uploadProgress !== null && (
                                        <div className="w-full space-y-1.5 my-3">
                                            <div className="flex items-center justify-between text-xs font-semibold text-app-text">
                                                <span>Subiendo archivo...</span>
                                                <span className="font-mono text-blue-500">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-app-border rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-150 ease-out"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {/* AQUÍ SE ENCUENTRAN TUS BOTONES DE ACCIÓN DEL FORMULARIO */}
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDocForm(false);
                                                setDocErrors({});
                                            }}
                                            className="px-3 py-1.5 bg-app-border/40 hover:bg-app-border text-app-muted text-xs rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDocSubmit}
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                        >
                                            Guardar Documento
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TABLA DE DOCUMENTOS ATADOS A LA EMPRESA */}
                            <div className="overflow-x-auto border border-app-border rounded-lg bg-app-bg/40">
                                <table className="w-full text-left text-xs text-app-text">
                                    <thead className="bg-app-border/30 text-app-muted uppercase font-semibold text-[10px] tracking-wider border-b border-app-border">
                                        <tr>
                                            <th className="p-2.5">Título</th>
                                            <th className="p-2.5">Tipo</th>
                                            <th className="p-2.5">Tamaño</th>
                                            <th className="p-2.5">Descripción</th>
                                            <th className="p-2.5 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-app-border">
                                        {formData.documentos && formData.documentos.length > 0 ? (
                                            formData.documentos.map((doc, index) => {
                                                const { iconColorClass, IconComponent } = getFileIconAndColor(doc.nombreArchivo);
                                                return (
                                                    <tr key={doc._id || index} className="hover:bg-app-border/20 transition-colors">
                                                        <td className="p-2.5 font-medium">{doc.titulo}</td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                {doc.tipoDocumento}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 text-app-muted font-mono text-[11px]">
                                                            {/* Reemplaza doc.tamano por la propiedad exacta de tu backend (ej. doc.size o doc.bytes) */}
                                                            {formatFileSize((doc as any).tamano || (doc as any).size || (doc as any).bytes)}
                                                        </td>
                                                        <td className="p-2.5 text-app-muted max-w-xs truncate">
                                                            {doc.descripcion || 'Sin descripción'}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {doc.nombreArchivo && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => viewCompanyDocument(doc.nombreArchivo)}
                                                                        title={`Ver documento (${extSee(doc.nombreArchivo).toUpperCase()})`}
                                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${iconColorClass}`}
                                                                    >
                                                                        <IconComponent className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDocDelete(doc._id, doc.titulo || doc.nombreArchivo)}
                                                                    title="Eliminar documento"
                                                                    className="p-1 rounded text-red-500 bg-red-600/10 hover:bg-red-600/20 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            }
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-app-muted italic">
                                                    No hay documentos adjuntos guardados para esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-app-border/40 hover:bg-app-border text-app-muted hover:text-app-text rounded-lg text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                        {loading
                            ? 'Guardando...'
                            : submitButtonText || (isEditing ? 'Guardar Cambios' : 'Crear Empresa')}
                    </span>
                </button>
            </div>
        </form>
    );
};
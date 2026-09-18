// src/components/CompanyForm.tsx
import { useState, useEffect, type KeyboardEvent } from 'react';
import api from '../api/axios';
import { CheckCircle, X, ChevronDown, Building2, MapPin, Users, Briefcase, HelpCircle, Copy, Check } from 'lucide-react';
import { SectorCheckboxGroup } from './SectorCheckboxGroup';
import {
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
    OPCIONES_APOYOS
} from '../data/companyCatalog';
import { toast } from 'sonner';
import { OPCIONES_PAISES } from '../data/countryCatalog';
import { ESTADOS_MEXICO, getMunicipiosByEstado } from '../data/locationCatalog';
import {
    RFC_REGEX,
    EMAIL_REGEX,
    PHONE_REGEX,
    normalizeText,
    sanitizePhoneNumber
} from '../utils/formUtils';
import { type CompanyFormData } from '../interfaces/company.interface';

interface CompanyFormProps {
    initialValues?: Partial<CompanyFormData>;
    initialData?: Partial<CompanyFormData>;
    isEditing?: boolean;
    isPublicRegistration?: boolean;
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
    onSubmit,
    onCancel,
    submitButtonText
}: CompanyFormProps) => {
    const baseData = initialValues || initialData;

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        general: true,
        ubicacion: false,
        contactos: false,
        operacion: false,
        retos: false,
        productos: false
    });

    const [formData, setFormData] = useState<CompanyFormData>({
        correoElectronico: '',
        nombreComercial: '',
        razonSocial: '',
        rfc: '',
        tamanoEmpresa: 'Micro',
        anioInicio: new Date().getFullYear(),
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
    }, [baseData]);

    const sectoresSeleccionados = formData.informacionEmpresa.sectoresPertenece.lista;
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

    const pNacional = Number(formData.informacionEmpresa.porcentajeInversionNacional ?? 0);
    const pExtranjero = Number(formData.informacionEmpresa.porcentajeInversionExtranjero ?? 0);
    const sumaInversion = pNacional + pExtranjero;
    const isSumaInversionInvalida =
        formData.informacionEmpresa.porcentajeInversionNacional !== '' &&
        formData.informacionEmpresa.porcentajeInversionExtranjero !== '' &&
        sumaInversion !== 100;

    const validateForm = (): boolean => {
        const newErrors: Record<string, boolean> = {};

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
                retos: !!(newErrors.retosActuales || newErrors['apoyosYNecesidades.tipos'] || newErrors['apoyosYNecesidades.otroEspecifique'])
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
    w-full bg-slate-900 border rounded-lg p-2.5 text-sm text-white focus:outline-none transition-colors
    ${errors[fieldName]
            ? 'border-red-500 focus:border-red-500 bg-red-500/5'
            : 'border-slate-700 focus:border-blue-500'
        }
  `;

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* 1. SECCIÓN: DATOS GENERALES */}
            <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleSection('general')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span>Datos Generales</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.general ? 'rotate-180' : ''}`} />
                </button>

                {openSections.general && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700/50">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Correo Electrónico Institucional <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.correoElectronico}
                                onChange={(e) => handleChange('correoElectronico', e.target.value)}
                                className={getInputClass('correoElectronico')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Nombre Comercial <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nombreComercial}
                                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                                className={getInputClass('nombreComercial')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Razón Social <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.razonSocial}
                                onChange={(e) => handleChange('razonSocial', e.target.value)}
                                className={getInputClass('razonSocial')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                RFC <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tamaño de Empresa <span className="text-red-400">*</span></label>
                            <select
                                value={formData.tamanoEmpresa}
                                onChange={(e) => handleChange('tamanoEmpresa', e.target.value)}
                                className={getInputClass('tamanoEmpresa')}
                            >
                                <option value="Micro">Micro</option>
                                <option value="Pequeña">Pequeña</option>
                                <option value="Mediana">Mediana</option>
                                <option value="Grande">Grande</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Año de Inicio <span className="text-red-400">*</span></label>
                            <input
                                type="number"
                                value={formData.anioInicio}
                                onChange={(e) => handleChange('anioInicio', Number(e.target.value))}
                                className={getInputClass('anioInicio')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Sitio Web</label>
                            <input
                                type="url"
                                placeholder="https://ejemplo.com"
                                value={formData.sitioWeb}
                                onChange={(e) => handleChange('sitioWeb', e.target.value)}
                                className={getInputClass('sitioWeb')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Presentación Comercial (Link de Google Drive)</label>
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
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Etiquetas</label>
                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus-within:border-blue-500 transition-colors">
                                        {tagList.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {tagList.map((tag, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        {tag}
                                                        <button type="button" onClick={() => removeTag(idx)} className="text-blue-300 hover:text-white transition-colors">
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
                                            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-y"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Estado de la Cuenta</label>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('activa', !formData.activa)}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${formData.activa
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${formData.activa ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        {formData.activa ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 2. SECCIÓN: UBICACIÓN */}
            <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleSection('ubicacion')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>Ubicación</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.ubicacion ? 'rotate-180' : ''}`} />
                </button>

                {openSections.ubicacion && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700/50">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Estado <span className="text-red-400">*</span>
                            </label>
                            <select value={formData.ubicacion.estado} onChange={handleEstadoChange} className={getInputClass('ubicacion.estado')}>
                                <option value="">-- Selecciona un Estado --</option>
                                {ESTADOS_MEXICO.map((item) => (
                                    <option key={item.estado} value={item.estado}>
                                        {item.estado}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Municipio <span className="text-red-400">*</span>
                            </label>
                            <select
                                disabled={!formData.ubicacion.estado}
                                value={formData.ubicacion.municipio}
                                onChange={(e) => handleChange('ubicacion.municipio', e.target.value)}
                                className={`${getInputClass('ubicacion.municipio')} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <option value="">{formData.ubicacion.estado ? '-- Selecciona un Municipio --' : '-- Primero elige un Estado --'}</option>
                                {municipiosDisponibles.map((muni) => (
                                    <option key={muni} value={muni}>{muni}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Dirección (Calle y Número) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.direccion}
                                onChange={(e) => handleChange('ubicacion.direccion', e.target.value)}
                                className={getInputClass('ubicacion.direccion')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Colonia <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.colonia}
                                onChange={(e) => handleChange('ubicacion.colonia', e.target.value)}
                                className={getInputClass('ubicacion.colonia')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Código Postal <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.ubicacion.codigoPostal}
                                onChange={(e) => handleChange('ubicacion.codigoPostal', e.target.value)}
                                className={getInputClass('ubicacion.codigoPostal')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Parque Industrial (Opcional)</label>
                            <input
                                type="text"
                                value={formData.ubicacion.parqueIndustrial || ''}
                                onChange={(e) => handleChange('ubicacion.parqueIndustrial', e.target.value)}
                                className={getInputClass('ubicacion.parqueIndustrial')}
                            />
                        </div>

                        {(isEditing || !isPublicRegistration) && (<>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
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
                                <label className="block text-xs font-medium text-slate-400 mb-1">
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
                        </>)
                        }
                    </div>
                )}
            </div>

            {/* 3. SECCIÓN: CONTACTOS */}
            <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleSection('contactos')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>Contactos</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.contactos ? 'rotate-180' : ''}`} />
                </button>

                {openSections.contactos && (
                    <div className="p-4 space-y-4 border-t border-slate-700/50">
                        {/* Director General */}
                        <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg space-y-3">
                            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Director General (Obligatorio)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Nombre Completo *"
                                    value={formData.contactos.directorGeneral.nombreCompleto}
                                    onChange={(e) => handleChange('contactos.directorGeneral.nombreCompleto', e.target.value)}
                                    className={getInputClass('contactos.directorGeneral.nombreCompleto')}
                                />
                                <input
                                    type="email"
                                    placeholder="Correo Electrónico *"
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
                            <div key={area} className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Contacto de {area === 'recursosHumanos' ? 'Recursos Humanos' : area}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => copyDirectorData(area)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md hover:bg-blue-500/20 hover:text-blue-300 transition-colors w-fit"
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
            <div className={`border border-slate-700/80 rounded-lg bg-slate-900/40 ${openSections.operacion ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                    type="button"
                    onClick={() => toggleSection('operacion')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left rounded-t-lg"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>Información acerca de la empresa</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.operacion ? 'rotate-180' : ''}`} />
                </button>

                {openSections.operacion && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700/50 overflow-visible">
                        {/* Tipo de Operaciones */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Tipo de Operaciones <span className="text-red-400">*</span>
                            </label>
                            <div className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-colors ${errors.tipoOperaciones ? 'border-red-500 bg-red-500/5' : 'border-transparent'
                                }`}>
                                {OPCIONES_OPERACIONES.map((op) => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => toggleArrayItem('tipoOperaciones', op)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.tipoOperaciones.includes(op)
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : errors.tipoOperaciones
                                                ? 'bg-slate-900 border-red-500/50 text-slate-400'
                                                : 'bg-slate-900 border-slate-700 text-slate-400'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tipo de Suministro */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Tipo de Suministro <span className="text-red-400">*</span>
                            </label>
                            <div className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-colors ${errors.tipoSuministro ? 'border-red-500 bg-red-500/5' : 'border-transparent'
                                }`}>
                                {OPCIONES_SUMINISTRO.map((op) => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => selectSingleOption('tipoSuministro', op)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.tipoSuministro.includes(op)
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : errors.tipoSuministro
                                                ? 'bg-slate-900 border-red-500/50 text-slate-400'
                                                : 'bg-slate-900 border-slate-700 text-slate-400'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Productos o Servicios */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Productos o Servicios que Fabrica / Ofrece <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">Principales Clientes</label>
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
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    País de Origen <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.informacionEmpresa.paisOrigen}
                                    onChange={(e) => handleChange('informacionEmpresa.paisOrigen', e.target.value)}
                                    className={getInputClass('informacionEmpresa.paisOrigen')}
                                >
                                    <option value="">Selecciona un país</option>
                                    {OPCIONES_PAISES.map((pais) => (
                                        <option key={pais.iso2} value={pais.nombre}>
                                            {pais.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Campo condicional para especificar el país si eligen "Otro" */}
                            {formData.informacionEmpresa.paisOrigen === 'Otro' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Especifique el País de Origen <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Porcentaje de inversión nacional (%) <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Porcentaje de inversión extranjero (%) <span className="text-red-400">*</span>
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

                        {(isSumaInversionInvalida || errors.porcentajeInversionSumaInvalid) && (
                            <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 font-medium">
                                ⚠️ La suma del porcentaje de inversión nacional y extranjero debe ser igual a 100% (Suma actual: {sumaInversion}%).
                            </div>
                        )}

                        {/* Certificaciones (OPCIONAL) */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Certificaciones
                            </label>
                            <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                {OPCIONES_CERTIFICACIONES.map((cert) => {
                                    const isChecked = formData.informacionEmpresa.certificaciones.lista.includes(cert);
                                    return (
                                        <div key={cert} className="flex flex-col gap-2">
                                            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('informacionEmpresa.certificaciones.lista', cert)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-950 accent-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer scheme-dark"
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
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Sector(es) al(los) que pertenece(n): <span className="text-red-400">*</span>
                            </label>
                            <div className={`space-y-2 bg-slate-900/60 p-3 rounded-lg border transition-colors ${errors['informacionEmpresa.sectoresPertenece.lista']
                                ? 'border-red-500 bg-red-500/5'
                                : 'border-slate-800'
                                }`}>
                                {OPCIONES_SECTORES.map((sec) => {
                                    const isChecked = formData.informacionEmpresa.sectoresPertenece.lista.includes(sec);
                                    return (
                                        <div key={sec} className="flex flex-col gap-2">
                                            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('informacionEmpresa.sectoresPertenece.lista', sec)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-950 accent-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer scheme-dark"
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

                        {/* Principal Sector al que Atiende + Porcentaje de Exportaciones */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Principal sector al que atiende <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={formData.informacionEmpresa.principalSectorAtiende}
                                onChange={(e) => handleChange('informacionEmpresa.principalSectorAtiende', e.target.value)}
                                disabled={opcionesPrincipalSector.length === 0}
                                className={`${getInputClass('informacionEmpresa.principalSectorAtiende')} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <option value="">
                                    {opcionesPrincipalSector.length > 0
                                        ? '-- Selecciona un sector principal --'
                                        : '-- Selecciona primero al menos un sector arriba --'}
                                </option>
                                {opcionesPrincipalSector.map((sec, idx) => (
                                    <option key={idx} value={sec}>
                                        {sec}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Porcentaje de exportaciones (%) <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Favor de especificar el destino de sus exportaciones:
                            </label>
                            <div className="relative">
                                <div
                                    className="w-full min-h-10.5 p-2 bg-slate-900 border border-slate-700 rounded-lg focus-within:border-blue-500 flex flex-wrap items-center gap-1.5 cursor-text transition-colors"
                                    onClick={() => setIsCountryDropdownOpen(true)}
                                >
                                    {(formData.informacionEmpresa.destinoExportaciones || []).map((country) => (
                                        <span
                                            key={country}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        >
                                            {country}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExportDestination(country);
                                                }}
                                                className="hover:text-white transition-colors focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}

                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none p-1 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 min-w-37.5"
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

                                    <ChevronDown className="w-4 h-4 text-slate-400 mr-1 pointer-events-none" />
                                </div>

                                {isCountryDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsCountryDropdownOpen(false)}
                                        />

                                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
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
                                                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-slate-300'
                                                                }`}
                                                        >
                                                            <span>{pais.nombre}</span>
                                                            {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-3 py-2 text-xs text-slate-500">
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
                <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/40">
                    <button
                        type="button"
                        onClick={() => toggleSection('productos')}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <HelpCircle className="w-4 h-4 text-blue-400" />
                            <span>Información de los productos o servicios que ofrecen</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.productos ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.productos && (
                        <div className="p-4 space-y-4 border-t border-slate-700/50">
                            {SECTORES_CONFIG.map((sector) => {
                                const isVisible = sector.matchSectores.some((s) => sectoresSeleccionados.includes(s));

                                if (!isVisible) return null;

                                const sectorData = formData.informacionEmpresa[sector.keyName] as {
                                    lista: string[];
                                    otroEspecifique?: string;
                                };

                                return (
                                    <SectorCheckboxGroup
                                        key={sector.id}
                                        isVisible={true}
                                        title={sector.title}
                                        colorTheme={sector.colorTheme}
                                        options={sector.options}
                                        selectedItems={sectorData.lista}
                                        otherValue={sectorData.otroEspecifique}
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
            <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleSection('retos')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                        <span>Retos y Apoyos</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.retos ? 'rotate-180' : ''}`} />
                </button>

                {openSections.retos && (
                    <div className="p-4 space-y-4 border-t border-slate-700/50">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Retos Actuales de la Empresa <span className="text-red-400">*</span>
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
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Apoyos y Necesidades Requeridos <span className="text-red-400">*</span>
                            </label>
                            <div className={`space-y-2.5 bg-slate-900/60 p-3 rounded-lg border transition-colors ${errors['apoyosYNecesidades.tipos']
                                ? 'border-red-500 bg-red-500/5'
                                : 'border-slate-800'
                                }`}>
                                {OPCIONES_APOYOS.map((apoyo) => {
                                    const isChecked = formData.apoyosYNecesidades.tipos.includes(apoyo);
                                    return (
                                        <div key={apoyo} className="flex flex-col gap-2">
                                            <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleArrayItem('apoyosYNecesidades.tipos', apoyo)}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-950 accent-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer scheme-dark"
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

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50"
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
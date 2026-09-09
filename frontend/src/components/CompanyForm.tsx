// src/components/CompanyForm.tsx
import { useState, useEffect, type KeyboardEvent } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS_MEXICO, getMunicipiosByEstado } from '../data/locationCatalog';

// Regex de RFC
const RFC_REGEX = /^([A-ZÑ&]{3,4})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([A-Z0-9]{3})$/i;

export interface CompanyFormData {
    nombreComercial: string;
    razonSocial: string;
    rfc: string;
    tamanoEmpresa: string;
    anioInicio: number;
    sitioWeb: string;
    etiquetas: string;
    estado: string;
    municipio: string;
    activo?: boolean;
}

interface CompanyFormProps {
    initialValues?: Partial<CompanyFormData>;
    initialData?: Partial<CompanyFormData>;
    isEditing?: boolean;
    isPublicRegistration?: boolean;
    onSubmit: (data: CompanyFormData) => Promise<void> | void;
    onCancel?: () => void;
    submitButtonText?: string;
}

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

    const [formData, setFormData] = useState<CompanyFormData>({
        nombreComercial: '',
        razonSocial: '',
        rfc: '',
        tamanoEmpresa: 'Micro',
        anioInicio: new Date().getFullYear(),
        sitioWeb: '',
        etiquetas: '',
        estado: '',
        municipio: '',
        activo: true,
        ...baseData
    });

    // Estado local para la lista de etiquetas renderizadas como badges
    const [tagList, setTagList] = useState<string[]>([]);
    // Estado local para el texto que el usuario está escribiendo en el textarea
    const [tagInput, setTagInput] = useState<string>('');

    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    // Inicializar etiquetas desde initialData o baseData
    useEffect(() => {
        if (baseData) {
            setFormData((prev) => ({
                ...prev,
                ...baseData,
                activo: baseData.activo ?? prev.activo ?? true
            }));

            if (baseData.etiquetas) {
                const initialTags = baseData.etiquetas
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t !== '');
                setTagList(initialTags);
            }
        }
    }, [baseData]);

    const municipiosDisponibles = getMunicipiosByEstado(formData.estado);

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoEstado = e.target.value;
        setFormData((prev) => ({
            ...prev,
            estado: nuevoEstado,
            municipio: ''
        }));
        if (nuevoEstado) {
            setErrors((prev) => ({ ...prev, estado: false }));
        }
    };

    const handleChange = (field: keyof CompanyFormData, value: any) => {
        const val = field === 'rfc' ? String(value).toUpperCase() : value;

        setFormData((prev) => ({ ...prev, [field]: val }));
        if (val) {
            setErrors((prev) => ({ ...prev, [field]: false }));
        }
    };

    // Función para agregar etiqueta al presionar coma o Enter
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, boolean> = {};

        if (!formData.nombreComercial.trim()) newErrors.nombreComercial = true;
        if (!formData.razonSocial.trim()) newErrors.razonSocial = true;

        if (!formData.rfc.trim() || !RFC_REGEX.test(formData.rfc.trim())) {
            newErrors.rfc = true;
        }

        if (!formData.estado.trim()) newErrors.estado = true;
        if (!formData.municipio.trim()) newErrors.municipio = true;
        if (!formData.anioInicio) newErrors.anioInicio = true;

        setErrors(newErrors);

        if (newErrors.rfc && formData.rfc.trim() !== '') {
            toast.error('El formato del RFC no es válido.');
            return false;
        }

        if (Object.keys(newErrors).length > 0) {
            toast.error('Por favor, completa los campos obligatorios en rojo.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Si quedó algo sin convertir en el textarea al hacer submit, lo agregamos
        let finalTags = [...tagList];
        if (tagInput.trim()) {
            const extraTag = tagInput.replace(/,/g, '').trim();
            if (extraTag && !finalTags.some((t) => t.toLowerCase() === extraTag.toLowerCase())) {
                finalTags.push(extraTag);
            }
        }

        // Ordenar alfabéticamente ignorando mayúsculas/minúsculas
        finalTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

        const updatedFormData: CompanyFormData = {
            ...formData,
            etiquetas: finalTags.join(', ')
        };

        try {
            setLoading(true);
            await onSubmit(updatedFormData);

            toast.success(
                isPublicRegistration
                    ? 'Solicitud enviada. Pendiente de aprobación.'
                    : isEditing
                        ? 'Empresa actualizada exitosamente'
                        : 'Empresa creada exitosamente'
            );
        } catch (error: any) {
            console.log('Datos devueltos por la API:', error.response?.data);
            const responseData = error.response?.data;

            if (responseData?.errors && Array.isArray(responseData.errors)) {
                const newErrorsState: Record<string, boolean> = {};
                responseData.errors.forEach((err: { field: string; message: string }) => {
                    toast.error(err.message);
                    if (err.field) {
                        newErrorsState[err.field] = true;
                    }
                });
                setErrors((prev) => ({ ...prev, ...newErrorsState }));
            } else {
                const mensajeError = responseData?.message || error.message || 'Error al procesar la solicitud.';
                toast.error(mensajeError);
            }
        } finally {
            setLoading(false);
        }
    };

    const getInputClass = (fieldName: keyof CompanyFormData) => `
    w-full bg-slate-900 border rounded-lg p-2.5 text-sm text-white focus:outline-none transition-colors
    ${errors[fieldName]
            ? 'border-red-500 focus:border-red-500 bg-red-500/5'
            : 'border-slate-700 focus:border-blue-500'
        }
  `;

    return (
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {errors.rfc && (
                    <p className="text-[11px] text-red-400 mt-1">
                        Ingresa un RFC válido de 12 o 13 caracteres.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tamaño</label>
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
                <label className="block text-xs font-medium text-slate-400 mb-1">
                    Estado <span className="text-red-400">*</span>
                </label>
                <select
                    value={formData.estado}
                    onChange={handleEstadoChange}
                    className={getInputClass('estado')}
                >
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
                    disabled={!formData.estado}
                    value={formData.municipio}
                    onChange={(e) => handleChange('municipio', e.target.value)}
                    className={`${getInputClass('municipio')} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    <option value="">
                        {formData.estado ? '-- Selecciona un Municipio --' : '-- Primero elige un Estado --'}
                    </option>
                    {municipiosDisponibles.map((muni) => (
                        <option key={muni} value={muni}>
                            {muni}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                    Año de Inicio <span className="text-red-400">*</span>
                </label>
                <input
                    type="number"
                    value={formData.anioInicio}
                    onChange={(e) => handleChange('anioInicio', Number(e.target.value))}
                    className={getInputClass('anioInicio')}
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sitio Web (Opcional)</label>
                <input
                    type="url"
                    placeholder="https://ejemplo.com"
                    value={formData.sitioWeb}
                    onChange={(e) => handleChange('sitioWeb', e.target.value)}
                    className={getInputClass('sitioWeb')}
                />
            </div>




            {!isPublicRegistration && (
                <>
                    {/* Campo de Etiquetas interactivo con Badges y TextArea */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Etiquetas
                        </label>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus-within:border-blue-500 transition-colors">
                            {/* Visualización de Badges/Chips */}
                            {tagList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {tagList.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(idx)}
                                                className="text-blue-300 hover:text-white transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Area de texto para agregar etiquetas */}
                            <textarea
                                rows={2}
                                placeholder="Escribe una etiqueta y presiona coma (,) o Enter..."
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-y"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Separa las etiquetas mediante comas (,) o presionando la tecla Enter. Se ordenarán alfabéticamente al guardar.
                        </p>
                    </div>

                    {/* Botón de Estado */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Estado de la Cuenta
                        </label>
                        <button
                            type="button"
                            onClick={() => handleChange('activo', !formData.activo)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${formData.activo
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${formData.activo ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {formData.activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                        </button>
                    </div>
                </>

            )}

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
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
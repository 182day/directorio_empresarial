// src/utils/formUtils.ts
import { FileText, Image, type LucideIcon } from 'lucide-react';

export interface FileIconAndColor {
    iconColorClass: string;
    IconComponent: LucideIcon;
}

// Función helper para dar formato al tamaño en bytes (puedes ubicarla dentro del archivo o en formUtils.ts)
export const formatFileSize = (bytes?: number): string => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    const k = 1024;
    const sizes = ['KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i - 1]}`;
};

// --- EXPRESIONES REGULARES ---
export const RFC_REGEX = /^([A-ZÑ&]{3,4})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([A-Z0-9]{3})$/i;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;

// --- FUNCIONES HELPER / FORMATTER ---

export const formatUrl = (url: string) => {
  if (!url) return '';
  const trimmedUrl = url.trim();
  // Si ya empieza con http:// o https:// se deja tal cual, de lo contrario se le antepone https://
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

/**
 * Normaliza un texto convirtiéndolo a minúsculas y removiendo acentos/tildes.
 * Útil para autocompletados y búsquedas.
 */
export const normalizeText = (text: string): string =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

export const normalizeKey = (text: string) =>
    text
        ? text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Quita acentos
            .replace(/\s+/g, "")             // Quita espacios
        : "";

/**
 * Filtra solo caracteres numéricos y limita la longitud.
 * Útil para inputs de teléfono o código postal.
 */
export const sanitizePhoneNumber = (value: string, maxLength: number = 10): string =>
    value.replace(/\D/g, '').slice(0, maxLength);

// src/utils/formUtils.ts

/**
 * Convierte cualquier formato de fecha al formato 'YYYY-MM-DD'
 * compatible con <input type="date">.
 */
export const formatDateForInput = (dateValue?: string | Date | null): string => {
  if (!dateValue) return new Date().toISOString().split('T')[0];

  try {
    const d = new Date(dateValue);
    
    // Si la fecha resultante no es válida (Invalid Date)
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    // Extraemos año, mes y día ajustados localmente
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Formatea una fecha en formato largo personalizado: "Viernes 18, Septiembre 2026"
 * @param fecha ISO string, Date object o string compatible
 */
export const formatFechaLarga = (fecha?: string | Date | null): string => {
    if (!fecha) return 'Fecha no especificada';

    // Evita desfases por zona horaria dividiendo la cadena YYYY-MM-DD
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';

    // Formatear día de la semana (ej. "viernes")
    const diaSemana = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(dateObj);

    // Formatear mes (ej. "septiembre")
    const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(dateObj);

    const dia = dateObj.getUTCDate();
    const anio = dateObj.getUTCFullYear();

    // Capitalizar día y mes
    const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

    return `${diaCapitalizado} ${dia}, ${mesCapitalizado} ${anio}`;
};

// Extensión y tipos permitidos
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
export const ALLOWED_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif';

export const ALLOWED_ALL_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.csv', '.gif', '.doc', '.docx', '.ppt', '.pptx']; 
export const ALLOWED_ALL_ACCEPT = 'image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

// Helper para saber si el tipo de documento requiere únicamente imágenes
export const isImageType = (tipo?: string) => tipo === 'Logotipo' || tipo === 'Fotografía';

export const extSee = (archivo?: string) => archivo?.split('.').pop()?.toLowerCase() || '';
export const getFileIconAndColor = (fileName: string = ''): FileIconAndColor => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    let iconColorClass = "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20";
    let IconComponent: LucideIcon = FileText;

    if (ext === 'pdf') {
        iconColorClass = "bg-red-600/10 text-red-500 hover:bg-red-600/20";
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        iconColorClass = "bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20";
    } else if (['ppt', 'pptx'].includes(ext)) {
        iconColorClass = "bg-orange-600/10 text-orange-500 hover:bg-orange-600/20";
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        iconColorClass = "bg-purple-600/10 text-purple-500 hover:bg-purple-600/20";
        IconComponent = Image;
    }

    return { iconColorClass, IconComponent };
};
// src/utils/formUtils.ts

// --- EXPRESIONES REGULARES ---
export const RFC_REGEX = /^([A-ZÑ&]{3,4})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([A-Z0-9]{3})$/i;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;

// --- FUNCIONES HELPER / FORMATTER ---

/**
 * Normaliza un texto convirtiéndolo a minúsculas y removiendo acentos/tildes.
 * Útil para autocompletados y búsquedas.
 */
export const normalizeText = (text: string): string =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

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
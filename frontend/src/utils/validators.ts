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
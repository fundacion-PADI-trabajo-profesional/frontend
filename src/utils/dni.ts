/**
 * Utilidades para el campo `dni` de una persona.
 *
 * El campo admite dos cosas:
 * - un DNI real: solo dígitos (ej. "45123456");
 * - un **identificador interno** asignado por el colegio cuando el alumno no
 *   tiene DNI disponible: letras del colegio más un número correlativo
 *   (ej. "SM000001"). Para la app es un texto opaco y único; no se interpreta
 *   qué colegio representa el prefijo (ver ADR-0017).
 *
 * La distinción es puramente sintáctica: cualquier valor con letras es un
 * identificador interno.
 */

/**
 * Normaliza lo que se escribe en el campo DNI antes de enviarlo al backend:
 * mayúsculas y solo letras y dígitos (quita espacios, guiones, puntos, etc.).
 *
 * Así "sm-000001", "sm 000001" y "SM000001" son el mismo alumno, y un DNI real
 * escrito como "45.123.456" queda como "45123456".
 *
 * @returns el valor normalizado, o `null` si no queda nada útil.
 */
export function normalizarDni(valor: unknown): string | null {
    if (valor === null || valor === undefined) return null;
    const limpio = String(valor).toUpperCase().replace(/[^A-Z0-9]/g, "");
    return limpio.length > 0 ? limpio : null;
}

/** `true` si el valor es un identificador interno (tiene letras) y no un DNI real. */
export function esIdentificadorInterno(dni: string | null | undefined): boolean {
    return !!dni && !/^\d+$/.test(dni);
}

/**
 * Texto para mostrar el campo en pantalla, distinguiendo un DNI real de un
 * identificador interno para que nadie copie el código creyendo que es un documento.
 */
export function etiquetaDni(dni: string | null | undefined): string {
    if (!dni) return "Sin DNI";
    return esIdentificadorInterno(dni) ? `ID interno: ${dni}` : `DNI: ${dni}`;
}

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

/**
 * Convención para armar el identificador interno cuando el alumno no tiene DNI,
 * acordada con la Fundación (ADR-0017). La app no la valida: es solo la guía
 * que se muestra en el alta individual y en la plantilla de carga masiva.
 */
export const ID_INTERNO = {
    ejemplo: "SM040621RM",
    pasos: [
        "Las letras del jardín, asignadas por PADI (ej. SM para Santa María).",
        "La fecha de nacimiento como día, mes y año de dos cifras cada uno (ej. 4 de junio de 2021 → 040621).",
        "La inicial del nombre y la inicial del apellido (ej. Ramiro Martínez → RM).",
    ],
    resumen: "letras del jardín + fecha de nacimiento como DDMMAA + inicial del nombre e inicial del apellido, todo junto, sin espacios ni guiones y en mayúsculas",
    ayuda: "letras del jardín + fecha de nacimiento DDMMAA + inicial del nombre e inicial del apellido, ej. SM040621RM",
} as const;

/** Identificadores que aparecen más de una vez en una lista, con las posiciones (desde 1) en que aparecen. */
export function dnisRepetidos(dnis: (string | null | undefined)[]): { dni: string; filas: number[] }[] {
    const posiciones = new Map<string, number[]>();
    dnis.forEach((dni, i) => {
        if (!dni) return;
        const lista = posiciones.get(dni) ?? [];
        lista.push(i + 1);
        posiciones.set(dni, lista);
    });
    return Array.from(posiciones.entries())
        .filter(([, filas]) => filas.length > 1)
        .map(([dni, filas]) => ({ dni, filas }));
}

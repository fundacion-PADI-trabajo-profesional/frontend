/**
 * Normalización de la columna "Genero" de la carga masiva.
 *
 * El catálogo de géneros usa ids de una letra (M, F, X). Los colegios escriben
 * de todo ("Masculino", "f", "Varón"), y un valor que no existe en el catálogo
 * hace fallar el alta del alumno en la base. Acá se lleva cualquier forma
 * habitual a la letra; lo que no se reconoce devuelve `null` para que la fila
 * se marque como inválida antes de enviar.
 */

const EQUIVALENCIAS: Record<string, string> = {
    M: "M", MASCULINO: "M", VARON: "M", HOMBRE: "M", NENE: "M", NINO: "M",
    F: "F", FEMENINO: "F", MUJER: "F", NENA: "F", NINA: "F",
    X: "X", OTRO: "X", "NO BINARIO": "X", NB: "X",
};

/** Lleva lo escrito en la columna Genero a la letra del catálogo, o `null` si no se reconoce. */
export function normalizarGenero(valor: unknown): string | null {
    if (valor === null || valor === undefined) return null;
    const clave = String(valor)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ");
    if (clave.length === 0) return null;
    return EQUIVALENCIAS[clave] ?? null;
}

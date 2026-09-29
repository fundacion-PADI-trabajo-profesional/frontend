/**
 * Reglas puras de la carga masiva de alumnos: cómo se nombra un aula en la
 * plantilla y cómo se resuelve a partir de lo que dice cada fila del Excel.
 *
 * Están fuera del componente para poder testearlas con casos reales, como un
 * jardín con tres aulas "TM - Mañana" (una por sala).
 */

export interface AulaCandidata {
    escuela_id: string;
    aula_id: string;
    sala_id: number;
}

/** Etiqueta del desplegable "Colegio / Aula". Lleva la sala: sin ella, dos aulas del mismo turno se llaman igual. */
export function etiquetaAula(escuelaNombre: string, aula: { sala_id: number; comision: string; turno: string }): string {
    return `${escuelaNombre} - Sala ${aula.sala_id} - ${aula.comision} - ${aula.turno}`;
}

/** Etiqueta de las plantillas anteriores, sin sala. Se sigue aceptando al leer. */
export function etiquetaAulaAnterior(escuelaNombre: string, aula: { comision: string; turno: string }): string {
    return `${escuelaNombre} - ${aula.comision} - ${aula.turno}`;
}

/**
 * Elige el aula para una fila entre las que coinciden con su etiqueta.
 * Si varias comparten etiqueta (plantilla vieja), gana la de la sala del alumno.
 * Si ninguna es de esa sala, el backend la rechazaría: se conserva el colegio y
 * se marca `incompatible` para frenar la fila antes de enviar.
 */
export function resolverAula(
    candidatas: AulaCandidata[],
    salaId: number | null,
): { escuela_id: string; aula_id: string | null; incompatible: boolean } | null {
    if (candidatas.length === 0) return null;
    const compatible = candidatas.find((c) => c.sala_id === salaId);
    if (compatible) return { escuela_id: compatible.escuela_id, aula_id: compatible.aula_id, incompatible: false };
    return { escuela_id: candidatas[0].escuela_id, aula_id: null, incompatible: true };
}

/**
 * Datos para abrir la pantalla de revisión de un área a partir de la ficha
 * de la evaluación ya recargada. Tipado estructural para no depender de
 * `EvaluacionInstancia` completo.
 */

export interface AreaDeFicha {
    id: string;
    nombre: string;
    estadoId: string;
    aciertosIndividuales?: number | null;
    totalPreguntas?: number | null;
}

export interface DatosRevision {
    id: string;
    nombre: string;
    score: number;
    total: number;
    statusId: string;
}

export function datosRevisionDeArea(
    evaluacion: { areas?: AreaDeFicha[] | null } | null | undefined,
    areaId: string,
): DatosRevision | null {
    const area = evaluacion?.areas?.find((a) => a.id === areaId);
    if (!area) return null;
    return {
        id: area.id,
        nombre: area.nombre,
        score: area.aciertosIndividuales ?? 0,
        total: area.totalPreguntas ?? 0,
        statusId: area.estadoId,
    };
}

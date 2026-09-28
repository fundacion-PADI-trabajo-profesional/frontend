/**
 * Reglas de presentación de las respuestas Sí/No de una pauta.
 *
 * Una pregunta "invertida" (`puntaje_invertido`, típicamente las del área
 * socioemocional) suma punto cuando la respuesta es NO. Para que los colores
 * no confundan, el criterio visual es uno solo: **verde = esa respuesta suma
 * punto, rojo = no suma**, sea Sí o No.
 */

/** Verdadero si la respuesta suma punto: SÍ en preguntas normales, NO en invertidas. */
export function respuestaSumaPunto(
    respuesta: number | null | undefined,
    invertida?: boolean | null,
): boolean {
    if (respuesta !== 0 && respuesta !== 1) return false;
    return invertida ? respuesta === 0 : respuesta === 1;
}

export interface PaletaBoton {
    color: string;
    borderColor: string;
    hoverBg: string;
}

export const PALETA_SUMA: PaletaBoton = { color: "#22c55e", borderColor: "#dcfce7", hoverBg: "#f0fdf4" };
export const PALETA_NO_SUMA: PaletaBoton = { color: "#ef4444", borderColor: "#fee2e2", hoverBg: "#fef2f2" };

/** Colores del botón Sí (1) o No (0) del wizard: verde si esa respuesta suma punto, rojo si no. */
export function paletaBotonRespuesta(valor: 0 | 1, invertida?: boolean | null): PaletaBoton {
    return respuestaSumaPunto(valor, invertida) ? PALETA_SUMA : PALETA_NO_SUMA;
}

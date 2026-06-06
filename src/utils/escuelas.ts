/**
 * Utilidades puras para la presentación de escuelas.
 */

export interface DirectivoNombre {
  nombre: string;
  apellido: string;
}

/**
 * Devuelve la etiqueta de director(es) de una escuela para mostrar en listados.
 *
 * Una escuela puede tener más de un director, así que se listan todos
 * (separados por coma), no solo el primero.
 *
 * @param directivos - Directores de la escuela (puede ser undefined o vacío).
 * @returns Los nombres completos separados por ", ", o "Sin director asignado" si no hay.
 */
export function formatDirectores(directivos?: DirectivoNombre[]): string {
  if (!directivos?.length) return "Sin director asignado";
  return directivos.map((d) => `${d.nombre} ${d.apellido}`).join(", ");
}

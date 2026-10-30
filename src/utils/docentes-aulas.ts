import type { Aula } from "../api/aulas";

export function filtrarAulasParaEstudiante(
  aulas: Aula[],
  escuelaId: string,
  salaId: string,
): Aula[] {
  return aulas.filter(
    (a) =>
      a.escuela_id === escuelaId &&
      (!salaId || String(a.sala_id) === salaId),
  );
}

export function filtrarAulasDisponibles(
  todasLasAulas: Aula[],
  docente: { escuelas?: { id: string }[]; aulas?: { id: string }[] },
): Aula[] {
  const escuelaIds = new Set((docente.escuelas || []).map((e) => e.id));
  const asignadasIds = new Set((docente.aulas || []).map((a) => a.id));
  return todasLasAulas.filter(
    (a) => escuelaIds.has(a.escuela_id) && !asignadasIds.has(a.id),
  );
}

/** "4° - A (Mañana)": cómo se nombra un aula en los selectores. */
export function etiquetaAula(aula: Pick<Aula, "comision" | "turno" | "sala">): string {
  return `${aula.sala?.grado ?? "?"}° - ${aula.comision} (${aula.turno})`;
}

export interface ResumenAsignaciones {
  asignadas: number;
  fallidas: string[];
  /** Listo para mostrar; null si salió todo bien. */
  mensajeError: string | null;
}

/**
 * Resume el resultado de asignar varias aulas a la vez (una llamada por aula):
 * cuántas salieron y cuáles fallaron, con un mensaje para la pantalla.
 */
export function resumenAsignaciones(resultados: PromiseSettledResult<unknown>[], etiquetas: string[]): ResumenAsignaciones {
  const fallidas = etiquetas.filter((_, i) => resultados[i]?.status === "rejected");
  const asignadas = resultados.length - fallidas.length;
  const mensajeError = fallidas.length === 0
    ? null
    : asignadas === 0
      ? `No se pudo asignar ${fallidas.length === 1 ? "el aula" : "ninguna de las aulas"}: ${fallidas.join(", ")}.`
      : `Se asignaron ${asignadas} de ${resultados.length} aulas. No se pudo asignar: ${fallidas.join(", ")}.`;
  return { asignadas, fallidas, mensajeError };
}

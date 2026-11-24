/** Lo que un área necesita para dibujar su anillo en el historial. */
export interface AreaConAvance {
  estadoId: string;
  /** Pautas respondidas por completo. Avance de carga, no resultado. */
  pautasRespondidas?: number;
  /** Pautas activas del área. */
  totalPreguntas?: number;
}

export type EstadoAnillo = "aprobada" | "desaprobada" | "en_progreso" | "sin_empezar";

export interface Anillo {
  estado: EstadoAnillo;
  /** Cuánto se llena el anillo, 0 a 100. */
  porcentaje: number;
  /** Texto del centro ("5 de 9"), o null si va un ícono o no hay datos de avance. */
  centro: string | null;
  leyenda: string;
}

/**
 * Qué muestra el anillo de un área en el historial de un alumno.
 *
 * Un área terminada no muestra números: "7 de 10" al lado de un tilde se lee como una nota, y es
 * avance de carga. El número aparece sólo mientras el área se está cargando, con cuántas faltan.
 */
export function anilloDeArea(area: AreaConAvance): Anillo {
  const estadoId = (area.estadoId || "").toUpperCase();
  if (estadoId === "A" || estadoId === "C") return { estado: "aprobada", porcentaje: 100, centro: null, leyenda: "Aprobada" };
  if (estadoId === "D") return { estado: "desaprobada", porcentaje: 100, centro: null, leyenda: "Desaprobada" };

  const total = area.totalPreguntas ?? 0;
  const respondidas = Math.min(area.pautasRespondidas ?? 0, total);
  const enProgreso = estadoId === "E" || respondidas > 0;

  if (total === 0) {
    return { estado: enProgreso ? "en_progreso" : "sin_empezar", porcentaje: 0, centro: null, leyenda: enProgreso ? "En progreso" : "Sin empezar" };
  }

  const centro = `${respondidas} de ${total}`;
  if (!enProgreso) return { estado: "sin_empezar", porcentaje: 0, centro, leyenda: "Sin empezar" };

  const faltan = total - respondidas;
  const leyenda = faltan === 0 ? "Sin cerrar" : faltan === 1 ? "Falta 1" : `Faltan ${faltan}`;
  return { estado: "en_progreso", porcentaje: Math.round((respondidas / total) * 100), centro, leyenda };
}

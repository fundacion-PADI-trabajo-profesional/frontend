/**
 * Preguntas para el evaluador (ADR 0020): datos de contexto que carga quien evalúa.
 * No suman puntaje ni cambian el semáforo. `null` siempre significa "sin responder".
 *
 * El backend valida lo mismo (`utils/datos-evaluador.ts`) y rechaza con `DATOS_EVALUADOR_INVALIDOS`.
 */

export type RangoSesiones = "menos_5" | "entre_5_y_9" | "10_o_mas";

export const RANGOS_SESIONES: RangoSesiones[] = ["menos_5", "entre_5_y_9", "10_o_mas"];

export const ETIQUETA_SESIONES: Record<RangoSesiones, string> = {
  menos_5: "Menos de 5",
  entre_5_y_9: "Entre 5 y 9",
  "10_o_mas": "10 o más",
};

export const MAX_OBSERVACIONES = 500;

export interface DatosEvaluador {
  /** Sólo en la evaluación de cierre. */
  sesionesCompletadas: RangoSesiones | null;
  enTratamiento: boolean | null;
  /** Certificado Único de Discapacidad. */
  tieneCud: boolean | null;
  observaciones: string | null;
}

export const DATOS_EVALUADOR_VACIOS: DatosEvaluador = {
  sesionesCompletadas: null,
  enTratamiento: null,
  tieneCud: null,
  observaciones: null,
};

export function esRangoSesiones(valor: unknown): valor is RangoSesiones {
  return typeof valor === "string" && (RANGOS_SESIONES as string[]).includes(valor);
}

/** ¿Esta evaluación pregunta por las sesiones? Sólo la de cierre (la reevaluación). */
export function preguntaSesiones(tipoId: string): boolean {
  return tipoId === "cierre";
}

export type EstadoDatosEvaluador = "sin_iniciar" | "en_progreso" | "completa";

/**
 * Estado de la sección en la ficha. Completa = respondió tratamiento y, en un cierre, también las sesiones.
 * El CUD es una casilla (sin marcar = no) y las observaciones son opcionales: no cuentan para completar.
 */
export function estadoDatosEvaluador(datos: DatosEvaluador | undefined | null, tipoId: string): EstadoDatosEvaluador {
  const d = datos ?? DATOS_EVALUADOR_VACIOS;
  const sesionesOk = !preguntaSesiones(tipoId) || d.sesionesCompletadas !== null;
  if (d.enTratamiento !== null && sesionesOk) return "completa";
  const algo =
    d.enTratamiento !== null ||
    d.tieneCud !== null ||
    !!d.observaciones ||
    (preguntaSesiones(tipoId) && d.sesionesCompletadas !== null);
  return algo ? "en_progreso" : "sin_iniciar";
}

/** Contexto del chico en los listados: el dato más reciente que alguien respondió (lo resuelve el backend). */
export interface ContextoEvaluador {
  en_tratamiento: boolean | null;
  tiene_cud: boolean | null;
}

export interface Insignia {
  clave: "cud" | "tratamiento";
  letra: string;
  etiqueta: string;
  color: string;
}

export const INSIGNIA_CUD: Insignia = { clave: "cud", letra: "C", etiqueta: "Tiene CUD", color: "#6d28d9" };
export const INSIGNIA_TRATAMIENTO: Insignia = { clave: "tratamiento", letra: "T", etiqueta: "En tratamiento", color: "#1d4ed8" };

/** Insignias a mostrar junto al semáforo: sólo los "sí". Sin dato o "no" no muestra nada. */
export function insigniasDe(contexto: ContextoEvaluador | undefined | null): Insignia[] {
  const insignias: Insignia[] = [];
  if (contexto?.tiene_cud === true) insignias.push(INSIGNIA_CUD);
  if (contexto?.en_tratamiento === true) insignias.push(INSIGNIA_TRATAMIENTO);
  return insignias;
}

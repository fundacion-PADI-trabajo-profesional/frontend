import { formatearFecha } from "./fechas";

/**
 * Tipo de evaluación (inicial / cierre).
 *
 * Regla de negocio: un alumno tiene como mucho una evaluación de cada tipo por sala y por año
 * calendario. El año se compara en UTC (ver `fechas.ts`: las fechas se guardan como medianoche UTC).
 * El backend aplica la misma regla y rechaza duplicados con `error.code = "TIPO_DUPLICADO"`.
 */

export type TipoEvaluacion = "inicial" | "cierre";

/** Etiquetas del selector del formulario. */
export const ETIQUETA_TIPO: Record<TipoEvaluacion, string> = {
  inicial: "Evaluacion Inicial",
  cierre: "Evaluacion de Cierre",
};

export interface EvaluacionResumen {
  salaId: number;
  tipoId: string;
  createdAt: Date;
}

export interface SugerenciaTipo {
  /** Valor con el que arranca el selector. La persona puede cambiarlo. */
  tipo: TipoEvaluacion;
  /** Texto corto debajo del selector (situación normal). */
  ayuda: string | null;
  /** Texto de advertencia (algo raro en el historial; el backend probablemente rechace). */
  aviso: string | null;
}

/**
 * Elige el tipo por defecto según el historial del alumno en esa sala y ese año.
 * Las evaluaciones de otra sala o de otro año no cuentan.
 */
export function tipoPorDefecto(evaluaciones: EvaluacionResumen[], salaId: number, anio: number): SugerenciaTipo {
  const delCiclo = evaluaciones
    .filter((e) => e.salaId === salaId && e.createdAt.getUTCFullYear() === anio)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const iniciales = delCiclo.filter((e) => e.tipoId === "inicial");
  const cierres = delCiclo.filter((e) => e.tipoId === "cierre");

  if (iniciales.length === 0 && cierres.length === 0) {
    return { tipo: "inicial", ayuda: `Primera evaluación de sala ${salaId} de este alumno`, aviso: null };
  }
  if (iniciales.length === 0) {
    return {
      tipo: "inicial",
      ayuda: null,
      aviso: `Ya tiene el cierre de sala ${salaId} (${formatearFecha(cierres[0].createdAt)}) y no tiene inicial`,
    };
  }
  if (cierres.length > 0) {
    return { tipo: "cierre", ayuda: null, aviso: `Ya tiene inicial y cierre de sala ${salaId}` };
  }
  if (iniciales.length > 1) {
    const fechas = iniciales.map((e) => formatearFecha(e.createdAt)).join(", ");
    return {
      tipo: "cierre",
      ayuda: null,
      aviso:
        `Tiene ${iniciales.length} evaluaciones iniciales de sala ${salaId} (${fechas}): una de ellas es probablemente el cierre. ` +
        "Cambiale el tipo desde el historial en vez de crear otra.",
    };
  }
  return {
    tipo: "cierre",
    ayuda: `Ya tiene la inicial de sala ${salaId} (${formatearFecha(iniciales[0].createdAt)})`,
    aviso: null,
  };
}

/**
 * ¿Esta persona puede cambiar el tipo de esta evaluación? Misma regla que el backend:
 * la docente solo las suyas; director, encargado y equipo PADI las que ven (el backend verifica el alcance).
 */
export function puedeCambiarTipo(
  profile: { id?: string; rol?: string } | null,
  evaluacion: { profesorId: string }
): boolean {
  if (!profile?.rol) return false;
  if (profile.rol === "docente") return !!profile.id && profile.id === evaluacion.profesorId;
  return ["director", "encargado_zona", "equipo_padi"].includes(profile.rol);
}

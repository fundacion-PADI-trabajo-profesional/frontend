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
  id?: string;
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
  /** Evaluación ya creada del tipo que toca: hay que continuar esa, no crear otra. */
  existenteId: string | null;
}

/** Primer mes (1-12) en que lo que se evalúa es el cierre. Hasta julio se cargan iniciales. */
export const MES_INICIO_CIERRE = 8;

const NOMBRE_TIPO: Record<TipoEvaluacion, string> = { inicial: "inicial", cierre: "de cierre" };

/**
 * Elige el tipo por defecto según la época del año y el historial del alumno en esa sala y ese año.
 * Las evaluaciones de otra sala o de otro año no cuentan.
 *
 * - El tipo que toca lo da la fecha de carga: hasta julio, inicial; de agosto en adelante, cierre
 *   (aunque el alumno no tenga inicial: no se propone una inicial en noviembre).
 * - Si el alumno ya tiene la evaluación del tipo que toca, no se crea otra: se devuelve `existenteId`
 *   para continuar esa (es el caso de dos evaluadores sobre el mismo alumno).
 *
 * @param mes Mes (1-12) del día de carga.
 */
export function tipoPorDefecto(evaluaciones: EvaluacionResumen[], salaId: number, anio: number, mes: number): SugerenciaTipo {
  const delCiclo = evaluaciones
    .filter((e) => e.salaId === salaId && e.createdAt.getUTCFullYear() === anio)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const iniciales = delCiclo.filter((e) => e.tipoId === "inicial");
  const cierres = delCiclo.filter((e) => e.tipoId === "cierre");
  const tipo: TipoEvaluacion = mes >= MES_INICIO_CIERRE ? "cierre" : "inicial";

  const delTipo = tipo === "cierre" ? cierres : iniciales;
  if (delTipo.length > 0) {
    const existente = delTipo[delTipo.length - 1];
    return {
      tipo,
      ayuda: null,
      aviso:
        `Este alumno ya tiene la evaluación ${NOMBRE_TIPO[tipo]} de sala ${salaId} (${formatearFecha(existente.createdAt)}). ` +
        "Continuá esa en vez de crear otra.",
      existenteId: existente.id ?? null,
    };
  }

  if (tipo === "cierre") {
    if (iniciales.length > 1) {
      const fechas = iniciales.map((e) => formatearFecha(e.createdAt)).join(", ");
      return {
        tipo,
        ayuda: null,
        aviso:
          `Tiene ${iniciales.length} evaluaciones iniciales de sala ${salaId} (${fechas}): una de ellas es probablemente el cierre. ` +
          "Cambiale el tipo desde el historial en vez de crear otra.",
        existenteId: null,
      };
    }
    if (iniciales.length === 1) {
      return {
        tipo,
        ayuda: `Ya tiene la inicial de sala ${salaId} (${formatearFecha(iniciales[0].createdAt)})`,
        aviso: null,
        existenteId: null,
      };
    }
    return {
      tipo,
      ayuda: `Primera evaluación de sala ${salaId} de este alumno. De agosto en adelante se carga como cierre`,
      aviso: null,
      existenteId: null,
    };
  }

  if (cierres.length > 0) {
    return {
      tipo,
      ayuda: null,
      aviso: `Ya tiene el cierre de sala ${salaId} (${formatearFecha(cierres[0].createdAt)}) y no tiene inicial`,
      existenteId: null,
    };
  }
  return { tipo, ayuda: `Primera evaluación de sala ${salaId} de este alumno`, aviso: null, existenteId: null };
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

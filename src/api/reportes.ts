import { getAuthHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; description?: string } | null;
}

// ─── Tipos del reporte de escuela (espejo de backend/src/interfaces/reporte-escuela.interface.ts) ───

export interface AreaCatalogo { id: string; nombre: string; orden: number }
export interface PorArea { area_id: string; evaluados: number; aprobados: number }
export interface CierraCon { aprobados: number; total: number }

export interface EstudianteResultado {
  estudiante_id: string;
  nombre: string;
  aprobado: boolean;
  areas: Record<string, "A" | "D" | null>;
}

export interface PautaItem { numero: number | null; texto: string; desaprobaron: number; evaluados: number }
export interface PautasArea { area_id: string; items: PautaItem[] }

export interface ResultadoTipo {
  evaluados: number;
  aprobados: number;
  cierra_con: CierraCon | null;
  por_area: PorArea[];
  estudiantes: EstudianteResultado[];
  pautas: PautasArea[];
}

export type EstadoAreaComparativo = "ok" | "recupero" | "persiste" | "nueva" | "pendiente";
export type ResultadoComparativo = "recupero" | "persiste" | "pendiente";

export interface EstudianteComparativo {
  estudiante_id: string;
  nombre: string;
  resultado: ResultadoComparativo;
  areas: Record<string, EstadoAreaComparativo>;
}

export interface PorAreaComparativo { area_id: string; aprobados_inicial: number; aprobados_cierre: number; sin_dato: number }

export interface Comparativo {
  base: number;
  aprobaron_inicial: number;
  reevaluados: number;
  recuperaron: number;
  persisten: number;
  pendientes: number;
  cierra_con: number;
  por_area: PorAreaComparativo[];
  estudiantes: EstudianteComparativo[];
  pautas: PautasArea[];
}

export interface SalaReporte {
  sala_id: number;
  sala: string;
  inicial: ResultadoTipo | null;
  cierre: ResultadoTipo | null;
  comparativo: Comparativo | null;
}

export interface ResumenPorSala { sala_id: number; sala: string; evaluados: number; aprobados: number; por_area: PorArea[] }
export interface ResumenTipo { evaluados: number; aprobados: number; por_area: PorArea[]; por_sala: ResumenPorSala[] }
export interface ResumenCierre extends ResumenTipo { cierra_con: CierraCon }
export interface ResumenComparativoSala {
  sala_id: number; sala: string; base: number; aprobaron_inicial: number;
  recuperaron: number; persisten: number; pendientes: number; cierra_con: number;
}
export interface ResumenComparativo {
  base: number; aprobaron_inicial: number; reevaluados: number;
  recuperaron: number; persisten: number; pendientes: number; cierra_con: number;
  por_area: { area_id: string; aprobados_inicial: number; aprobados_cierre: number }[];
  por_sala: ResumenComparativoSala[];
}

export interface ReporteEscuela {
  escuela: { id: string; nombre: string };
  periodo: number;
  generado_en: string;
  areas: AreaCatalogo[];
  salas: SalaReporte[];
  resumen: {
    inicial: ResumenTipo | null;
    cierre: ResumenCierre | null;
    comparativo: ResumenComparativo | null;
  };
  /** Filtro de turno aplicado (`null` = sin filtro), eco del query param. */
  turno: string | null;
  /** Turnos disponibles para la escuela, para armar el selector. */
  turnos: string[];
}

/** Reporte completo de una escuela para un año (los tres modos, resumen y salas). Solo `equipo_padi`. */
export async function getReporteEscuela(params: { escuela_id: string; periodo: number; turno?: string | null }): Promise<ReporteEscuela> {
  const qs = new URLSearchParams({ escuela_id: params.escuela_id, periodo: String(params.periodo) });
  if (params.turno) qs.set("turno", params.turno);
  const res = await fetch(`${API_URL}/reportes/escuela?${qs}`, { headers: getAuthHeaders() });
  const body: ApiResponse<ReporteEscuela> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar el reporte de la escuela");
  }
  return body.data;
}

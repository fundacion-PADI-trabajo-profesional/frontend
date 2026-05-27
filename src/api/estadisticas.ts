import { getAuthHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; description?: string } | null;
}

export interface AreaInfo {
  id: string;
  nombre: string;
  orden: number;
}

export interface ValorCelda {
  porcentaje: number | null;
  evaluaciones: number;
}

export interface FilaHeatmap {
  id: string;
  nombre: string;
  meta?: Record<string, string | undefined>;
  valores: Record<string, ValorCelda>;
}

export interface HeatmapResponse {
  periodo: number;
  tipo: string;
  areas: AreaInfo[];
  filas: FilaHeatmap[];
  total_evaluaciones: number;
}

export interface AreaEnRiesgo {
  area_id: string;
  area_nombre: string;
  porcentaje: number;
  evaluaciones: number;
}

export interface EstudianteRiesgo {
  estudiante_id: string;
  nombre: string;
  primer_apellido: string;
  escuela_nombre: string;
  zona_nombre?: string;
  areas_en_riesgo: AreaEnRiesgo[];
  total_areas_en_riesgo: number;
}

export interface RiesgoResponse {
  periodo: number;
  umbral: number;
  estudiantes: EstudianteRiesgo[];
  total: number;
}

/** Realiza la lectura y validación de un endpoint de heatmap. */
/** Realiza la lectura y validación de un endpoint de heatmap. */
async function fetchHeatmap(url: string): Promise<HeatmapResponse> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<HeatmapResponse> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar estadísticas");
  }
  return body.data;
}

/** Obtiene el heatmap de zonas para un período y tipo de evaluación. */
export async function getHeatmapZonas(params: {
  periodo: number;
  tipo: string;
}): Promise<HeatmapResponse> {
  return fetchHeatmap(
    `${API_URL}/estadisticas/padi/heatmap-zonas?periodo=${params.periodo}&tipo=${params.tipo}`
  );
}

/** Obtiene el heatmap de escuelas agrupado por zona. */
export async function getHeatmapEscuelas(params: {
  periodo: number;
  tipo: string;
}): Promise<HeatmapResponse> {
  return fetchHeatmap(
    `${API_URL}/estadisticas/zona/heatmap-escuelas?periodo=${params.periodo}&tipo=${params.tipo}`
  );
}

/** Obtiene el heatmap de aulas de una escuela con filtro opcional por escuela. */
export async function getHeatmapAulas(params: {
  periodo: number;
  tipo: string;
  escuela_id?: string;
}): Promise<HeatmapResponse> {
  const qs = new URLSearchParams({ periodo: String(params.periodo), tipo: params.tipo });
  if (params.escuela_id) qs.set("escuela_id", params.escuela_id);
  return fetchHeatmap(`${API_URL}/estadisticas/escuela/heatmap-aulas?${qs}`);
}

/** Realiza la lectura y validación de un endpoint de estudiantes en riesgo. */
/** Realiza la lectura y validación de un endpoint de estudiantes en riesgo. */
async function fetchRiesgo(url: string): Promise<RiesgoResponse> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<RiesgoResponse> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar estudiantes en riesgo");
  }
  return body.data;
}

/** Obtiene estudiantes en riesgo a nivel zona. */
export async function getEstudiantesEnRiesgoZona(params: {
  periodo: number;
  umbral: number;
}): Promise<RiesgoResponse> {
  return fetchRiesgo(
    `${API_URL}/estadisticas/zona/estudiantes-en-riesgo?periodo=${params.periodo}&umbral=${params.umbral}`
  );
}

/** Obtiene estudiantes en riesgo a nivel escuela. */
export async function getEstudiantesEnRiesgoEscuela(params: {
  periodo: number;
  umbral: number;
  escuela_id?: string;
}): Promise<RiesgoResponse> {
  const qs = new URLSearchParams({ periodo: String(params.periodo), umbral: String(params.umbral) });
  if (params.escuela_id) qs.set("escuela_id", params.escuela_id);
  return fetchRiesgo(`${API_URL}/estadisticas/escuela/estudiantes-en-riesgo?${qs}`);
}

export interface EvolucionArea {
  area_id: string;
  area_nombre: string;
  area_orden: number;
  pct_inicial: number | null;
  pct_final: number | null;
  delta: number | null;
  evaluaciones_inicial: number;
  evaluaciones_final: number;
}

export interface EvolucionResponse {
  periodo: number;
  areas: EvolucionArea[];
}

export interface AreaCritica {
  area_id: string;
  area_nombre: string;
  area_orden: number;
  porcentaje_promedio: number | null;
  evaluaciones: number;
}

export interface AreasCriticasResponse {
  periodo: number;
  tipo: string;
  areas: AreaCritica[];
}

/** Realiza la lectura y validación de un endpoint de evolución. */
/** Realiza la lectura y validación de un endpoint de evolución. */
async function fetchEvolucion(url: string): Promise<EvolucionResponse> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<EvolucionResponse> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar evolución");
  }
  return body.data;
}

/** Realiza la lectura y validación de un endpoint de áreas críticas. */
/** Realiza la lectura y validación de un endpoint de áreas críticas. */
async function fetchAreasCriticas(url: string): Promise<AreasCriticasResponse> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<AreasCriticasResponse> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar áreas críticas");
  }
  return body.data;
}

/** Obtiene la evolución de PADI para un período. */
export async function getEvolucionPadi(params: { periodo: number }): Promise<EvolucionResponse> {
  return fetchEvolucion(`${API_URL}/estadisticas/padi/evolucion?periodo=${params.periodo}`);
}

/** Obtiene la evolución de una zona para un período. */
export async function getEvolucionZona(params: { periodo: number }): Promise<EvolucionResponse> {
  return fetchEvolucion(`${API_URL}/estadisticas/zona/evolucion?periodo=${params.periodo}`);
}

/** Obtiene la evolución de una escuela para un período. */
export async function getEvolucionEscuela(params: { periodo: number; escuela_id?: string }): Promise<EvolucionResponse> {
  const qs = new URLSearchParams({ periodo: String(params.periodo) });
  if (params.escuela_id) qs.set("escuela_id", params.escuela_id);
  return fetchEvolucion(`${API_URL}/estadisticas/escuela/evolucion?${qs}`);
}

/** Obtiene las áreas críticas de PADI. */
export async function getAreasCriticasPadi(params: {
  periodo: number;
  tipo: string;
}): Promise<AreasCriticasResponse> {
  return fetchAreasCriticas(
    `${API_URL}/estadisticas/padi/areas-criticas?periodo=${params.periodo}&tipo=${params.tipo}`
  );
}

/** Obtiene las áreas críticas de una zona. */
export async function getAreasCriticasZona(params: {
  periodo: number;
  tipo: string;
}): Promise<AreasCriticasResponse> {
  return fetchAreasCriticas(
    `${API_URL}/estadisticas/zona/areas-criticas?periodo=${params.periodo}&tipo=${params.tipo}`
  );
}

/** Obtiene las áreas críticas de una escuela. */
export async function getAreasCriticasEscuela(params: {
  periodo: number;
  tipo: string;
  escuela_id?: string;
}): Promise<AreasCriticasResponse> {
  const qs = new URLSearchParams({ periodo: String(params.periodo), tipo: params.tipo });
  if (params.escuela_id) qs.set("escuela_id", params.escuela_id);
  return fetchAreasCriticas(`${API_URL}/estadisticas/escuela/areas-criticas?${qs}`);
}

export interface ItemAprobacion {
  pregunta_id: string;
  consigna: string | null;
  area_id: string | null;
  total: number;
  correctos: number;
  tasa_aprobacion: number;
}

export interface AprobacionPreguntasResponse {
  periodo: number;
  aula_id: string;
  area_id: string | null;
  items: ItemAprobacion[];
}

export interface RangoDistribucion {
  rango: string;
  min: number;
  max: number;
  cantidad: number;
}

export interface DistribucionResponse {
  periodo: number;
  aula_id: string;
  total_estudiantes: number;
  rangos: RangoDistribucion[];
}

async function fetchDocente<T>(url: string, errorMsg: string): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || errorMsg);
  }
  return body.data;
}

/** Obtiene el porcentaje de aprobación por pregunta para un docente o aula. */
export async function getAprobacionPreguntas(params: {
  periodo: number;
  aula_id: string;
  area_id?: string;
}): Promise<AprobacionPreguntasResponse> {
  const qs = new URLSearchParams({
    periodo: String(params.periodo),
    aula_id: params.aula_id,
    ...(params.area_id ? { area_id: params.area_id } : {}),
  });
  return fetchDocente<AprobacionPreguntasResponse>(
    `${API_URL}/estadisticas/docente/aprobacion-preguntas?${qs}`,
    "Error al cargar aprobación por pregunta"
  );
}

/** Obtiene la distribución de puntajes para un aula. */
export async function getDistribucionPuntajes(params: {
  periodo: number;
  aula_id: string;
}): Promise<DistribucionResponse> {
  return fetchDocente<DistribucionResponse>(
    `${API_URL}/estadisticas/docente/distribucion-puntajes?periodo=${params.periodo}&aula_id=${params.aula_id}`,
    "Error al cargar distribución de puntajes"
  );
}

export interface DocenteActividad {
  profesor_id: string;
  nombre: string;
  primer_apellido: string;
  total_evaluaciones: number;
}

export interface ActividadResponse {
  periodo: number;
  docentes: DocenteActividad[];
}

export interface CoberturaZona {
  zona_id: string;
  zona_nombre: string;
  evaluaciones: number;
  estudiantes_evaluados: number;
}

export interface CoberturaResponse {
  periodo: number;
  zonas: CoberturaZona[];
  total_evaluaciones: number;
  total_estudiantes_evaluados: number;
}

export interface ComparativaArea {
  area_id: string;
  area_nombre: string;
  area_orden: number;
  pct_escuela: number | null;
  pct_zona: number | null;
  pct_nacional: number | null;
}

export interface ComparativaResponse {
  periodo: number;
  tipo: string;
  areas: ComparativaArea[];
}

export interface ProgresoEval {
  evaluacion_id: string;
  fecha: string;
  tipo: string;
  pct: number | null;
}

export interface ProgresoArea {
  area_id: string;
  area_nombre: string;
  area_orden: number;
  evaluaciones: ProgresoEval[];
}

export interface ProgresionResponse {
  estudiante_id: string;
  nombre: string;
  primer_apellido: string;
  periodo: number | null;
  areas: ProgresoArea[];
}

async function fetchSimple<T>(url: string, errorMsg: string): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || errorMsg);
  }
  return body.data;
}

/** Obtiene la actividad de docentes de la zona para un período. */
export const getActividadDocentesZona = (p: { periodo: number }) =>
  fetchSimple<ActividadResponse>(
    `${API_URL}/estadisticas/zona/actividad-docentes?periodo=${p.periodo}`,
    "Error al cargar actividad de docentes"
  );

/** Obtiene la actividad de docentes de una escuela para un período. */
export const getActividadDocentesEscuela = (p: { periodo: number; escuela_id?: string }) => {
  const qs = new URLSearchParams({ periodo: String(p.periodo) });
  if (p.escuela_id) qs.set("escuela_id", p.escuela_id);
  return fetchSimple<ActividadResponse>(
    `${API_URL}/estadisticas/escuela/actividad-docentes?${qs}`,
    "Error al cargar actividad de docentes"
  );
};

/** Obtiene la cobertura por zona para un período. */
export const getCoberturaPorZona = (p: { periodo: number }) =>
  fetchSimple<CoberturaResponse>(
    `${API_URL}/estadisticas/padi/cobertura-por-zona?periodo=${p.periodo}`,
    "Error al cargar cobertura por zona"
  );

/** Obtiene la comparativa de una escuela frente a zona y referencia nacional. */
export const getComparativaEscuela = (p: { periodo: number; tipo: string; escuela_id?: string }) => {
  const qs = new URLSearchParams({ periodo: String(p.periodo), tipo: p.tipo });
  if (p.escuela_id) qs.set("escuela_id", p.escuela_id);
  return fetchSimple<ComparativaResponse>(
    `${API_URL}/estadisticas/escuela/comparativa?${qs}`,
    "Error al cargar comparativa"
  );
};

/** Obtiene la progresión de un estudiante para el docente. */
export const getProgresionEstudianteDocente = (p: { estudiante_id: string; aula_id?: string }) => {
  const qs = new URLSearchParams({ estudiante_id: p.estudiante_id });
  if (p.aula_id) qs.set("aula_id", p.aula_id);
  return fetchSimple<ProgresionResponse>(
    `${API_URL}/estadisticas/docente/progresion-estudiante?${qs}`,
    "Error al cargar progresión"
  );
};

/** Obtiene la progresión de un estudiante para la escuela. */
export const getProgresionEstudianteEscuela = (p: { estudiante_id: string; escuela_id?: string }) => {
  const qs = new URLSearchParams({ estudiante_id: p.estudiante_id });
  if (p.escuela_id) qs.set("escuela_id", p.escuela_id);
  return fetchSimple<ProgresionResponse>(
    `${API_URL}/estadisticas/escuela/progresion-estudiante?${qs}`,
    "Error al cargar progresión"
  );
};

export interface PorcentajeNivel {
  porcentaje: number | null;
  evaluaciones: number;
}

export interface AreaPorNivel {
  area_id: string;
  area_nombre: string;
  area_orden: number;
  por_nivel: {
    alto: PorcentajeNivel;
    medio: PorcentajeNivel;
    bajo: PorcentajeNivel;
    sin_definir: PorcentajeNivel;
  };
}

export interface RendimientoNivelResponse {
  periodo: number;
  tipo: string;
  areas: AreaPorNivel[];
  total_evaluaciones: number;
}

/** Obtiene el rendimiento promedio por área agrupado por nivel socioeconómico de la escuela. */
export const getRendimientoPorNivelSocioeconomico = (p: { periodo: number; tipo: string }) =>
  fetchSimple<RendimientoNivelResponse>(
    `${API_URL}/estadisticas/padi/rendimiento-por-nivel-socioeconomico?periodo=${p.periodo}&tipo=${p.tipo}`,
    "Error al cargar rendimiento por nivel socioeconómico"
  );

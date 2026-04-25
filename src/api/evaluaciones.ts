// Archivo: frontend/src/api/evaluaciones.ts

import { getAuthHeaders } from "./auth"

const API_URL = import.meta.env.VITE_API_URL

const ESTADO_NO_INICIADA = "N"

// --- 1. INTERFACES ---

export interface PreguntaBase {
  id: string;
  titulo?: string;
  tipoPregunta?: string;
  consigna: string;
  materiales?: string;
  detalle?: string;
  numero: number;
  aprueba_con?: string; // Ej: '2/3'
  puntaje?: number;
  grupopregunta?: string;
}

export interface RespuestaPrevia {
  pregunta_id: string;
  respuesta: number | null; // 1 (Si), 0 (No), null (No respondida)
}

export interface PreguntasResponse {
  preguntas: PreguntaBase[];
  respuestas: RespuestaPrevia[];
  evaluacionAreaId: string;
}

export interface AreaDetalle {
  id: string
  instanciaId: string
  nombre: string
  descripcion: string
  orden: number
  estadoId: string
  estadoDescripcion: string
  puntaje: number | null
  aciertosIndividuales?: number;
  observacion: string | null
  totalPuntosPosibles?: number;
  totalPreguntas?: number;
}

export interface EstudianteDetalle {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string | null
  genero: string
  escuelaNombre?: string
}

export interface EvaluacionInstancia {
  id: string
  estudianteId: string
  estudianteNombre?: string
  profesorId: string
  salaId: number
  aulaId?: string
  aulaLabel?: string
  escuelaNombre?: string
  salaNombre?: string
  tipoId: string
  estadoId: string
  puntaje: number | null
  createdAt: Date
  // EL OBJETO IMPORTANTE:
  estudiante?: EstudianteDetalle
  areas?: AreaDetalle[]
}

export interface CreateEvaluacionPayload {
  dni: string
  profesor_id: string
  sala_id: number
  aula_id?: string
  tipo_id: string
  fecha_creacion: string
}

function mapToCamelCase(data: any): EvaluacionInstancia {
  const nombre = data?.estudiantes?.personas?.nombre ?? "";
  const apellido = data?.estudiantes?.personas?.primer_apellido ?? "";

  const nombreCompleto = [apellido, nombre].filter(Boolean).join(", ");

  const nombreEscuela = data.estudiantes?.escuela?.nombre ?? "";

  // Mapeo de áreas: Aseguramos que el estadoId sea exacto del backend
  let areasMapped: AreaDetalle[] = [];

  if (data.evaluaciones_estudiante_area) {
    areasMapped = data.evaluaciones_estudiante_area.map((item: any) => {
      const estadoArea = (item.estado_id ?? ESTADO_NO_INICIADA).toString().toUpperCase();

      return {
        id: item.area_id,
        instanciaId: item.id,
        nombre: item.areas?.nombre || "",
        descripcion: item.areas?.descripcion || "",
        estadoId: estadoArea,
        estadoDescripcion: item.estados_evaluacion?.descripcion || "",
        puntaje: item.puntaje,
        totalPreguntas: item.totalPreguntas ?? 0,
        aciertosIndividuales: item.aciertos_individuales ?? 0,
      };
    });
  }

  return {
    id: data.id,
    estudianteId: data.estudiante_id,
    estudianteNombre: nombreCompleto || data.estudiante_id,

    estudiante: {
      id: data.estudiantes?.id || "",
      nombre,
      apellido,
      dni: data.estudiantes?.personas?.dni || "",
      fechaNacimiento: data.estudiantes?.personas?.fecha_nacimiento || null,
      genero: data.estudiantes?.generos?.descripcion ?? "",
      escuelaNombre: nombreEscuela || "No asignada",
    },

    profesorId: data.profesor_id,
    salaId: data.sala_id,
    aulaId: data.aula_id ?? undefined,
    aulaLabel: data.aulas ? `${data.aulas.comision ?? ""} (${data.aulas.turno ?? ""})`.trim() : undefined,
    escuelaNombre: data.estudiantes?.escuela?.nombre ?? "",
    salaNombre: data.salas?.nombre || `Sala de ${data.sala_id}`,
    tipoId: data.tipo_id,
    estadoId: data.estado_id,
    puntaje: data.puntaje,
    // Corrección de Fecha: Forzamos el parseo correcto
    createdAt: data.fecha_creacion ? new Date(data.fecha_creacion) : new Date(),
    areas: areasMapped
  };
}

// ----------------------------------------------------------------------
// 3. FUNCIONES DEL WIZARD (FASE 2)
// ----------------------------------------------------------------------

/**
 * GET: Obtiene la lista de preguntas y respuestas previas para un área.
 */
export async function getPreguntasArea(evaluacionId: string, areaId: string): Promise<PreguntasResponse> {
  const res = await fetch(`${API_URL}/evaluaciones/${evaluacionId}/areas/${areaId}/preguntas`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error al cargar preguntas")
  const json = await res.json()
  return json.data
}

/**
 * POST: Envía las respuestas de un paso del cuestionario y actualiza el estado.
 */
export async function enviarRespuestas(
  evaluacionId: string,
  areaId: string,
  questions: { id: string, answer: number | null }[]
): Promise<void> {
  const res = await fetch(`${API_URL}/evaluaciones/${evaluacionId}/respuestas`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ areaId, questions })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const msg = errorData.error?.description || errorData.message || "Error al guardar respuestas."
    throw new Error(msg)
  }
}

// --------------------------------------------------------------------------
// 3. API CALLS
// --------------------------------------------------------------------------

export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`, {
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => null)

  if (!res.ok) throw new Error(json?.message || "Error al cargar la evaluación")

  return mapToCamelCase(json.data)
}

/**
 * GET: Obtiene evaluaciones filtradas por rol y escuela si aplica.
 */
export async function getEvaluacionesInstancias(filters?: {
  escuela_id?: string;
  rol?: string;
  profesorId?: string;
}): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams();
  if (filters?.escuela_id) params.append("escuela_id", filters.escuela_id);
  if (filters?.rol) params.append("rol", filters.rol);
  if (filters?.profesorId) params.append("profesorId", filters.profesorId);

  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al cargar las evaluaciones");

  const resData = await res.json();
  return (resData.data || []).map(mapToCamelCase);
}

/**
 * POST: Crear evaluación.
 */
export async function crearEvaluacionInstancia(
  data: CreateEvaluacionPayload,
  userInfo?: { userId: string; userRole: string }
): Promise<EvaluacionInstancia> {
  const payload = {
    ...data,
    ...(userInfo && {
      userId: userInfo.userId,
      userRole: userInfo.userRole
    })
  };

  const res = await fetch(`${API_URL}/evaluaciones`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const responseData = await res.json();
  if (!res.ok) throw new Error(responseData.message || "Error al crear la evaluación");

  return mapToCamelCase(responseData.data);
}

export async function getEvaluacionesInstanciasByEstudiante(
  estudianteId: string,
  opts?: { limit?: number; offset?: number },
): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams()
  params.set("estudianteId", estudianteId)
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit))
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset))

  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error al cargar el historial")
  const resData = await res.json()
  return (resData.data || []).map(mapToCamelCase)
}

export async function getEvaluacionesInstanciasByProfesor(
  profesorId: string,
  opts?: { limit?: number; offset?: number },
): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams()
  params.set("profesorId", profesorId)
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit))
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset))

  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error al cargar evaluaciones del docente")
  const resData = await res.json()
  return (resData.data || []).map(mapToCamelCase)
}

export async function actualizarEvaluacionInstancia(
  id: string,
  data: Partial<Omit<EvaluacionInstancia, "id" | "createdAt">>,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const responseData = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorDescription = responseData.error?.description || responseData.message
    throw new Error(errorDescription || "Error al actualizar la evaluación")
  }
  return mapToCamelCase(responseData.data)
}

export async function eliminarEvaluacionInstancia(
  id: string,
  userInfo?: { userId?: string; userRole?: string; usuario_id?: string; rol?: string }
): Promise<void> {
  const params = new URLSearchParams();
  const usuarioId = userInfo?.usuario_id ?? userInfo?.userId;
  const rol = userInfo?.rol ?? userInfo?.userRole;
  if (usuarioId) params.append("usuario_id", usuarioId);
  if (rol) params.append("rol", rol);

  const url = `${API_URL}/evaluaciones/${id}${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al eliminar la evaluación");
  }
}

/**
 * GET: Obtiene todas las preguntas y respuestas previas para un área (ideal para revisión).
 */
export async function getRespuestasParaRevision(evaluacionId: string, areaId: string): Promise<PreguntasResponse> {
  const res = await fetch(`${API_URL}/evaluaciones/${evaluacionId}/areas/${areaId}/preguntas`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al cargar respuestas para revisión.");
  const json = await res.json();
  return json.data;
}

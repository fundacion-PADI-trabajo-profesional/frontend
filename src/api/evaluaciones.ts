// Archivo: frontend/src/api/evaluaciones.ts

const API_URL = import.meta.env.VITE_API_URL

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
  observacion: string | null
  totalPuntosPosibles?: number;
}

export interface EstudianteDetalle {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string | null
  genero: string
}

export interface EvaluacionInstancia {
  id: string
  estudianteId: string
  estudianteNombre?: string
  profesorId: string
  salaId: number
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
  tipo_id: string
  fecha_creacion: string
}

// --- 2. MAPPER (AQUÍ ESTÁ LA MAGIA) ---
function mapToCamelCase(data: any): EvaluacionInstancia {

  // Debug para ver qué llega del backend
  // console.log("Data cruda del backend:", data);

  const nombre = data?.estudiantes?.personas?.nombre ?? ""
  const apellido = data?.estudiantes?.personas?.primer_apellido ?? ""
  const estudianteNombre = [apellido, nombre].filter(Boolean).join(", ") || undefined

  // Mapeo de áreas
  let areasMapped: AreaDetalle[] = []
  if (data.evaluaciones_estudiante_area && Array.isArray(data.evaluaciones_estudiante_area)) {
    areasMapped = data.evaluaciones_estudiante_area.map((item: any) => ({
      id: item.area_id,
      instanciaId: item.id,
      nombre: item.areas?.nombre || "",
      descripcion: item.areas?.descripcion || "",
      orden: item.areas?.orden || 0,
      estadoId: item.estado_id,
      estadoDescripcion: item.estados_evaluacion?.descripcion || "",
      puntaje: item.puntaje,
      observacion: item.observacion
    })).sort((a: any, b: any) => a.orden - b.orden)
  }

  // Objeto estudiante detallado
  // NOTA: Usamos optional chaining (?.) para evitar crashes si algo falta
  const estudianteDetalle: EstudianteDetalle = {
    id: data.estudiantes?.id || "",
    nombre: data.estudiantes?.personas?.nombre || "",
    apellido: data.estudiantes?.personas?.primer_apellido || "",
    dni: data.estudiantes?.personas?.dni || "",
    fechaNacimiento: data.estudiantes?.personas?.fecha_nacimiento || null,
    genero: data.estudiantes?.generos?.descripcion || ""
  }

  return {
    id: data.id,
    estudianteId: data.estudiante_id,
    estudianteNombre,

    // AQUÍ ASIGNAMOS EL OBJETO CREADO ARRIBA
    estudiante: estudianteDetalle,

    profesorId: data.profesor_id,
    salaId: data.sala_id,
    salaNombre: data.estudiantes?.salas?.nombre,
    tipoId: data.tipo_id,
    estadoId: data.estado_id,
    puntaje: data.puntaje,
    createdAt: new Date(data.fecha_creacion),
    areas: areasMapped
  }
}

// ----------------------------------------------------------------------
// 3. FUNCIONES DEL WIZARD (FASE 2)
// ----------------------------------------------------------------------

/**
 * GET: Obtiene la lista de preguntas y respuestas previas para un área.
 */
export async function getPreguntasArea(evaluacionId: string, areaId: string): Promise<PreguntasResponse> {
  const res = await fetch(`${API_URL}/evaluaciones/${evaluacionId}/areas/${areaId}/preguntas`)
  if (!res.ok) throw new Error("Error al cargar preguntas")
  const json = await res.json()
  // El backend ya devuelve el objeto PreguntasResponse listo
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ areaId, questions })
  })

  // Leemos la respuesta por si hay un error en el backend
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const msg = errorData.error?.description || errorData.message || "Error al guardar respuestas."
    throw new Error(msg)
  }
  // Si la respuesta es 200/OK, no devolvemos nada (void)
}

// --------------------------------------------------------------------------
// 3. API CALLS
// --------------------------------------------------------------------------

export async function getEvaluacionesInstancias(): Promise<EvaluacionInstancia[]> {
  const res = await fetch(`${API_URL}/evaluaciones`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const resData = await res.json()
  return (resData.data || []).map(mapToCamelCase)
}

export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const resData = await res.json()
  // Importante: pasamos resData.data al mapper
  return mapToCamelCase(resData.data)
}

export async function crearEvaluacionInstancia(
  data: CreateEvaluacionPayload | any,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const responseData = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorDescription = responseData.error?.description || responseData.message
    throw new Error(errorDescription || "Error al crear la evaluación")
  }
  return mapToCamelCase(responseData.data)
}

export async function getEvaluacionesInstanciasByEstudiante(
  estudianteId: string,
  opts?: { limit?: number; offset?: number },
): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams()
  params.set("estudianteId", estudianteId)
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit))
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset))

  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`)
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

  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`)
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const responseData = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorDescription = responseData.error?.description || responseData.message
    throw new Error(errorDescription || "Error al actualizar la evaluación")
  }
  return mapToCamelCase(responseData.data)
}

export async function eliminarEvaluacionInstancia(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar la evaluación")
}

/**
 * GET: Obtiene todas las preguntas y respuestas previas para un área (ideal para revisión).
 * Reutilizaremos la estructura de respuesta de getPreguntasArea.
 */
export async function getRespuestasParaRevision(evaluacionId: string, areaId: string): Promise<PreguntasResponse> {
  // Usamos el mismo endpoint que carga las preguntas, pero el backend lo usará para revisión.
  const res = await fetch(`${API_URL}/evaluaciones/${evaluacionId}/areas/${areaId}/preguntas`);
  if (!res.ok) throw new Error("Error al cargar respuestas para revisión.");
  const json = await res.json();
  return json.data;
}
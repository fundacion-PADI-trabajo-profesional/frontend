const API_URL = import.meta.env.VITE_API_URL

// Interfaz de lo que recibimos del Backend (Lectura)
export interface EvaluacionInstancia {
  id: string
  estudianteId: string
  estudianteNombre?: string
  profesorId: string
  salaId: number
  tipoId: string // "Evaluacion Inicial" | "Evaluacion de Cierre"
  estadoId: string // "N" | "C" | "R"
  puntaje: number | null
  createdAt: Date
}

// Interfaz para CREAR (Lo que el backend espera recibir)
export interface CreateEvaluacionPayload {
  dni: string
  profesor_id: string
  tipo_id: string
}

export interface Evaluacion {
  id: string
  nombre: string
  descripcion?: string
}

// Mapea los datos del backend (snake_case) a la interfaz del frontend (camelCase)
function mapToCamelCase(data: any): EvaluacionInstancia {
  const nombre = data?.estudiantes?.personas?.nombre ?? ""
  const apellido = data?.estudiantes?.personas?.primer_apellido ?? ""
  const estudianteNombre = [apellido, nombre].filter(Boolean).join(", ") || undefined

  return {
    id: data.id,
    estudianteId: data.estudiante_id, // Mapeo snake_case a camelCase
    estudianteNombre,
    profesorId: data.profesor_id,
    salaId: data.sala_id,
    tipoId: data.tipo_id,
    estadoId: data.estado_id,
    puntaje: data.puntaje,
    createdAt: new Date(data.fecha_creacion),
  }
}

// --------------------------------------------------------------------------
// 1. OBTENER LISTA DE EVALUACIONES
// --------------------------------------------------------------------------
export async function getEvaluacionesInstancias(): Promise<EvaluacionInstancia[]> {
  // CAMBIO: URL ahora es /evaluaciones
  const res = await fetch(`${API_URL}/evaluaciones`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const resData = await res.json()

  // Aplica el mapeo a la lista
  return (resData.data || []).map(mapToCamelCase)
}

// --------------------------------------------------------------------------
// 2. OBTENER UNA EVALUACIÓN POR ID
// --------------------------------------------------------------------------
export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
  // CAMBIO: URL ahora es /evaluaciones/:id
  const res = await fetch(`${API_URL}/evaluaciones/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const resData = await res.json()

  // Aplica el mapeo al objeto individual
  return mapToCamelCase(resData.data)
}

// --------------------------------------------------------------------------
// 3. CREAR EVALUACIÓN
// --------------------------------------------------------------------------
export async function crearEvaluacionInstancia(
  data: CreateEvaluacionPayload | any, // Aceptamos el payload específico o any
): Promise<EvaluacionInstancia> {
  // CAMBIO: URL ahora es /evaluaciones
  const res = await fetch(`${API_URL}/evaluaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  // Lee el JSON de la respuesta INMEDIATAMENTE.
  const responseData = await res.json().catch(() => ({}))

  if (!res.ok) {
    const errorDescription = responseData.error?.description || responseData.message
    throw new Error(errorDescription || "Error al crear la evaluación")
  }

  return mapToCamelCase(responseData.data)
}

// --------------------------------------------------------------------------
// 4. FILTROS (POR ESTUDIANTE / PROFESOR)
// --------------------------------------------------------------------------
// Nota: Estas funciones asumen que tu backend soporta query params en /evaluaciones
// Si aún no lo implementaste en el controller 'list', devolverán todas.
export async function getEvaluacionesInstanciasByEstudiante(
  estudianteId: string,
  opts?: { limit?: number; offset?: number },
): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams()
  params.set("estudianteId", estudianteId)
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit))
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset))

  // CAMBIO: URL ahora es /evaluaciones
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

  // CAMBIO: URL ahora es /evaluaciones
  const res = await fetch(`${API_URL}/evaluaciones?${params.toString()}`)
  if (!res.ok) throw new Error("Error al cargar evaluaciones del docente")
  const resData = await res.json()
  return (resData.data || []).map(mapToCamelCase)
}

// --------------------------------------------------------------------------
// 5. ACTUALIZAR / ELIMINAR
// --------------------------------------------------------------------------
export async function actualizarEvaluacionInstancia(
  id: string,
  data: Partial<Omit<EvaluacionInstancia, "id" | "createdAt">>,
): Promise<EvaluacionInstancia> {
  // CAMBIO: URL ahora es /evaluaciones/:id
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
  // CAMBIO: URL ahora es /evaluaciones/:id
  const res = await fetch(`${API_URL}/evaluaciones/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar la evaluación")
}

// --------------------------------------------------------------------------
// DEPRECATED / OTROS
// --------------------------------------------------------------------------
// Si estas funciones ya no se usan con el nuevo backend, puedes comentarlas o eliminarlas
export async function getEvaluaciones(): Promise<Evaluacion[]> {
  const res = await fetch(`${API_URL}/evaluaciones/tipos`) // Ejemplo si tuvieras un endpoint de tipos
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const data = await res.json()
  return data.data || []
}

export async function getEvaluacionById(id: string): Promise<Evaluacion> {
  const res = await fetch(`${API_URL}/evaluaciones/detalle/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const data = await res.json()
  return data.data
}
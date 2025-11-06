const API_URL = import.meta.env.VITE_API_URL

export interface EvaluacionInstancia {
  id: string
  estudianteId: string
  salaId: number
  tipoId: "diagnostico" | "seguimiento" | "cierre"
  estadoId: "N" | "C" | "R" // N: No iniciada, C: Completada, R: Revisada
  puntaje: number | null
  createdAt: Date
}

export interface Evaluacion {
  id: string
  nombre: string
  descripcion?: string
}

export async function getEvaluacionesInstancias(): Promise<EvaluacionInstancia[]> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const data = await res.json()
  return data.data || []
}

export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const data = await res.json()
  return data.data
}

export async function crearEvaluacionInstancia(
  data: Omit<EvaluacionInstancia, "id" | "createdAt">,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || "Error al crear la evaluación")
  }
  const responseData = await res.json()
  return responseData.data
}

export async function actualizarEvaluacionInstancia(
  id: string,
  data: Partial<Omit<EvaluacionInstancia, "id" | "createdAt">>,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || "Error al actualizar la evaluación")
  }
  const responseData = await res.json()
  return responseData.data
}

export async function eliminarEvaluacionInstancia(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar la evaluación")
}

export async function getEvaluaciones(): Promise<Evaluacion[]> {
  const res = await fetch(`${API_URL}/evaluaciones`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const data = await res.json()
  return data.data || []
}

export async function getEvaluacionById(id: string): Promise<Evaluacion> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const data = await res.json()
  return data.data
}

const API_URL = import.meta.env.VITE_API_URL

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: { code: string; description?: string } | null
}

export interface Docente {
  id: string
  email: string
  nombre: string
  apellido: string
}

export async function getDocentes(): Promise<Docente[]> {
  const res = await fetch(`${API_URL}/docentes`)
  const body: ApiResponse<Docente[]> = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.description || body.message || "Error al cargar docentes")
  }
  return body.data || []
}



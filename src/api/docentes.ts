const API_URL = import.meta.env.VITE_API_URL

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: { code: string; description?: string } | null
}

export interface Docente {
  id: string
  nombre: string
  apellido: string
  aulas?: {
    id: string
    comision: string
    turno: string
    grado: number | null
    escuelaNombre: string | null
  }[]
}

export async function getDocentes(): Promise<Docente[]> {
  // Obtenemos los datos del usuario (id, rol, escuela_id)
  const stored = localStorage.getItem("padiUser");
  const user = stored ? JSON.parse(stored) : null;
  
  const params = new URLSearchParams();
  if (user) {
    params.append("rol", user.rol);
    if (user.escuela_id) params.append("escuela_id", user.escuela_id);
  }

  const res = await fetch(`${API_URL}/docentes?${params.toString()}`);
  const body: ApiResponse<Docente[]> = await res.json();
  
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Error al cargar docentes");
  }
  return body.data || [];
}



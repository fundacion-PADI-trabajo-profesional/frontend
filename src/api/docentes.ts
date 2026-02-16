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
  escuelas?: {
    id: string
    nombre: string
  }[]
  aulas?: {
    id: string
    comision: string
    turno: string
    grado: number | null
    escuelaNombre: string | null
  }[]
}

function getSessionUser() {
  const userRaw = localStorage.getItem("padiUser")
  const profileRaw = localStorage.getItem("padiProfile")

  const user = userRaw ? JSON.parse(userRaw) : null
  const profile = profileRaw ? JSON.parse(profileRaw) : null

  const id = user?.id ?? profile?.id ?? ""
  const rol = user?.rol ?? profile?.rol ?? ""
  const escuela_id = user?.escuela_id ?? profile?.escuela_id ?? ""

  return { id, rol, escuela_id }
}

export async function getDocentes(): Promise<Docente[]> {
  const user = getSessionUser()
  if (!user.id || !user.rol) {
    throw new Error("Sesion invalida. Volve a iniciar sesion.")
  }

  const params = new URLSearchParams();
  params.append("usuario_id", user.id)
  params.append("rol", user.rol);
  if (user.escuela_id) params.append("escuela_id", user.escuela_id);

  const res = await fetch(`${API_URL}/docentes?${params.toString()}`);
  const body: ApiResponse<Docente[]> = await res.json();
  
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Error al cargar docentes");
  }
  return body.data || [];
}

export async function asignarDocenteAEscuela(
  docenteId: string,
  escuelaId: string,
): Promise<void> {
  const user = getSessionUser()
  if (!user.id || !user.rol) {
    throw new Error("No hay sesion activa");
  }

  const res = await fetch(`${API_URL}/docentes/${docenteId}/asignar-escuela`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      escuela_id: escuelaId,
      usuario_id: user.id,
      rol: user.rol,
    }),
  });

  const body: ApiResponse<unknown> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Error al asignar docente al colegio");
  }
}

export async function desasignarDocenteDeEscuela(
  docenteId: string,
  escuelaId: string,
): Promise<void> {
  const user = getSessionUser()
  if (!user.id || !user.rol) {
    throw new Error("No hay sesion activa");
  }

  const res = await fetch(`${API_URL}/docentes/${docenteId}/desasignar-escuela`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      escuela_id: escuelaId,
      usuario_id: user.id,
      rol: user.rol,
    }),
  });

  const body: ApiResponse<unknown> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Error al desasignar docente del colegio");
  }
}



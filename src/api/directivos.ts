import { getAuthHeaders } from "./auth"

const API_URL = import.meta.env.VITE_API_URL

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    error?: { code: string; description?: string } | null
}

export interface Directivo {
    id: string
    nombre: string
    apellido: string
    escuela?: {
        id: string
        nombre: string
    } | null
}

/** Lee el usuario actual desde localStorage para firmar operaciones sensibles. */
const getUserData = () => {
    const stored = localStorage.getItem("padiUser");
    if (stored) {
        const user = JSON.parse(stored);
        return { usuario_id: user.id, rol: user.rol };
    }
    return { usuario_id: "", rol: "" };
};

/** Obtiene todos los directivos. */
export async function getDirectivos(): Promise<Directivo[]> {
    const res = await fetch(`${API_URL}/directivos`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<Directivo[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar directivos")
    }
    return body.data || []
}

/** Obtiene los directivos disponibles para asignación. */
export async function getDirectivosDisponibles(): Promise<Directivo[]> {
    const res = await fetch(`${API_URL}/directivos/disponibles`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<Directivo[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar directivos disponibles")
    }
    return body.data || []
}

/** Asigna una escuela a un directivo. */
export async function asignarEscuelaADirectivo(directivoId: string, escuelaId: string) {
    const { usuario_id, rol } = getUserData();
    const res = await fetch(`${API_URL}/directivos/${directivoId}/asignar-escuela`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ escuela_id: escuelaId, usuario_id, rol }),
    });
    const body: ApiResponse<any> = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al asignar escuela");
    }
    return body.data;
}

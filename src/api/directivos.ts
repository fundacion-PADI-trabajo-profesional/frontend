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
}

export async function getDirectivos(): Promise<Directivo[]> {
    const res = await fetch(`${API_URL}/directivos`)
    const body: ApiResponse<Directivo[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar directivos")
    }
    return body.data || []
}



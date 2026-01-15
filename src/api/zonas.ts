const API_URL = import.meta.env.VITE_API_URL

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    error?: { code: string; description?: string } | null
}

export interface Zona {
    id: string
    nombre: string
    _count?: {
        escuelas: number
        encargados: number
    }
}

// Reutilizamos tu lógica de obtener usuario para los permisos
const getUserData = () => {
    const stored = localStorage.getItem("padiUser");
    if (stored) {
        const user = JSON.parse(stored);
        return { usuario_id: user.id, rol: user.rol };
    }
    return { usuario_id: "", rol: "" };
};

export async function getZonas(): Promise<Zona[]> {
    const { rol } = getUserData();
    // Pasamos el rol por query string como espera tu backend
    const res = await fetch(`${API_URL}/zonas?rol=${rol}`)
    const body: ApiResponse<Zona[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar zonas")
    }
    return body.data || []
}

export async function createZona(nombre: string): Promise<Zona> {
    const { usuario_id, rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario_id, rol }),
    });
    const body: ApiResponse<Zona> = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al crear zona");
    }
    return body.data;
}

export async function getEscuelasSinZona(): Promise<any[]> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/escuelas-sin-zona?rol=${rol}`)
    const body: ApiResponse<any[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar escuelas disponibles")
    }
    return body.data || []
}
import { getAuthHeaders } from "./auth"

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
    encargados?: Array<{
        id: string
        usuario: {
            id: string
            nombre: string
            apellido: string
            email: string
        }
    }>
    _count?: {
        escuelas: number
        encargados: number
    }
}

export interface EncargadoZonaOption {
    id: string
    usuario: {
        id: string
        nombre: string
        apellido: string
        email: string
    }
    zona?: {
        id: string
        nombre: string
    } | null
}

/** Lee usuario y rol desde padiUser para construir query params autenticados. */
const getUserData = () => {
    const stored = localStorage.getItem("padiUser");
    if (stored) {
        const user = JSON.parse(stored);
        return { usuario_id: user.id, rol: user.rol };
    }
    return { usuario_id: "", rol: "" };
};

/** Obtiene todas las zonas visibles para la sesión actual. */
export async function getZonas(): Promise<Zona[]> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas?rol=${rol}`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<Zona[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar zonas")
    }
    return body.data || []
}

/** Crea una nueva zona. */
export async function createZona(nombre: string): Promise<Zona> {
    const { usuario_id, rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre, usuario_id, rol }),
    });
    const body: ApiResponse<Zona> = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al crear zona");
    }
    return body.data;
}

/** Obtiene las escuelas que todavía no tienen zona asignada. */
export async function getEscuelasSinZona(): Promise<any[]> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/escuelas-sin-zona?rol=${rol}`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<any[]> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar escuelas disponibles")
    }
    return body.data || []
}

/** Obtiene el detalle de una zona por ID. */
export async function getZonaById(id: string): Promise<any> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas/${id}?rol=${rol}`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<any> = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al cargar detalle")
    }
    return body.data
}

/** Asigna una escuela a una zona. */
export async function asignarEscuela(zonaId: string, escuelaId: string): Promise<any> {
    const { usuario_id, rol } = getUserData();

    const res = await fetch(`${API_URL}/zonas/${zonaId}/asignar-escuela`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ escuelaId, usuario_id, rol }),
    });

    const body: ApiResponse<any> = await res.json();

    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al asignar la escuela a la zona");
    }

    return body.data;
}

/** Quita una escuela de su zona actual. */
export async function desvincularEscuela(escuelaId: string): Promise<any> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/escuelas/${escuelaId}/quitar-escuela`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rol }),
    });
    const body: ApiResponse<any> = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.message || "Error al desvincular escuela");
    }
    return body.data;
}

/** Actualiza el nombre de una zona. */
export async function updateZona(id: string, nombre: string): Promise<Zona> {
    const { usuario_id, rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre, usuario_id, rol }),
    });
    const body: ApiResponse<Zona> = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.error?.description || body.message || "Error al actualizar zona");
    }
    return body.data;
}

/** Obtiene los encargados que no tienen zona asignada. */
export async function getEncargadosSinZona(): Promise<any[]> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/encargados-sin-zona?rol=${rol}`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<any[]> = await res.json()
    if (!res.ok || !body.success) throw new Error(body.message || "Error al cargar encargados");
    return body.data || []
}

/** Obtiene opciones de encargados para asignar a una zona. */
export async function getEncargadosZonaOptions(): Promise<EncargadoZonaOption[]> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas/encargados?rol=${rol}`, {
        headers: getAuthHeaders(),
    })
    const body: ApiResponse<EncargadoZonaOption[]> = await res.json()
    if (!res.ok || !body.success) throw new Error(body.message || "Error al cargar encargados");
    return body.data || []
}

/** Asigna un encargado a una zona. */
export async function asignarEncargadoAZona(zonaId: string, encargadoId: string): Promise<any> {
    const { usuario_id, rol } = getUserData();
    const res = await fetch(`${API_URL}/zonas/${zonaId}/asignar-encargado`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ encargadoId, usuario_id, rol }),
    });
    const body: ApiResponse<any> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Error al asignar encargado");
    return body.data;
}

/** Desvincula un encargado de su zona. */
export async function desvincularEncargado(encargadoId: string): Promise<any> {
    const { rol } = getUserData();
    const res = await fetch(`${API_URL}/encargados/${encargadoId}/quitar-zona`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rol }),
    });
    const body: ApiResponse<any> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Error al desvincular encargado");
    return body.data;
}

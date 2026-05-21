import { getAuthHeaders } from "./auth"

const API_URL = import.meta.env.VITE_API_URL

export interface Encargado {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    zona?: {
        id: string;
        nombre: string;
    } | null;
}

export interface CreateEncargadoDto {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    zona: string;
}

export interface UpdateEncargadoDto {
    nombre: string;
    apellido: string;
    email: string;
    zona_id: string;
}

/** Obtiene la lista completa de encargados de zona. */
export async function getEncargados(): Promise<Encargado[]> {
    const response = await fetch(`${API_URL}/encargados`, {
        headers: getAuthHeaders(),
    });
    const json = await response.json();

    if (!json.success) {
        throw new Error(json.message || "Error al obtener encargados");
    }

    return json.data;
}

/** Crea un nuevo encargado de zona. */
export async function createEncargado(data: CreateEncargadoDto): Promise<Encargado> {
    const response = await fetch(`${API_URL}/encargados`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!json.success) {
        throw new Error(json.message || "Error al crear encargado");
    }

    return json.data;
}

/** Actualiza un encargado existente. */
export async function updateEncargado(id: string, data: UpdateEncargadoDto): Promise<Encargado> {
    const response = await fetch(`${API_URL}/encargados/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message || "Error al actualizar encargado");
    return json.data;
}

/** Obtiene el encargado asociado a un usuario específico. */
export async function getCurrentEncargado(userId: string): Promise<Encargado> {
    const response = await fetch(`${API_URL}/encargados/me?usuario_id=${userId}`, {
        headers: getAuthHeaders(),
    });
    const json = await response.json();

    if (!json.success) {
        throw new Error(json.message || "Error al obtener información del encargado");
    }

    return json.data;
}

/** Elimina un encargado por ID. */
export async function deleteEncargado(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/encargados/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    const json = await response.json();
    if (!json.success) {
        throw new Error(json.message || "Error al eliminar encargado");
    }
}

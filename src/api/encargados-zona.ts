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
    zona_id: string; // Enviamos el ID de la nueva zona
}

export async function getEncargados(): Promise<Encargado[]> {
    const response = await fetch(`${API_URL}/encargados`);
    const json = await response.json();

    if (!json.success) {
        throw new Error(json.message || "Error al obtener encargados");
    }

    return json.data;
}

export async function createEncargado(data: CreateEncargadoDto): Promise<Encargado> {
    const response = await fetch(`${API_URL}/encargados`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!json.success) {
        throw new Error(json.message || "Error al crear encargado");
    }

    return json.data;
}

export async function updateEncargado(id: string, data: UpdateEncargadoDto): Promise<Encargado> {
    const response = await fetch(`${API_URL}/encargados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message || "Error al actualizar encargado");
    return json.data;
}

export async function deleteEncargado(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/encargados/${id}`, {
        method: "DELETE",
    });

    const json = await response.json();
    if (!json.success) {
        throw new Error(json.message || "Error al eliminar encargado");
    }
}
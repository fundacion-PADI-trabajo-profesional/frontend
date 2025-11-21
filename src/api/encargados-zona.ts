const API_URL = import.meta.env.VITE_API_URL

export interface Encargado {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
}

export interface CreateEncargadoDto {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
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
import { api } from "./auth";

const getUserData = () => {
    const stored = localStorage.getItem("padiUser");
    if (stored) {
        const user = JSON.parse(stored);
        return { usuario_id: user.id, rol: user.rol };
    }
    return { usuario_id: "", rol: "" };
};

export interface Escuela {
    id: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    zona?: {
        id: string;
        nombre: string;
    };
    directivos?: {
        id: string;
        nombre: string;
        apellido: string;
    }[];
    profesores?: {
        id: string;
        personas: {
            nombre: string;
            primer_apellido: string;
        }
    }[];
}

export interface CreateEscuelaDto {
    nombre: string;
    direccion?: string;
    telefono?: string;
    zona_id: string;
}

export const getEscuelas = async (): Promise<Escuela[]> => {
    const { usuario_id, rol } = getUserData();
    const response = await api.get(`/escuelas?usuario_id=${usuario_id}&rol=${rol}`);

    return response.data.data || [];
};

export const createEscuela = async (data: CreateEscuelaDto): Promise<Escuela> => {
    const { usuario_id, rol } = getUserData();
    const payload = { ...data, usuario_id, rol };

    const response = await api.post("/escuelas", payload);

    return response.data.data;
};

export const updateEscuela = async (id: string, data: Partial<CreateEscuelaDto>): Promise<Escuela> => {
    const { usuario_id, rol } = getUserData();
    const response = await api.put(`/escuelas/${id}`, { ...data, usuario_id, rol });
    return response.data.data;
};

export const deleteEscuela = async (id: string): Promise<void> => {
    const { usuario_id, rol } = getUserData();
    await api.delete(`/escuelas/${id}?rol=${rol}&usuario_id=${usuario_id}`);
};

export const asignarDirectivo = async (escuelaId: string, usuarioId: string) => {
    const response = await api.post("/escuelas/asignar-directivo", { escuelaId, usuarioId });
    return response.data;
};

export const desasignarDirectivo = async (usuarioId: string) => {
    const response = await api.post("/escuelas/desasignar-directivo", { usuarioId });
    return response.data;
};

export const getDirectivosDisponibles = async () => {
    const response = await api.get("/directivos/disponibles");
    return response.data.data;
};
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
    zona: string;
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
    zona?: string;
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

export const asignarDocente = async (escuelaId: string, profesorId: string) => {
    const response = await api.post("/escuelas/asignar", { escuelaId, profesorId });
    return response.data;
};

export const desasignarDocente = async (escuelaId: string, profesorId: string) => {
    const response = await api.post("/escuelas/desasignar", { escuelaId, profesorId });
    return response.data;
};
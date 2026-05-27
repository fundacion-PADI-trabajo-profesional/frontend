import { api } from "./auth";

/** Lee usuario y rol desde padiUser para construir query params autenticados. */
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
    nivel_socioeconomico?: string;
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
    nivel_socioeconomico?: string;
}

export const NIVELES_SOCIOECONOMICOS = [
    { value: "alto", label: "Alto" },
    { value: "medio", label: "Medio" },
    { value: "bajo", label: "Bajo" },
    { value: "sin_definir", label: "Sin Definir" },
];

export const getNivelSocioeconomicoLabel = (value?: string) => {
    return NIVELES_SOCIOECONOMICOS.find(n => n.value === value)?.label ?? "Sin Definir";
};

/** Obtiene las escuelas visibles para la sesión actual. */
export const getEscuelas = async (): Promise<Escuela[]> => {
    const { usuario_id, rol } = getUserData();
    const response = await api.get(`/escuelas?usuario_id=${usuario_id}&rol=${rol}`);

    return response.data.data || [];
};

/** Crea una nueva escuela. */
export const createEscuela = async (data: CreateEscuelaDto): Promise<Escuela> => {
    const { usuario_id, rol } = getUserData();
    const payload = { ...data, usuario_id, rol };

    const response = await api.post("/escuelas", payload);

    return response.data.data;
};

/** Actualiza una escuela existente por ID. */
export const updateEscuela = async (id: string, data: Partial<CreateEscuelaDto>): Promise<Escuela> => {
    const { usuario_id, rol } = getUserData();
    const response = await api.put(`/escuelas/${id}`, { ...data, usuario_id, rol });
    return response.data.data;
};

/** Elimina una escuela por ID. */
export const deleteEscuela = async (id: string): Promise<void> => {
    const { usuario_id, rol } = getUserData();
    await api.delete(`/escuelas/${id}?rol=${rol}&usuario_id=${usuario_id}`);
};

/** Asigna un directivo a una escuela. */
export const asignarDirectivo = async (escuelaId: string, usuarioId: string) => {
    const response = await api.post("/escuelas/asignar-directivo", { escuelaId, usuarioId });
    return response.data;
};

/** Desasigna un directivo de una escuela. */
export const desasignarDirectivo = async (usuarioId: string) => {
    const response = await api.post("/escuelas/desasignar-directivo", { usuarioId });
    return response.data;
};

/** Obtiene los directivos disponibles para asignar. */
export const getDirectivosDisponibles = async () => {
    const response = await api.get("/directivos/disponibles");
    return response.data.data;
};
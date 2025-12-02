import { api } from "./auth";

const getUserData = () => {
  const stored = localStorage.getItem("padiUser");
  if (stored) {
    const user = JSON.parse(stored);
    return { usuario_id: user.id, rol: user.rol };
  }
  return { usuario_id: "", rol: "" };
};

export interface Aula {
  id: string;
  sala_id: number;
  escuela_id: string;
  comision: string;
  turno: string;
  fecha_creacion?: string;
  sala?: {
    id: number;
    nombre: string | null;
    grado: number | null;
  };
}

export interface CreateAulaDto {
  sala_id: number;
  comision: string;
  turno: string;
}

export const getAulas = async (): Promise<Aula[]> => {
  const { usuario_id, rol } = getUserData();
  const response = await api.get(`/aulas?usuario_id=${usuario_id}&rol=${rol}`);
  return response.data.data || [];
};

export const createAula = async (data: CreateAulaDto): Promise<Aula> => {
  const { usuario_id, rol } = getUserData();
  const payload = { ...data, usuario_id, rol };
  const response = await api.post("/aulas", payload);
  return response.data.data;
};

export const updateAula = async (id: string, data: Partial<CreateAulaDto>): Promise<Aula> => {
  const { usuario_id, rol } = getUserData();
  const payload = { ...data, usuario_id, rol };
  const response = await api.put(`/aulas/${id}`, payload);
  return response.data.data;
};

export const deleteAula = async (id: string): Promise<void> => {
  const { usuario_id, rol } = getUserData();
  await api.delete(`/aulas/${id}?usuario_id=${usuario_id}&rol=${rol}`);
};



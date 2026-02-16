import { api } from "./auth";
import type { Estudiante } from "./estudiantes";

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
  profesores_aulas?: {
    profesor_id: string;
    profesor: {
      personas?: {
        nombre: string | null;
        primer_apellido: string | null;
      } | null;
    };
  }[];
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

export interface AulaDocente {
  profesor_id: string;
  profesor: {
    personas?: {
      nombre: string | null;
      primer_apellido: string | null;
    } | null;
  };
}

export interface DocenteAulaConEstudiantes {
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
  escuela?: {
    id: string;
    nombre: string | null;
  };
  estudiantes: Estudiante[];
}

export const getAulaDocentes = async (aulaId: string): Promise<AulaDocente[]> => {
  const { usuario_id, rol } = getUserData();
  const response = await api.get(`/aulas/${aulaId}/docentes?usuario_id=${usuario_id}&rol=${rol}`);
  return response.data.data || [];
};

export const asignarDocenteAula = async (aulaId: string, profesorId: string) => {
  const { usuario_id, rol } = getUserData();
  const payload = { profesor_id: profesorId, usuario_id, rol };
  const response = await api.post(`/aulas/${aulaId}/asignar-docente`, payload);
  return response.data;
};

export const desasignarDocenteAula = async (aulaId: string, profesorId: string) => {
  const { usuario_id, rol } = getUserData();
  const payload = { profesor_id: profesorId, usuario_id, rol };
  const response = await api.post(`/aulas/${aulaId}/desasignar-docente`, payload);
  return response.data;
};

export const getDocenteAulasConEstudiantes = async (): Promise<DocenteAulaConEstudiantes[]> => {
  const { usuario_id, rol } = getUserData();
  const response = await api.get(`/docentes/aulas?usuario_id=${usuario_id}&rol=${rol}`);
  return response.data.data || [];
};



// src/api/evaluaciones.ts
const API_URL = import.meta.env.VITE_API_URL;

export interface Evaluacion {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  resultado: string;
}

export async function getEvaluaciones(): Promise<Evaluacion[]> {
  const res = await fetch(`${API_URL}/evaluaciones`);
  if (!res.ok) throw new Error("Error al cargar las evaluaciones");
  return await res.json();
}

export async function crearEvaluacion(
  data: Omit<Evaluacion, "id">
): Promise<Evaluacion> {
  const res = await fetch(`${API_URL}/evaluaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la evaluación");
  return await res.json();
}

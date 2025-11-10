const API_URL = import.meta.env.VITE_API_URL

export interface EvaluacionInstancia {
  id: string
  estudianteId: string
  estudianteNombre?: string
  profesorId: string
  salaId: number
  tipoId: "diagnostico" | "seguimiento" | "cierre"
  estadoId: "N" | "C" | "R" // N: No iniciada, C: Completada, R: Revisada
  puntaje: number | null
  createdAt: Date
}

export interface Evaluacion {
  id: string
  nombre: string
  descripcion?: string
}

// Mapea los datos del backend (snake_case) a la interfaz del frontend (camelCase)
function mapToCamelCase(data: any): EvaluacionInstancia {
  const nombre = data?.estudiantes?.personas?.nombre ?? ""
  const apellido = data?.estudiantes?.personas?.primer_apellido ?? ""
  const estudianteNombre =
    [apellido, nombre].filter(Boolean).join(", ") || undefined
  return {
    id: data.id,
    estudianteId: data.estudiante_id, // Mapeo
    estudianteNombre,
    profesorId: data.profesor_id,     // Mapeo
    salaId: data.sala_id,           // Mapeo
    tipoId: data.tipo_id,           // Mapeo
    estadoId: data.estado_id,         // Mapeo
    puntaje: data.puntaje,
    createdAt: new Date(data.fecha_creacion) // Mapeo
  };
}

//export async function getEvaluacionesInstancias(): Promise<EvaluacionInstancia[]> {
//  const res = await fetch(`${API_URL}/evaluaciones-instancias`)
//  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
//  const data = await res.json()
//  return data.data || []
//}
//
//export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
//  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`)
//  if (!res.ok) throw new Error("Error al cargar la evaluación")
//  const data = await res.json()
//  return data.data
//}
//
//export async function crearEvaluacionInstancia(
//  data: Omit<EvaluacionInstancia, "id" | "createdAt">,
//): Promise<EvaluacionInstancia> {
//  const res = await fetch(`${API_URL}/evaluaciones-instancias`, {
//    method: "POST",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify(data),
//  })
//  if (!res.ok) {
//    const errorData = await res.json().catch(() => ({}))
//    throw new Error(errorData.message || "Error al crear la evaluación")
//  }
//  const responseData = await res.json()
//  return responseData.data
//}
//
//export async function actualizarEvaluacionInstancia(
//  id: string,
//  data: Partial<Omit<EvaluacionInstancia, "id" | "createdAt">>,
//): Promise<EvaluacionInstancia> {
//  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`, {
//    method: "PATCH",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify(data),
//  })
//  if (!res.ok) {
//    const errorData = await res.json().catch(() => ({}))
//    throw new Error(errorData.message || "Error al actualizar la evaluación")
//  }
//  const responseData = await res.json()
//  return responseData.data
//}

// 3. ACTUALIZA TUS FUNCIONES DE "OBTENER" DATOS

export async function getEvaluacionesInstancias(): Promise<EvaluacionInstancia[]> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const resData = await res.json()
  // ¡Aplica el mapeo a la lista!
  return (resData.data || []).map(mapToCamelCase);
}

export async function getEvaluacionInstanciaById(id: string): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const resData = await res.json()
  // ¡Aplica el mapeo al objeto individual!
  return mapToCamelCase(resData.data);
}

// 4. ACTUALIZA TUS FUNCIONES DE "CREAR" Y "ACTUALIZAR"

export async function getEvaluacionesInstanciasByEstudiante(
  estudianteId: string,
  opts?: { limit?: number; offset?: number }
): Promise<EvaluacionInstancia[]> {
  const params = new URLSearchParams();
  params.set("estudianteId", estudianteId);
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts?.offset !== undefined) params.set("offset", String(opts.offset));
  const res = await fetch(`${API_URL}/evaluaciones-instancias?${params.toString()}`);
  if (!res.ok) throw new Error("Error al cargar el historial");
  const resData = await res.json();
  return (resData.data || []).map(mapToCamelCase);
}

export async function crearEvaluacionInstancia(
  data: Omit<EvaluacionInstancia, "id" | "createdAt">,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  // Lee el JSON de la respuesta INMEDIATAMENTE.
  const responseData = await res.json().catch(() => ({})); 
  
  if (!res.ok) {
    // Si la respuesta no es OK, lanza el error real del backend
    // (usamos la 'description' que definimos en el backend)
    const errorDescription = responseData.error?.description || responseData.message;
    throw new Error(errorDescription || "Error al crear la evaluación");
  }

  return mapToCamelCase(responseData.data);
}

export async function actualizarEvaluacionInstancia(
  id: string,
  data: Partial<Omit<EvaluacionInstancia, "id" | "createdAt">>,
): Promise<EvaluacionInstancia> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), // Envía camelCase (el backend lo maneja)
  })

  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Si la respuesta no es OK, lanza el error real del backend
    // (usamos la 'description' que definimos en el backend)
    const errorDescription = responseData.error?.description || responseData.message;
    throw new Error(errorDescription || "Error al crear la evaluación");
  }
  return mapToCamelCase(responseData.data);
}

export async function eliminarEvaluacionInstancia(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/evaluaciones-instancias/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar la evaluación")
}

export async function getEvaluaciones(): Promise<Evaluacion[]> {
  const res = await fetch(`${API_URL}/evaluaciones`)
  if (!res.ok) throw new Error("Error al cargar las evaluaciones")
  const data = await res.json()
  return data.data || []
}

export async function getEvaluacionById(id: string): Promise<Evaluacion> {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`)
  if (!res.ok) throw new Error("Error al cargar la evaluación")
  const data = await res.json()
  return data.data
}

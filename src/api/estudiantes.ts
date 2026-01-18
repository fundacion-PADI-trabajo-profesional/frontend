const API_URL = import.meta.env.VITE_API_URL

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    error?: {
        code: string
        description?: string
    } | null
}

// Tipo para los datos del formulario de creación
export interface EstudianteFormData {
    dni: string
    nombre: string
    apellido: string
    fecha_nacimiento: string // "YYYY-MM-DD"
    genero_id: string
    sala_id: number
    escuela_id: string
}

// Tipo para el estudiante devuelto por la API (en la lista)
export interface Estudiante {
    id: string
    persona_id: string
    genero_id: string
    grado: number | null
    sala_id: number
    fecha_creacion: string
    personas: {
        nombre: string | null
        primer_apellido: string | null
        segundo_apellido: string | null
        dni: string | null
    }
    salas: {
        nombre: string | null
    }
}

// Tipo para el estudiante recién creado (respuesta del POST)
export interface EstudianteCreado {
    id: string;
    persona_id: string;
    genero_id: string;
    grado: number | null;
    sala_id: number;
    fecha_creacion: string;
    persona: {
        id: string;
        dni: string | null;
        nombre: string | null;
        primer_apellido: string | null;
        segundo_apellido: string | null;
        fecha_nacimiento: string | null;
    }
}

// Tipos para los dropdowns del formulario
export interface Genero {
    id: string
    descripcion: string | null
}

export interface Sala {
    id: number
    nombre: string | null
    grado: number | null
}

// Primero, define la interfaz si no la tienes importada
export interface EscuelaDropdown {
    id: number;
    nombre: string;
}

// Agrega la función de exportación
export const getEscuelas = async (): Promise<EscuelaDropdown[]> => {
    const response = await fetch(`${API_URL}/escuelas`, {
        // headers: { "Authorization": `Bearer ${token}` }
    });
    return handleApiResponse<EscuelaDropdown[]>(response);
}

async function handleApiResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
        const errorMsg = data.error?.description || data.message || "Error desconocido"
        throw new Error(errorMsg)
    }

    return data.data
}

export const getEstudiantes = async (): Promise<Estudiante[]> => {
    // Obtenemos los datos del usuario logueado desde localStorage [cite: 1, 2]
    const stored = localStorage.getItem("padiUser");
    const user = stored ? JSON.parse(stored) : null;
    
    const params = new URLSearchParams();
    if (user) {
        // Enviamos el rol para que el backend sepa qué nivel de acceso aplicar [cite: 1, 15]
        params.append("rol", user.rol);
        // Si el usuario tiene escuela asignada, enviamos el ID [cite: 2, 18]
        if (user.escuela_id) {
            params.append("escuela_id", user.escuela_id);
        }
    }

    const response = await fetch(`${API_URL}/estudiantes?${params.toString()}`);
    return handleApiResponse<Estudiante[]>(response);
}

export const createEstudiante = async (formData: EstudianteFormData): Promise<EstudianteCreado> => {
    const response = await fetch(`${API_URL}/estudiantes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
    })

    return handleApiResponse<EstudianteCreado>(response)
}

export const getGeneros = async (): Promise<Genero[]> => {
    const response = await fetch(`${API_URL}/generos`, {
        // headers: { "Authorization": `Bearer ${token}` }
    });
    return handleApiResponse<Genero[]>(response);
}

export const getSalas = async (): Promise<Sala[]> => {
    const response = await fetch(`${API_URL}/salas`, {
        // headers: { "Authorization": `Bearer ${token}` }
    });
    return handleApiResponse<Sala[]>(response);
}
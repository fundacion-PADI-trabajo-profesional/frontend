// Archivo: frontend/src/utils/permissions.ts

export interface User {
    id: string;
    rol: string;
    escuela_id?: string;
    nombre?: string;
}

// Función para verificar permisos de equipo_padi
export function canEquipoPadi(userRole: string): boolean {
    return userRole === "equipo_padi";
}

// Función para verificar permisos de encargado_zona
export function canEncargadoZona(userRole: string): boolean {
    return userRole === "encargado_zona";
}

// Función para verificar permisos de director
export function canDirector(userRole: string): boolean {
    return userRole === "director";
}

// Permisos específicos para las nuevas funcionalidades
export const permissions = {
    // Crear evaluación: equipo_padi, encargado_zona, director
    createEvaluacion: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director"].includes(userRole),

    // Eliminar evaluación: equipo_padi, encargado_zona
    deleteEvaluacion: (userRole: string) =>
        ["equipo_padi", "encargado_zona"].includes(userRole),

    // Crear estudiante: equipo_padi, encargado_zona, director
    createEstudiante: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director"].includes(userRole),

    // Crear aula: equipo_padi, encargado_zona, director
    createAula: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director"].includes(userRole),

    // Asignar docente a aula: equipo_padi, encargado_zona, director
    assignDocenteAula: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director"].includes(userRole),

    // Asignar estudiante a aula: equipo_padi, encargado_zona, director
    assignEstudianteAula: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director"].includes(userRole),

    // Comenzar evaluación: equipo_padi, encargado_zona, director, docente
    startEvaluacion: (userRole: string) =>
        ["equipo_padi", "encargado_zona", "director", "docente"].includes(userRole),

    // Ver todas las escuelas (para equipo_padi)
    viewAllEscuelas: (userRole: string) =>
        userRole === "equipo_padi",

    // Ver todas las zonas (para equipo_padi y encargado_zona)
    viewZonas: (userRole: string) =>
        ["equipo_padi", "encargado_zona"].includes(userRole),
};

// Helper para obtener información del usuario desde localStorage
export function getCurrentUser(): User | null {
    try {
        const stored = localStorage.getItem("padiUser");
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

// Helper para verificar si el usuario actual tiene un permiso específico
export function hasPermission(permissionKey: keyof typeof permissions): boolean {
    const user = getCurrentUser();
    if (!user) return false;
    return permissions[permissionKey](user.rol);
}

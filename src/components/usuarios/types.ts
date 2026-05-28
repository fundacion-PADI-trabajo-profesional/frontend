/** Catálogo de roles disponibles en el sistema con su etiqueta de visualización. */
export const ROLES = [
  { value: "equipo_padi", label: "Equipo PADI" },
  { value: "director", label: "Director" },
  { value: "encargado_zona", label: "Encargado de Zona" },
  { value: "docente", label: "Docente" },
];

/**
 * Devuelve la etiqueta legible de un rol dado su valor interno.
 * Si el rol no existe en el catálogo, retorna el valor original como fallback.
 *
 * @param rol - Valor interno del rol (ej: `"equipo_padi"`).
 * @returns Etiqueta de visualización (ej: `"Equipo PADI"`), o el propio `rol` si no se encuentra.
 */
export const rolLabel = (rol: string) =>
  ROLES.find((r) => r.value === rol)?.label ?? rol;

/**
 * Mapea un rol a su color semántico de MUI para usar en `Chip` y similares.
 *
 * | Rol              | Color     |
 * |------------------|-----------|
 * | equipo_padi      | primary   |
 * | director         | warning   |
 * | encargado_zona   | info      |
 * | docente          | success   |
 * | (desconocido)    | default   |
 *
 * @param rol - Valor interno del rol.
 * @returns Color de MUI correspondiente.
 */
export const rolColor = (rol: string): "default" | "primary" | "warning" | "success" | "info" => {
  switch (rol) {
    case "equipo_padi": return "primary";
    case "director": return "warning";
    case "encargado_zona": return "info";
    case "docente": return "success";
    default: return "default";
  }
};

/**
 * Representa un usuario del sistema tal como lo devuelve el endpoint
 * `GET /admin/users`, enriquecido con el estado de activación.
 */
export interface Usuario {
  /** UUID del usuario en Supabase Auth y en la tabla `usuarios`. */
  id: string;
  /** Dirección de correo electrónico única del usuario. */
  email: string;
  nombre: string;
  apellido: string;
  /** Rol asignado. Debe coincidir con uno de los valores de {@link ROLES}. */
  rol: string;
  /** `"activo"` si el usuario ya inició sesión al menos una vez; `"pendiente"` si todavía no aceptó la invitación. */
  estado: "activo" | "pendiente";
}

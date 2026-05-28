export const ROLES = [
  { value: "equipo_padi", label: "Equipo PADI" },
  { value: "director", label: "Director" },
  { value: "encargado_zona", label: "Encargado de Zona" },
  { value: "docente", label: "Docente" },
];

export const rolLabel = (rol: string) =>
  ROLES.find((r) => r.value === rol)?.label ?? rol;

export const rolColor = (rol: string): "default" | "primary" | "warning" | "success" | "info" => {
  switch (rol) {
    case "equipo_padi": return "primary";
    case "director": return "warning";
    case "encargado_zona": return "info";
    case "docente": return "success";
    default: return "default";
  }
};

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  estado: "activo" | "pendiente";
}

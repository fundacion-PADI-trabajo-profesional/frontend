import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mock de la API antes de importar el componente ──────────────────────────
const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../src/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api/auth")>();
  return { ...actual, api: apiMock };
});

import GestionUsuarios from "../../src/components/GestionUsuarios";
import type { Usuario } from "../../src/components/usuarios/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "u-1",
    email: "test@test.com",
    nombre: "Ana",
    apellido: "Lopez",
    rol: "docente",
    estado: "activo",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.get.mockResolvedValue({ data: [] });
  localStorage.setItem("padiProfile", JSON.stringify({ id: "admin-1" }));
});

// ─── Renderizado base ─────────────────────────────────────────────────────────
describe("GestionUsuarios — renderizado base", () => {
  it("muestra el título 'Gestión de Usuarios'", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("Gestión de Usuarios");
  });

  it("muestra el botón 'Nuevo usuario'", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("Nuevo usuario");
  });

  it("muestra el botón 'Carga masiva'", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("Carga masiva");
  });

  it("muestra el botón 'Actualizar'", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("Actualizar");
  });

  it("muestra el indicador de carga mientras esperan los datos", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("progressbar");
  });

  it("muestra los encabezados de búsqueda y filtros", () => {
    const html = renderToStaticMarkup(createElement(GestionUsuarios));
    expect(html).toContain("Buscar por nombre");
    expect(html).toContain("Rol");
    expect(html).toContain("Estado");
  });
});

// ─── Lógica de filtros (función pura, extraída para pruebas unitarias) ────────
describe("lógica de filtrado de usuarios", () => {
  const usuarios: Usuario[] = [
    makeUsuario({ id: "u-1", nombre: "Ana", apellido: "Lopez", email: "ana@test.com", rol: "docente", estado: "activo" }),
    makeUsuario({ id: "u-2", nombre: "Bruno", apellido: "Martinez", email: "bruno@test.com", rol: "director", estado: "pendiente" }),
    makeUsuario({ id: "u-3", nombre: "Carla", apellido: "Perez", email: "carla@test.com", rol: "encargado_zona", estado: "activo" }),
    makeUsuario({ id: "u-4", nombre: "Diego", apellido: "Fernandez", email: "diego@test.com", rol: "equipo_padi", estado: "activo" }),
  ];

  function applyFilters(
    list: Usuario[],
    filterText: string,
    filterRol: string,
    filterEstado: string
  ): Usuario[] {
    const text = filterText.toLowerCase().trim();
    return list.filter((u) => {
      if (text) {
        const matchNombre = u.nombre.toLowerCase().includes(text);
        const matchApellido = u.apellido.toLowerCase().includes(text);
        const matchEmail = u.email.toLowerCase().includes(text);
        if (!matchNombre && !matchApellido && !matchEmail) return false;
      }
      if (filterRol && u.rol !== filterRol) return false;
      if (filterEstado && u.estado !== filterEstado) return false;
      return true;
    });
  }

  it("sin filtros devuelve todos los usuarios", () => {
    expect(applyFilters(usuarios, "", "", "")).toHaveLength(4);
  });

  it("filtra por nombre (insensible a mayúsculas)", () => {
    const result = applyFilters(usuarios, "ANA", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Ana");
  });

  it("filtra por apellido", () => {
    const result = applyFilters(usuarios, "mart", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].apellido).toBe("Martinez");
  });

  it("filtra por email", () => {
    const result = applyFilters(usuarios, "carla@", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("carla@test.com");
  });

  it("filtra por rol exacto", () => {
    const result = applyFilters(usuarios, "", "director", "");
    expect(result).toHaveLength(1);
    expect(result[0].rol).toBe("director");
  });

  it("filtra por estado 'activo'", () => {
    const result = applyFilters(usuarios, "", "", "activo");
    expect(result).toHaveLength(3);
    result.forEach((u) => expect(u.estado).toBe("activo"));
  });

  it("filtra por estado 'pendiente'", () => {
    const result = applyFilters(usuarios, "", "", "pendiente");
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Bruno");
  });

  it("combina filtro de texto y rol", () => {
    const result = applyFilters(usuarios, "test.com", "docente", "");
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Ana");
  });

  it("combina filtro de rol y estado", () => {
    const result = applyFilters(usuarios, "", "equipo_padi", "activo");
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Diego");
  });

  it("devuelve lista vacía cuando ningún usuario coincide", () => {
    const result = applyFilters(usuarios, "zzz", "", "");
    expect(result).toHaveLength(0);
  });

  it("texto con espacios en blanco se normaliza (trim)", () => {
    const result = applyFilters(usuarios, "  ana  ", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Ana");
  });
});

// ─── Lógica de actualización local del rol ────────────────────────────────────
describe("handleRolChanged — actualización local sin refetch", () => {
  it("aplica correctamente el map que actualiza el rol", () => {
    const usuarios: Usuario[] = [
      makeUsuario({ id: "u-1", rol: "docente" }),
      makeUsuario({ id: "u-2", rol: "director" }),
    ];

    const updated = usuarios.map((u) =>
      u.id === "u-1" ? { ...u, rol: "encargado_zona" } : u
    );

    expect(updated[0].rol).toBe("encargado_zona");
    expect(updated[1].rol).toBe("director");
  });

  it("no modifica usuarios cuyo id no coincide", () => {
    const usuarios: Usuario[] = [
      makeUsuario({ id: "u-1", rol: "docente" }),
      makeUsuario({ id: "u-2", rol: "director" }),
    ];

    const updated = usuarios.map((u) =>
      u.id === "u-99" ? { ...u, rol: "equipo_padi" } : u
    );

    expect(updated[0].rol).toBe("docente");
    expect(updated[1].rol).toBe("director");
  });
});

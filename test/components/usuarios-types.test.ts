import { describe, it, expect } from "vitest";
import { ROLES, rolLabel, rolColor } from "../../src/components/usuarios/types";

// ─── ROLES ───────────────────────────────────────────────────────────────────
describe("ROLES", () => {
  it("contiene exactamente 4 roles", () => {
    expect(ROLES).toHaveLength(4);
  });

  it("incluye todos los roles del sistema", () => {
    const values = ROLES.map((r) => r.value);
    expect(values).toContain("equipo_padi");
    expect(values).toContain("director");
    expect(values).toContain("encargado_zona");
    expect(values).toContain("docente");
  });

  it("cada rol tiene value y label no vacíos", () => {
    for (const rol of ROLES) {
      expect(rol.value).toBeTruthy();
      expect(rol.label).toBeTruthy();
    }
  });

  it("las etiquetas son legibles en español", () => {
    const labels = ROLES.map((r) => r.label);
    expect(labels).toContain("Equipo PADI");
    expect(labels).toContain("Director");
    expect(labels).toContain("Encargado de Zona");
    expect(labels).toContain("Docente");
  });
});

// ─── rolLabel ─────────────────────────────────────────────────────────────────
describe("rolLabel", () => {
  it("devuelve 'Equipo PADI' para equipo_padi", () => {
    expect(rolLabel("equipo_padi")).toBe("Equipo PADI");
  });

  it("devuelve 'Director' para director", () => {
    expect(rolLabel("director")).toBe("Director");
  });

  it("devuelve 'Encargado de Zona' para encargado_zona", () => {
    expect(rolLabel("encargado_zona")).toBe("Encargado de Zona");
  });

  it("devuelve 'Docente' para docente", () => {
    expect(rolLabel("docente")).toBe("Docente");
  });

  it("devuelve el valor original como fallback para roles desconocidos", () => {
    expect(rolLabel("superadmin")).toBe("superadmin");
    expect(rolLabel("unknown_role")).toBe("unknown_role");
  });

  it("devuelve cadena vacía como fallback para string vacío", () => {
    expect(rolLabel("")).toBe("");
  });
});

// ─── rolColor ─────────────────────────────────────────────────────────────────
describe("rolColor", () => {
  it("devuelve 'primary' para equipo_padi", () => {
    expect(rolColor("equipo_padi")).toBe("primary");
  });

  it("devuelve 'warning' para director", () => {
    expect(rolColor("director")).toBe("warning");
  });

  it("devuelve 'info' para encargado_zona", () => {
    expect(rolColor("encargado_zona")).toBe("info");
  });

  it("devuelve 'success' para docente", () => {
    expect(rolColor("docente")).toBe("success");
  });

  it("devuelve 'default' para roles desconocidos", () => {
    expect(rolColor("superadmin")).toBe("default");
    expect(rolColor("")).toBe("default");
    expect(rolColor("DOCENTE")).toBe("default");
  });

  it("el resultado es siempre un color válido de MUI", () => {
    const validColors = ["default", "primary", "warning", "success", "info"];
    for (const rol of ROLES) {
      expect(validColors).toContain(rolColor(rol.value));
    }
  });
});

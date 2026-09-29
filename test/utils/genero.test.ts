import { describe, it, expect } from "vitest";
import { normalizarGenero } from "../../src/utils/genero";

describe("normalizarGenero", () => {
  it("acepta las letras de la plantilla en cualquier caja y con espacios", () => {
    expect(normalizarGenero("M")).toBe("M");
    expect(normalizarGenero("f")).toBe("F");
    expect(normalizarGenero(" m ")).toBe("M");
    expect(normalizarGenero("x")).toBe("X");
  });

  it("acepta las palabras habituales y las lleva a la letra del catálogo", () => {
    expect(normalizarGenero("Masculino")).toBe("M");
    expect(normalizarGenero("FEMENINO")).toBe("F");
    expect(normalizarGenero("Varón")).toBe("M");
    expect(normalizarGenero("mujer")).toBe("F");
    expect(normalizarGenero("Nena")).toBe("F");
    expect(normalizarGenero("Niño")).toBe("M");
    expect(normalizarGenero("Otro")).toBe("X");
  });

  it("devuelve null cuando falta o no se reconoce", () => {
    expect(normalizarGenero(null)).toBeNull();
    expect(normalizarGenero(undefined)).toBeNull();
    expect(normalizarGenero("")).toBeNull();
    expect(normalizarGenero("   ")).toBeNull();
    expect(normalizarGenero("Masc.")).toBeNull();
    expect(normalizarGenero("1")).toBeNull();
  });
});

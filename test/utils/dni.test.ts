import { describe, it, expect } from "vitest";
import { normalizarDni, esIdentificadorInterno, etiquetaDni } from "../../src/utils/dni";

describe("normalizarDni", () => {
  it("pasa a mayúsculas y quita espacios, guiones y puntos", () => {
    expect(normalizarDni("sm-000001")).toBe("SM000001");
    expect(normalizarDni(" sm 000001 ")).toBe("SM000001");
    expect(normalizarDni("ste_000042")).toBe("STE000042");
  });

  it("limpia un DNI real escrito con puntos o espacios", () => {
    expect(normalizarDni("45.123.456")).toBe("45123456");
    expect(normalizarDni(" 45 123 456 ")).toBe("45123456");
  });

  it("acepta números tal como los devuelve Excel", () => {
    expect(normalizarDni(45123456)).toBe("45123456");
  });

  it("devuelve null cuando no hay valor", () => {
    expect(normalizarDni(null)).toBeNull();
    expect(normalizarDni(undefined)).toBeNull();
    expect(normalizarDni("")).toBeNull();
    expect(normalizarDni("   ")).toBeNull();
    expect(normalizarDni("-.-")).toBeNull();
  });
});

describe("esIdentificadorInterno", () => {
  it("es interno cuando tiene alguna letra", () => {
    expect(esIdentificadorInterno("SM000001")).toBe(true);
    expect(esIdentificadorInterno("STE42")).toBe(true);
  });

  it("no es interno cuando es un DNI real (solo dígitos)", () => {
    expect(esIdentificadorInterno("45123456")).toBe(false);
  });

  it("no es interno cuando está vacío", () => {
    expect(esIdentificadorInterno(null)).toBe(false);
    expect(esIdentificadorInterno(undefined)).toBe(false);
    expect(esIdentificadorInterno("")).toBe(false);
  });
});

describe("etiquetaDni", () => {
  it("rotula un DNI real como DNI", () => {
    expect(etiquetaDni("45123456")).toBe("DNI: 45123456");
  });

  it("rotula un identificador interno para que no se confunda con un documento", () => {
    expect(etiquetaDni("SM000001")).toBe("ID interno: SM000001");
  });

  it("indica ausencia cuando no hay valor", () => {
    expect(etiquetaDni(null)).toBe("Sin DNI");
    expect(etiquetaDni(undefined)).toBe("Sin DNI");
    expect(etiquetaDni("")).toBe("Sin DNI");
  });
});

import { describe, it, expect } from "vitest";
import { respuestaSumaPunto, paletaBotonRespuesta, PALETA_SUMA, PALETA_NO_SUMA } from "../../src/utils/respuestas";

describe("respuestaSumaPunto", () => {
  it("en una pregunta normal suma el SÍ", () => {
    expect(respuestaSumaPunto(1, false)).toBe(true);
    expect(respuestaSumaPunto(0, false)).toBe(false);
  });

  it("en una pregunta invertida suma el NO", () => {
    expect(respuestaSumaPunto(0, true)).toBe(true);
    expect(respuestaSumaPunto(1, true)).toBe(false);
  });

  it("sin respuesta no suma, invertida o no", () => {
    expect(respuestaSumaPunto(null, true)).toBe(false);
    expect(respuestaSumaPunto(undefined, false)).toBe(false);
  });

  it("trata invertida ausente como pregunta normal", () => {
    expect(respuestaSumaPunto(1, undefined)).toBe(true);
    expect(respuestaSumaPunto(0, null)).toBe(false);
  });
});

describe("paletaBotonRespuesta", () => {
  it("pregunta normal: Sí verde, No rojo", () => {
    expect(paletaBotonRespuesta(1, false)).toBe(PALETA_SUMA);
    expect(paletaBotonRespuesta(0, false)).toBe(PALETA_NO_SUMA);
  });

  it("pregunta invertida (socioemocional): la cruz del No se pinta de verde y el Sí de rojo", () => {
    expect(paletaBotonRespuesta(0, true)).toBe(PALETA_SUMA);
    expect(paletaBotonRespuesta(1, true)).toBe(PALETA_NO_SUMA);
  });

  it("las paletas tienen los tres tonos que usa el botón", () => {
    for (const p of [PALETA_SUMA, PALETA_NO_SUMA]) {
      expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(p.borderColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(p.hoverBg).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

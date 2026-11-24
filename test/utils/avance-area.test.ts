import { describe, it, expect } from "vitest";
import { anilloDeArea } from "../../src/utils/avance-area";

const area = (estadoId: string, pautasRespondidas?: number, totalPreguntas?: number) => ({ estadoId, pautasRespondidas, totalPreguntas });

describe("anilloDeArea", () => {
  it("área aprobada: anillo completo, sin números, leyenda Aprobada", () => {
    expect(anilloDeArea(area("A", 10, 10))).toEqual({ estado: "aprobada", porcentaje: 100, centro: null, leyenda: "Aprobada" });
  });

  it("área desaprobada: anillo completo, sin números (7 de 10 se leería como nota)", () => {
    expect(anilloDeArea(area("D", 10, 10))).toEqual({ estado: "desaprobada", porcentaje: 100, centro: null, leyenda: "Desaprobada" });
  });

  it("área a medias: el número es avance de carga y la leyenda dice cuántas faltan", () => {
    expect(anilloDeArea(area("E", 5, 9))).toEqual({ estado: "en_progreso", porcentaje: 56, centro: "5 de 9", leyenda: "Faltan 4" });
  });

  it("si falta una sola, en singular", () => {
    expect(anilloDeArea(area("E", 8, 9)).leyenda).toBe("Falta 1");
  });

  it("área sin empezar: anillo vacío con el total", () => {
    expect(anilloDeArea(area("N", 0, 8))).toEqual({ estado: "sin_empezar", porcentaje: 0, centro: "0 de 8", leyenda: "Sin empezar" });
  });

  it("estado N pero con respuestas cargadas cuenta como en progreso", () => {
    expect(anilloDeArea(area("N", 2, 8)).estado).toBe("en_progreso");
  });

  it("estado E sin ninguna pauta completa sigue en progreso, no 'sin empezar'", () => {
    expect(anilloDeArea(area("E", 0, 8))).toEqual({ estado: "en_progreso", porcentaje: 0, centro: "0 de 8", leyenda: "Faltan 8" });
  });

  it("sin datos de avance (listados que no lo traen) muestra sólo el estado", () => {
    expect(anilloDeArea(area("E"))).toEqual({ estado: "en_progreso", porcentaje: 0, centro: null, leyenda: "En progreso" });
    expect(anilloDeArea(area("N", 0, 0))).toEqual({ estado: "sin_empezar", porcentaje: 0, centro: null, leyenda: "Sin empezar" });
  });

  it("todas respondidas pero el área todavía no cerró: no dice 'Faltan 0'", () => {
    expect(anilloDeArea(area("E", 9, 9))).toEqual({ estado: "en_progreso", porcentaje: 100, centro: "9 de 9", leyenda: "Sin cerrar" });
  });
});

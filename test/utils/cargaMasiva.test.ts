import { describe, it, expect } from "vitest";
import { etiquetaAula, etiquetaAulaAnterior, resolverAula, type AulaCandidata } from "../../src/utils/cargaMasiva";

const aula = (sala_id: number, comision = "TM", turno = "Mañana") => ({ sala_id, comision, turno });

describe("etiquetaAula", () => {
  it("incluye la sala para que dos aulas del mismo turno no se llamen igual", () => {
    expect(etiquetaAula("El Portal de Belén", aula(3))).toBe("El Portal de Belén - Sala 3 - TM - Mañana");
    expect(etiquetaAula("El Portal de Belén", aula(5))).toBe("El Portal de Belén - Sala 5 - TM - Mañana");
  });

  it("la etiqueta anterior es la que traían las plantillas viejas", () => {
    expect(etiquetaAulaAnterior("El Portal de Belén", aula(3))).toBe("El Portal de Belén - TM - Mañana");
  });
});

describe("resolverAula", () => {
  const belen = (sala: number): AulaCandidata => ({ escuela_id: "esc-1", aula_id: `aula-${sala}`, sala_id: sala });

  it("con una sola candidata compatible la usa", () => {
    expect(resolverAula([belen(3)], 3)).toEqual({ escuela_id: "esc-1", aula_id: "aula-3", incompatible: false });
  });

  it("con una etiqueta vieja repetida elige el aula de la sala del alumno", () => {
    const candidatas = [belen(3), belen(4), belen(5)];
    expect(resolverAula(candidatas, 4)).toEqual({ escuela_id: "esc-1", aula_id: "aula-4", incompatible: false });
    expect(resolverAula(candidatas, 3)).toEqual({ escuela_id: "esc-1", aula_id: "aula-3", incompatible: false });
  });

  it("si ninguna candidata es de la sala del alumno, conserva el colegio y marca el aula como incompatible", () => {
    expect(resolverAula([belen(5)], 3)).toEqual({ escuela_id: "esc-1", aula_id: null, incompatible: true });
    expect(resolverAula([belen(3), belen(4)], null)).toEqual({ escuela_id: "esc-1", aula_id: null, incompatible: true });
  });

  it("sin candidatas devuelve null", () => {
    expect(resolverAula([], 3)).toBeNull();
  });
});

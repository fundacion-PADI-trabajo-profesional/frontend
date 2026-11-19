import { describe, it, expect } from "vitest";
import {
  DATOS_EVALUADOR_VACIOS,
  esRangoSesiones,
  estadoDatosEvaluador,
  insigniasDe,
  preguntaSesiones,
  type DatosEvaluador,
} from "../../src/utils/datosEvaluador";

const datos = (parcial: Partial<DatosEvaluador>): DatosEvaluador => ({ ...DATOS_EVALUADOR_VACIOS, ...parcial });

describe("preguntaSesiones", () => {
  it("sólo la evaluación de cierre pregunta por las sesiones", () => {
    expect(preguntaSesiones("cierre")).toBe(true);
    expect(preguntaSesiones("inicial")).toBe(false);
  });
});

describe("esRangoSesiones", () => {
  it("acepta los tres rangos y rechaza lo demás", () => {
    expect(esRangoSesiones("menos_5")).toBe(true);
    expect(esRangoSesiones("entre_5_y_9")).toBe(true);
    expect(esRangoSesiones("10_o_mas")).toBe(true);
    expect(esRangoSesiones("7")).toBe(false);
    expect(esRangoSesiones(null)).toBe(false);
  });
});

describe("estadoDatosEvaluador", () => {
  it("sin datos (o sin objeto) está sin iniciar", () => {
    expect(estadoDatosEvaluador(DATOS_EVALUADOR_VACIOS, "cierre")).toBe("sin_iniciar");
    expect(estadoDatosEvaluador(undefined, "inicial")).toBe("sin_iniciar");
    expect(estadoDatosEvaluador(null, "inicial")).toBe("sin_iniciar");
  });

  it("una inicial se completa respondiendo tratamiento (aunque sea 'no')", () => {
    expect(estadoDatosEvaluador(datos({ enTratamiento: false }), "inicial")).toBe("completa");
    expect(estadoDatosEvaluador(datos({ enTratamiento: true, tieneCud: true }), "inicial")).toBe("completa");
  });

  it("un cierre necesita además las sesiones", () => {
    expect(estadoDatosEvaluador(datos({ enTratamiento: true }), "cierre")).toBe("en_progreso");
    expect(estadoDatosEvaluador(datos({ sesionesCompletadas: "menos_5" }), "cierre")).toBe("en_progreso");
    expect(estadoDatosEvaluador(datos({ enTratamiento: false, sesionesCompletadas: "10_o_mas" }), "cierre")).toBe("completa");
  });

  it("sólo observaciones o sólo CUD es 'en progreso'", () => {
    expect(estadoDatosEvaluador(datos({ observaciones: "Algo" }), "inicial")).toBe("en_progreso");
    expect(estadoDatosEvaluador(datos({ tieneCud: false }), "inicial")).toBe("en_progreso");
  });

  it("en una inicial ignora sesiones que hayan quedado de cuando era cierre", () => {
    expect(estadoDatosEvaluador(datos({ sesionesCompletadas: "menos_5" }), "inicial")).toBe("sin_iniciar");
  });
});

describe("insigniasDe", () => {
  it("sin contexto o todo en null/false no muestra nada", () => {
    expect(insigniasDe(undefined)).toEqual([]);
    expect(insigniasDe(null)).toEqual([]);
    expect(insigniasDe({ en_tratamiento: null, tiene_cud: null })).toEqual([]);
    expect(insigniasDe({ en_tratamiento: false, tiene_cud: false })).toEqual([]);
  });

  it("muestra C y T según corresponda, CUD primero", () => {
    expect(insigniasDe({ en_tratamiento: true, tiene_cud: false }).map((i) => i.letra)).toEqual(["T"]);
    expect(insigniasDe({ en_tratamiento: null, tiene_cud: true }).map((i) => i.letra)).toEqual(["C"]);
    expect(insigniasDe({ en_tratamiento: true, tiene_cud: true }).map((i) => i.clave)).toEqual(["cud", "tratamiento"]);
  });
});

import { describe, it, expect } from "vitest";
import {
  layoutCuadricula, estadosTotales, estadosArea, estadosTira, estadosComparativo, textoResumenComparativo,
  nombreArchivo, colorCelda, nombreCortoArea, iconoArea, textoAreas, salaTieneModo, escuelaTieneModo, subtituloModo, slug,
} from "../../src/utils/reporteEscuela";
import { AREAS, REPORTE_24, REPORTE_SIN_CIERRE, mkSala } from "../fixtures/reporteEscuela";

describe("layoutCuadricula", () => {
  it("elige columnas según N y nunca supera 14 u de alto", () => {
    expect(layoutCuadricula(24, "sala").cols).toBe(8);
    expect(layoutCuadricula(40, "sala").cols).toBe(10);
    expect(layoutCuadricula(44, "sala").cols).toBe(12);
    expect(layoutCuadricula(100, "sala").cols).toBe(15);
    expect(layoutCuadricula(24, "area").cols).toBe(12);
    expect(layoutCuadricula(44, "area").cols).toBe(15);
    expect(layoutCuadricula(100, "area").cols).toBe(20);
    expect(layoutCuadricula(62, "escuela").cols).toBe(13);
    expect(layoutCuadricula(300, "escuela").cols).toBe(28);
    for (const n of [24, 44, 62, 100, 101, 130, 160, 161, 200, 250, 251, 300]) {
      for (const tipo of ["sala", "area", "escuela", "areaEscuela", "tira"] as const) {
        expect(layoutCuadricula(n, tipo).alto, `${tipo} ${n}`).toBeLessThanOrEqual(14);
      }
    }
    // Verify tier boundaries for sala
    expect(layoutCuadricula(100, "sala").cols).toBe(15);
    expect(layoutCuadricula(101, "sala").cols).toBe(18);
    expect(layoutCuadricula(160, "sala").cols).toBe(18);
    expect(layoutCuadricula(161, "sala").cols).toBe(22);
    expect(layoutCuadricula(250, "sala").cols).toBe(22);
    expect(layoutCuadricula(251, "sala").cols).toBe(25);
  });
  it("tira: una fila hasta 30, dos hasta 60, tres después; lado máximo 0.62", () => {
    expect(layoutCuadricula(24, "tira")).toMatchObject({ cols: 24, filas: 1 });
    expect(layoutCuadricula(44, "tira")).toMatchObject({ cols: 22, filas: 2 });
    expect(layoutCuadricula(100, "tira")).toMatchObject({ cols: 34, filas: 3 });
    expect(layoutCuadricula(10, "tira").tile).toBe(0.62);
  });
  it("el lado sale del ancho fijo y el gap", () => {
    const l = layoutCuadricula(24, "sala");
    expect(l.tile).toBeCloseTo((25 - 7 * 0.42) / 8, 5);
    expect(l.filas).toBe(3);
  });
});

describe("estados de cuadrícula", () => {
  const ini = REPORTE_24.salas[0].inicial!;
  it("totales: verdes primero", () => {
    const e = estadosTotales(ini);
    expect(e).toHaveLength(24);
    expect(e.slice(0, 7).every((x) => x === "g")).toBe(true);
    expect(e.slice(7).every((x) => x === "b")).toBe(true);
  });
  it("área: g, luego b, luego h (sin dato)", () => {
    const conNull = { ...ini, estudiantes: ini.estudiantes.map((e, i) => (i === 0 ? { ...e, areas: { ...e.areas, sm: null } } : e)) };
    const e = estadosArea(conNull, "sm");
    expect(e.filter((x) => x === "h")).toHaveLength(1);
    expect(e[e.length - 1]).toBe("h");
    expect(e.indexOf("b")).toBeGreaterThan(e.lastIndexOf("g"));
  });
  it("tira: k azules y el resto gris", () => {
    expect(estadosTira(3, 5)).toEqual(["b", "b", "b", "h", "h"]);
  });
  it("comparativo: mismas posiciones; aprobaron_inicial primero, luego los del comparativo en su orden", () => {
    const sala = mkSala(5, 10, 4);
    const par = estadosComparativo(sala)!;
    expect(par.inicial).toHaveLength(10);
    expect(par.cierre).toHaveLength(10);
    expect(par.inicial.slice(0, 4)).toEqual(["g", "g", "g", "g"]);
    expect(par.inicial.slice(4).every((x) => x === "b")).toBe(true);
    sala.comparativo!.estudiantes.forEach((e, i) => {
      expect(par.cierre[4 + i]).toBe(e.resultado === "recupero" ? "g" : e.resultado === "persiste" ? "b" : "h");
    });
  });
  it("comparativo por área: usa el estado del área", () => {
    const sala = mkSala(5, 10, 4);
    const par = estadosComparativo(sala, "sm")!;
    sala.comparativo!.estudiantes.forEach((e, i) => {
      const esperado = e.areas.sm === "pendiente" ? "h" : e.areas.sm === "ok" || e.areas.sm === "recupero" ? "g" : "b";
      expect(par.cierre[4 + i]).toBe(esperado);
    });
  });
  it("comparativo null si la sala no tiene inicial", () => {
    expect(estadosComparativo({ ...mkSala(5, 10, 4), inicial: null, comparativo: null })).toBeNull();
  });
});

describe("textos", () => {
  it("textoResumenComparativo", () => {
    const c = { ...REPORTE_24.salas[0].comparativo!, base: 24, aprobaron_inicial: 7, reevaluados: 15, recuperaron: 9, persisten: 6, pendientes: 2 };
    expect(textoResumenComparativo(c)).toBe(
      "De los 17 que no pasaron la inicial se reevaluó a 15: 9 recuperaron todas las áreas, 6 siguen con áreas para reforzar y 2 todavía no tienen evaluación de cierre. Cada cuadrado es el mismo chico en las dos cuadrículas: los que pasaron de azul a verde son los que recuperaron."
    );
  });
  it("subtituloModo", () => {
    expect(subtituloModo("inicial", 2025)).toBe("Evaluación inicial · 2025");
    expect(subtituloModo("cierre", 2025)).toBe("Evaluación de cierre · 2025");
    expect(subtituloModo("comparativo", 2025)).toBe("Inicial vs cierre · 2025");
  });
  it("nombreArchivo y slug", () => {
    expect(slug("Jardín Municipal N° 1")).toBe("jardin-municipal-n-1");
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "inicial" })).toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial.pdf");
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "comparativo", sala: "Sala de 5" })).toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial-vs-cierre-sala-de-5.pdf");
  });
  it("áreas: nombre corto, ícono por orden y texto de la nómina", () => {
    expect(AREAS.map(nombreCortoArea)).toEqual(["Sensoriomotora", "Lenguaje", "Cognitiva", "Socioemocional"]);
    expect(AREAS.map(iconoArea)).toEqual(["pelota", "globo", "bloques", "corazon"]);
    expect(iconoArea({ id: "x", nombre: "Otra", orden: 5 })).toBeNull();
    expect(textoAreas(["sm", "cl"], AREAS)).toBe("Sensoriomotora, Lenguaje");
    expect(textoAreas(["sm", "cl", "cog", "se"], AREAS)).toBe("Las 4 áreas");
  });
});

describe("colorCelda", () => {
  it("interpola de blanco a azul y pasa a texto blanco por encima de 0.55", () => {
    expect(colorCelda(0, 10)).toEqual({ bg: "#EFF2F7", fg: "#2B2F33" });
    expect(colorCelda(10, 10)).toEqual({ bg: "#5F7EB1", fg: "#FFFFFF" });
    expect(colorCelda(5, 10).fg).toBe("#2B2F33");
    expect(colorCelda(6, 10).fg).toBe("#FFFFFF");
    expect(colorCelda(0, 0).fg).toBe("#2B2F33");
  });
});

describe("modos disponibles", () => {
  it("salaTieneModo / escuelaTieneModo", () => {
    const s = REPORTE_24.salas[0];
    expect(salaTieneModo(s, "inicial")).toBe(true);
    expect(salaTieneModo(s, "cierre")).toBe(true);
    expect(salaTieneModo(s, "comparativo")).toBe(true);
    expect(salaTieneModo(REPORTE_SIN_CIERRE.salas[0], "cierre")).toBe(false);
    expect(escuelaTieneModo(REPORTE_SIN_CIERRE, "comparativo")).toBe(false);
    expect(escuelaTieneModo(REPORTE_24, "comparativo")).toBe(true);
  });
});

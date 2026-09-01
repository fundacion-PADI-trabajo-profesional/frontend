import { describe, it, expect } from "vitest";
import {
  layoutCuadricula, estadosTotales, estadosArea, estadosTira, textoResumenComparativo,
  nombreArchivo, colorCelda, nombreCortoArea, iconoArea, textoAreas, salaTieneModo, escuelaTieneModo, subtituloModo, slug,
  estadosParComparativo, estadosParAreaComparativo, porcentaje, chipsComparativo, arcoDonut,
} from "../../src/utils/reporteEscuela";
import type { Comparativo, EstudianteComparativo } from "../../src/api/reportes";
import { AREAS, REPORTE_24, REPORTE_SIN_CIERRE } from "../fixtures/reporteEscuela";

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
});

describe("estadosParComparativo (par ordenado, sin posiciones estables)", () => {
  const c: Comparativo = {
    base: 10, aprobaron_inicial: 4, reevaluados: 6, recuperaron: 3, persisten: 2, pendientes: 1, cierra_con: 7,
    por_area: [], estudiantes: [], pautas: [],
  };
  it("inicial: aprobaron_inicial en verde, el resto en azul", () => {
    expect(estadosParComparativo(c).inicial).toEqual(["g", "g", "g", "g", "b", "b", "b", "b", "b", "b"]);
  });
  it("cierre: aprobaron_inicial+recuperaron en verde, persisten en azul, pendientes en gris", () => {
    expect(estadosParComparativo(c).cierre).toEqual(["g", "g", "g", "g", "g", "g", "g", "b", "b", "h"]);
  });
});

describe("estadosParAreaComparativo (par ordenado por área)", () => {
  const areaId = "sm";
  const mk = (por_area: Comparativo["por_area"], base = 10): Comparativo => ({
    base, aprobaron_inicial: 0, reevaluados: 0, recuperaron: 0, persisten: 0, pendientes: 0, cierra_con: 0,
    por_area, estudiantes: [], pautas: [],
  });
  it("inicial: aprobados_inicial en verde, resto en azul", () => {
    const c = mk([{ area_id: areaId, aprobados_inicial: 5, aprobados_cierre: 8, sin_dato: 1 }]);
    expect(estadosParAreaComparativo(c, areaId).inicial).toEqual(["g", "g", "g", "g", "g", "b", "b", "b", "b", "b"]);
  });
  it("cierre: aprobados_cierre en verde, azul intermedio, sin_dato en gris al final", () => {
    const c = mk([{ area_id: areaId, aprobados_inicial: 5, aprobados_cierre: 8, sin_dato: 1 }]);
    expect(estadosParAreaComparativo(c, areaId).cierre).toEqual(["g", "g", "g", "g", "g", "g", "g", "g", "b", "h"]);
  });
  it("clampea el largo de cierre a exactamente `base` cuando aprobados_cierre + sin_dato > base (conserva g entero, luego h, ajusta b)", () => {
    const c = mk([{ area_id: areaId, aprobados_inicial: 5, aprobados_cierre: 8, sin_dato: 5 }], 10);
    const par = estadosParAreaComparativo(c, areaId);
    expect(par.cierre).toHaveLength(10);
    expect(par.cierre.filter((x) => x === "b")).toHaveLength(0);
    expect(par.cierre).toEqual(["g", "g", "g", "g", "g", "g", "g", "g", "h", "h"]);
  });
  it("clampea a 0 en vez de negativo, e incluso g solo topeado a `base` mantiene el largo exacto", () => {
    const c = mk([{ area_id: areaId, aprobados_inicial: 5, aprobados_cierre: 5, sin_dato: 3 }], 5);
    const par = estadosParAreaComparativo(c, areaId);
    expect(par.cierre).toHaveLength(5);
    expect(par.cierre.filter((x) => x === "b")).toHaveLength(0);
    expect(par.cierre).toEqual(["g", "g", "g", "g", "g"]);
  });
  it("área sin datos en por_area: todo en 0", () => {
    const c = mk([], 5);
    expect(estadosParAreaComparativo(c, "otra")).toEqual({ inicial: ["b", "b", "b", "b", "b"], cierre: ["b", "b", "b", "b", "b"] });
  });
});

describe("textos", () => {
  it("textoResumenComparativo", () => {
    const c = { ...REPORTE_24.salas[0].comparativo!, base: 24, aprobaron_inicial: 7, reevaluados: 15, recuperaron: 9, persisten: 6, pendientes: 2 };
    expect(textoResumenComparativo(c)).toBe(
      "De los 17 que no pasaron la inicial se reevaluó a 15: 9 recuperaron todas las áreas, 6 siguen con áreas para reforzar y 2 todavía no tienen evaluación de cierre."
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
  it("nombreArchivo agrega -turno-<slug> antes de .pdf cuando se pasa turno", () => {
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "inicial", turno: "Mañana" }))
      .toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial-turno-manana.pdf");
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "comparativo", sala: "Sala de 5", turno: "Tarde" }))
      .toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial-vs-cierre-sala-de-5-turno-tarde.pdf");
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "inicial", turno: null }))
      .toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial.pdf");
    expect(nombreArchivo({ escuela: "Jardín Municipal N° 1", periodo: 2025, modo: "inicial", turno: "" }))
      .toBe("PADI-Reporte-jardin-municipal-n-1-2025-inicial.pdf");
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

describe("extensiones para el comparativo", () => {
  it("layoutCuadricula acepta ancho override (pares del comparativo)", () => {
    expect(layoutCuadricula(24, "sala", 24).tile).toBeCloseTo((24 - 7 * 0.42) / 8, 5);
    expect(layoutCuadricula(24, "area", 12.5).tile).toBeCloseTo((12.5 - 11 * 0.17) / 12, 5);
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

describe("porcentaje", () => {
  it("redondea con espacio antes del %", () => {
    expect(porcentaje(1, 3)).toBe("33 %");
    expect(porcentaje(2, 3)).toBe("67 %");
    expect(porcentaje(10, 10)).toBe("100 %");
    expect(porcentaje(0, 10)).toBe("0 %");
  });
  it("devuelve — cuando n es 0 o negativo", () => {
    expect(porcentaje(0, 0)).toBe("—");
    expect(porcentaje(5, -1)).toBe("—");
  });
});

describe("chipsComparativo", () => {
  it("una chip por área, en orden de catálogo, aprobada = ok o recupero", () => {
    const e: EstudianteComparativo = {
      estudiante_id: "e1", nombre: "Test", resultado: "persiste",
      areas: { sm: "ok", cl: "recupero", cog: "persiste", se: "nueva" },
    };
    const chips = chipsComparativo(e, AREAS);
    expect(chips.map((c) => c.area.id)).toEqual(["sm", "cl", "cog", "se"]);
    expect(chips.map((c) => c.aprobada)).toEqual([true, true, false, false]);
  });
  it("respeta el orden de catálogo aunque las áreas vengan desordenadas", () => {
    const desordenadas = [AREAS[2], AREAS[0], AREAS[3], AREAS[1]];
    const e: EstudianteComparativo = {
      estudiante_id: "e1", nombre: "Test", resultado: "recupero",
      areas: { sm: "ok", cl: "ok", cog: "ok", se: "ok" },
    };
    expect(chipsComparativo(e, desordenadas).map((c) => c.area.id)).toEqual(["sm", "cl", "cog", "se"]);
  });
  it("devuelve [] cuando el resultado es pendiente", () => {
    const e: EstudianteComparativo = {
      estudiante_id: "e1", nombre: "Test", resultado: "pendiente",
      areas: { sm: "pendiente", cl: "pendiente", cog: "pendiente", se: "pendiente" },
    };
    expect(chipsComparativo(e, AREAS)).toEqual([]);
  });
});

describe("arcoDonut", () => {
  const nums = (d: string) => (d.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi) ?? []).map(Number);

  it("cuarto de círculo de las 12 a las 3: extremos correctos (1e-6), large-arc=0, sweep=1", () => {
    const d = arcoDonut(0, 0, 10, 0, 90);
    const [mx, my, rx, ry, , large, sweep, ex, ey] = nums(d);
    expect(mx).toBeCloseTo(0, 6);
    expect(my).toBeCloseTo(-10, 6);
    expect(rx).toBe(10);
    expect(ry).toBe(10);
    expect(large).toBe(0);
    expect(sweep).toBe(1);
    expect(ex).toBeCloseTo(10, 6);
    expect(ey).toBeCloseTo(0, 6);
  });
  it("cuarto de círculo con centro desplazado", () => {
    const d = arcoDonut(50, 50, 20, 90, 180);
    const [mx, my, , , , large, sweep, ex, ey] = nums(d);
    expect(mx).toBeCloseTo(70, 6);
    expect(my).toBeCloseTo(50, 6);
    expect(large).toBe(0);
    expect(sweep).toBe(1);
    expect(ex).toBeCloseTo(50, 6);
    expect(ey).toBeCloseTo(70, 6);
  });
  it("arco mayor a 180°: large-arc=1", () => {
    const d = arcoDonut(0, 0, 10, 0, 200);
    const [, , , , , large, sweep] = nums(d);
    expect(large).toBe(1);
    expect(sweep).toBe(1);
  });
  it("arco de exactamente 180°: large-arc=0", () => {
    const d = arcoDonut(0, 0, 10, 0, 180);
    const [, , , , , large] = nums(d);
    expect(large).toBe(0);
  });
  it("círculo completo (hasta-desde >= 360): dos arcos de 180°, vuelve al punto de partida", () => {
    const d = arcoDonut(0, 0, 10, 0, 360);
    expect((d.match(/A/g) ?? []).length).toBe(2);
    const n = nums(d);
    expect(n).toHaveLength(16);
    expect(n[0]).toBeCloseTo(0, 6);
    expect(n[1]).toBeCloseTo(-10, 6);
    expect(n[7]).toBeCloseTo(0, 6);
    expect(n[8]).toBeCloseTo(10, 6);
    expect(n[14]).toBeCloseTo(0, 6);
    expect(n[15]).toBeCloseTo(-10, 6);
  });
});

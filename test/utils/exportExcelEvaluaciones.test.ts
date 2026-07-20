import { describe, it, expect } from "vitest";
import {
  buildWorkbookEvaluaciones,
  computeLayout,
  colLetter,
  bucketDeFila,
} from "../../src/utils/exportExcelEvaluaciones";
import type { ExportEvaluacionesData, FilaExport } from "../../src/api/estadisticas";

const AREAS = [
  { id: "MOT", nombre: "Motricidad", orden: 1 },
  { id: "LEN", nombre: "Lenguaje", orden: 2 },
];

export function mkFila(overrides: Partial<FilaExport> = {}): FilaExport {
  return {
    zona: "Norte",
    escuela: "Esc. 12",
    sala: "Sala 5",
    aula: "A - Mañana",
    apellido: "Pérez",
    nombre: "Juan",
    dni: "45123456",
    tipo: "inicial",
    estado: "A",
    fecha: "2025-04-12T15:00:00.000Z",
    areas_aprobadas: 1,
    areas: [
      { area_id: "MOT", aprobadas: 8, total: 10, aprueba_con: 7, estado: "A", observacion: null },
      { area_id: "LEN", aprobadas: 4, total: 8, aprueba_con: 5, estado: "D", observacion: "obs" },
    ],
    ...overrides,
  };
}

export function mkData(filas: FilaExport[]): ExportEvaluacionesData {
  return {
    periodo: 2025,
    areas: AREAS,
    reglas: [
      { sala: "Sala 5", area_id: "MOT", aprueba_con: 7, puntaje_total: 10 },
      { sala: "Sala 5", area_id: "LEN", aprueba_con: null, puntaje_total: null },
    ],
    filas,
  };
}

describe("colLetter / computeLayout", () => {
  it("convierte números de columna a letras", () => {
    expect(colLetter(1)).toBe("A");
    expect(colLetter(26)).toBe("Z");
    expect(colLetter(27)).toBe("AA");
    expect(colLetter(28)).toBe("AB");
  });

  it("computa el layout para 2 áreas", () => {
    // 11 base + 2 áreas × 4 = 19 visibles (S); ocultas: T bucket, U/V símbolos, W/X/Y flags+rank
    const ly = computeLayout(2, 3);
    expect(ly.lastVisibleCol).toBe("S");
    expect(ly.bucketCol).toBe("T");
    expect(ly.simboloCols).toEqual(["U", "V"]);
    expect(ly.flagBaseCol).toBe("W");
    expect(ly.flagFullCol).toBe("X");
    expect(ly.rankCol).toBe("Y");
    expect(ly.lastDataRow).toBe(4);
  });

  it("computa el layout para 4 áreas (letras del spec)", () => {
    const ly = computeLayout(4, 10);
    expect(ly.lastVisibleCol).toBe("AA");
    expect(ly.bucketCol).toBe("AB");
    expect(ly.flagBaseCol).toBe("AG");
    expect(ly.rankCol).toBe("AI");
  });

  it("lastDataRow nunca baja de 2 (dataset vacío)", () => {
    expect(computeLayout(2, 0).lastDataRow).toBe(2);
  });
});

describe("bucketDeFila", () => {
  it("usa areas_aprobadas cuando la evaluación está terminada", () => {
    expect(bucketDeFila(mkFila({ areas_aprobadas: 0, estado: "D" }))).toBe("0 áreas");
    expect(bucketDeFila(mkFila({ areas_aprobadas: 2 }))).toBe("2 áreas");
  });
  it("usa singular para 1 área", () => {
    expect(bucketDeFila(mkFila({ areas_aprobadas: 1 }))).toBe("1 área");
  });
  it("distingue en progreso de sin evaluar", () => {
    expect(bucketDeFila(mkFila({ areas_aprobadas: null, estado: "E" }))).toBe("En progreso");
    expect(bucketDeFila(mkFila({ areas_aprobadas: null, estado: "N" }))).toBe("Sin evaluar");
    expect(bucketDeFila(mkFila({ areas_aprobadas: null, estado: "sin_evaluar" }))).toBe("Sin evaluar");
  });
});

describe("buildWorkbookEvaluaciones — hoja Datos", () => {
  it("crea las tres hojas en orden Control, Datos, Criterios", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Control", "Datos", "Criterios"]);
  });

  it("escribe los encabezados de Datos incluidas las columnas por área", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Datos")!;
    const headers = (ws.getRow(1).values as any[]).slice(1, 20);
    expect(headers.slice(0, 11)).toEqual([
      "Zona", "Escuela", "Sala", "Aula", "Apellido", "Nombre", "DNI", "Tipo", "Estado", "Fecha", "Áreas aprobadas",
    ]);
    expect(headers[11]).toBe("Motricidad — Pautas");
    expect(headers[12]).toBe("Motricidad — Mín");
    expect(headers[13]).toBe("Motricidad — Estado");
    expect(headers[14]).toBe("Motricidad — Obs.");
    expect(headers[15]).toBe("Lenguaje — Pautas");
  });

  it("escribe la fila con etiquetas, pautas y estáticos ocultos", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Datos")!;
    expect(ws.getCell("B2").value).toBe("Esc. 12");
    expect(ws.getCell("G2").value).toBe("45123456"); // DNI como texto
    expect(ws.getCell("H2").value).toBe("Inicial");
    expect(ws.getCell("I2").value).toBe("Aprobada");
    expect(ws.getCell("J2").value).toBeInstanceOf(Date);
    // Assertion 1: Date value (timezone-independent)
    const d = new Date("2025-04-12T15:00:00.000Z");
    expect(ws.getCell("J2").value).toEqual(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
    expect(ws.getCell("K2").value).toBe(1);
    expect(ws.getCell("L2").value).toBe("8/10"); // MOT pautas
    expect(ws.getCell("M2").value).toBe(7);      // MOT mín
    expect(ws.getCell("N2").value).toBe("Aprobada");
    expect(ws.getCell("P2").value).toBe("4/8");  // LEN pautas
    expect(ws.getCell("S2").value).toBe("obs");  // LEN obs
    expect(ws.getCell("T2").value).toBe("1 área"); // bucket estático (etiqueta no numérica)
    expect(ws.getCell("U2").value).toBe("✔");    // símbolo MOT
    expect(ws.getCell("V2").value).toBe("✘");    // símbolo LEN
    // Assertion 2: Estado fill (green for Aprobada)
    expect(ws.getCell("I2").fill).toMatchObject({ type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } });
    // Assertion 3a: Per-área Desaprobada fill (red for LEN with estado "D", Estado cell is R2)
    expect(ws.getCell("R2").fill).toMatchObject({ type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } });
    // Assertion 3b: numFmt for date column
    expect(ws.getColumn(10).numFmt).toBe("dd/mm/yyyy");
  });

  it("fila sin_evaluar: celdas vacías y bucket correcto", async () => {
    const fila = mkFila({
      estado: "sin_evaluar", tipo: "cierre", fecha: null, areas_aprobadas: null, areas: [], aula: null, dni: null,
    });
    const wb = await buildWorkbookEvaluaciones(mkData([fila]));
    const ws = wb.getWorksheet("Datos")!;
    expect(ws.getCell("D2").value).toBe("");
    expect(ws.getCell("I2").value).toBe("Sin evaluar");
    expect(ws.getCell("J2").value).toBe("");
    expect(ws.getCell("K2").value).toBe("");
    expect(ws.getCell("L2").value).toBe("");
    expect(ws.getCell("T2").value).toBe("Sin evaluar");
    expect(ws.getCell("U2").value).toBe("");
  });

  it("pautas sin total muestra solo las aprobadas", async () => {
    const fila = mkFila({
      areas: [
        { area_id: "MOT", aprobadas: 8, total: null, aprueba_con: null, estado: "A", observacion: null },
        { area_id: "LEN", aprobadas: null, total: null, aprueba_con: null, estado: null, observacion: null },
      ],
    });
    const wb = await buildWorkbookEvaluaciones(mkData([fila]));
    const ws = wb.getWorksheet("Datos")!;
    expect(ws.getCell("L2").value).toBe("8");
    expect(ws.getCell("M2").value).toBe("");
    expect(ws.getCell("P2").value).toBe("");
  });

  it("escribe las fórmulas ocultas flag_base, flag_full y rank", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila(), mkFila({ escuela: "Otra" })]));
    const ws = wb.getWorksheet("Datos")!;
    const flagBase = (ws.getCell("W2").value as any).formula as string;
    const flagFull = (ws.getCell("X3").value as any).formula as string;
    const rank = (ws.getCell("Y3").value as any).formula as string;

    expect(flagBase).toContain('OR(Control!$B$3="Todas",$B2=Control!$B$3)');
    expect(flagBase).toContain("$H2=Control!$B$6");
    expect(flagFull).toContain("$W3=1");
    expect(flagFull).toContain('OR(Control!$B$7="Todas",$T3=Control!$B$7)');
    expect(rank).toBe('IF($X3=1,SUM($X$2:$X3),"")');
  });

  it("oculta las columnas auxiliares y limita el autofilter a las visibles", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Datos")!;
    for (const col of ["T", "U", "V", "W", "X", "Y"]) {
      expect(ws.getColumn(col).hidden, `columna ${col}`).toBe(true);
    }
    expect(ws.getColumn("S").hidden ?? false).toBe(false);
    expect(ws.autoFilter).toEqual({ from: "A1", to: "S2" });
  });
});

describe("buildWorkbookEvaluaciones — hoja Criterios", () => {
  it("escribe la tabla de criterios con el nombre del área", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([]));
    const ws = wb.getWorksheet("Criterios")!;
    expect((ws.getRow(1).values as any[]).slice(1, 4)).toEqual(["Sala", "Área", "Criterio"]);
    expect((ws.getRow(2).values as any[]).slice(1, 4)).toEqual([
      "Sala 5", "Motricidad", "Aprueba con 7 de 10 pautas",
    ]);
    expect((ws.getRow(3).values as any[]).slice(1, 4)).toEqual(["Sala 5", "Lenguaje", "—"]);
  });
});

describe("buildWorkbookEvaluaciones — hoja Control", () => {
  it("escribe título, filtros con defaults y validaciones de datos", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Control")!;

    expect(ws.getCell("A1").value).toBe("Panel de control — Evaluaciones 2025");
    expect(ws.getCell("A3").value).toBe("Escuela");
    expect(ws.getCell("B3").value).toBe("Todas");
    expect(ws.getCell("B6").value).toBe("Inicial");
    expect(ws.getCell("B7").value).toBe("Todas");

    // validación tipo lista referenciando columnas ocultas de la misma hoja
    expect(ws.getCell("B3").dataValidation).toMatchObject({ type: "list" });
    expect((ws.getCell("B3").dataValidation as any).formulae[0]).toMatch(/^\$L\$2:\$L\$\d+$/);
    expect((ws.getCell("B7").dataValidation as any).formulae[0]).toMatch(/^\$P\$2:\$P\$\d+$/);
  });

  it("escribe las listas de opciones en columnas ocultas (buckets como etiquetas no numéricas)", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila(), mkFila({ escuela: "Otra" })]));
    const ws = wb.getWorksheet("Control")!;

    expect(ws.getCell("L2").value).toBe("Todas");
    expect(ws.getCell("L3").value).toBe("Esc. 12");
    expect(ws.getCell("L4").value).toBe("Otra");
    expect(ws.getCell("O2").value).toBe("Inicial");
    expect(ws.getCell("O3").value).toBe("Cierre");
    // 2 áreas → Todas, 2 áreas, 1 área, 0 áreas, En progreso, Sin evaluar
    expect(
      ["P2", "P3", "P4", "P5", "P6", "P7"].map((c) => ws.getCell(c).value)
    ).toEqual(["Todas", "2 áreas", "1 área", "0 áreas", "En progreso", "Sin evaluar"]);
    for (const col of ["L", "M", "N", "O", "P"]) {
      expect(ws.getColumn(col).hidden, `columna ${col}`).toBe(true);
    }
  });

  it("escribe los contadores con SUM y SUMPRODUCT sobre flags y bucket", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Control")!;

    expect(ws.getCell("D3").value).toBe("Filas");
    expect((ws.getCell("E3").value as any).formula).toBe("SUM(Datos!$X$2:$X$2)");
    // 2 áreas → D4="2 áreas aprobadas" .. D6="0 áreas aprobadas", D7 En progreso, D8 Sin evaluar
    expect(ws.getCell("D4").value).toBe("2 áreas aprobadas");
    expect((ws.getCell("E4").value as any).formula).toBe(
      'SUMPRODUCT(Datos!$W$2:$W$2*(Datos!$T$2:$T$2="2 áreas"))'
    );
    expect(ws.getCell("D7").value).toBe("En progreso");
    expect((ws.getCell("E8").value as any).formula).toBe(
      'SUMPRODUCT(Datos!$W$2:$W$2*(Datos!$T$2:$T$2="Sin evaluar"))'
    );
  });

  it("escribe el encabezado y las filas de fórmula de la lista", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila(), mkFila({ escuela: "Otra" })]));
    const ws = wb.getWorksheet("Control")!;

    expect((ws.getRow(12).values as any[]).slice(1, 8)).toEqual([
      "Escuela", "Aula", "Alumno", "Motricidad", "Lenguaje", "Áreas aprob.", "Estado",
    ]);

    const escuela = (ws.getCell("A13").value as any).formula as string;
    const alumno = (ws.getCell("C13").value as any).formula as string;
    const simbolo = (ws.getCell("D13").value as any).formula as string;
    const aprob = (ws.getCell("F13").value as any).formula as string;

    // extracción clásica INDEX/MATCH sobre rank, con coerción &"" contra el 0 de celdas vacías
    expect(escuela).toBe(
      'IFERROR(INDEX(Datos!$B$2:$B$3,MATCH(ROW()-12,Datos!$Y$2:$Y$3,0))&"","")'
    );
    expect(alumno).toContain('&", "&');
    expect(simbolo).toContain("Datos!$U$2:$U$3");
    expect(aprob).toContain("Datos!$K$2:$K$3");
    expect(aprob).toContain('&"","")');

    // una fila de fórmula por fila de datos
    expect((ws.getCell("A14").value as any).formula).toBeTruthy();
    expect(ws.getCell("A15").value).toBeNull();
  });

  it("agrega formato condicional para los símbolos", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([mkFila()]));
    const ws = wb.getWorksheet("Control")!;
    // ExcelJS expone las reglas registradas vía el modelo interno
    const cf = (ws as any).conditionalFormattings ?? (ws.model as any).conditionalFormattings;
    expect(cf?.length).toBeGreaterThan(0);
  });

  it("dataset vacío: sin filas de lista y contadores sobre el rango mínimo", async () => {
    const wb = await buildWorkbookEvaluaciones(mkData([]));
    const ws = wb.getWorksheet("Control")!;
    expect((ws.getCell("E3").value as any).formula).toBe("SUM(Datos!$X$2:$X$2)");
    expect(ws.getCell("A13").value).toBeNull();
  });

  it("lanza error explícito con más de 6 áreas (colisión con columnas ocultas)", async () => {
    const muchasAreas = Array.from({ length: 7 }, (_, i) => ({
      id: `A${i}`, nombre: `Área ${i}`, orden: i + 1,
    }));
    const data: ExportEvaluacionesData = {
      ...mkData([]),
      areas: muchasAreas,
    };
    await expect(buildWorkbookEvaluaciones(data)).rejects.toThrow(/hasta 6 áreas/);
  });
});

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
    expect(bucketDeFila(mkFila({ areas_aprobadas: 0, estado: "D" }))).toBe("0");
    expect(bucketDeFila(mkFila({ areas_aprobadas: 2 }))).toBe("2");
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
    expect(ws.getCell("K2").value).toBe(1);
    expect(ws.getCell("L2").value).toBe("8/10"); // MOT pautas
    expect(ws.getCell("M2").value).toBe(7);      // MOT mín
    expect(ws.getCell("N2").value).toBe("Aprobada");
    expect(ws.getCell("P2").value).toBe("4/8");  // LEN pautas
    expect(ws.getCell("S2").value).toBe("obs");  // LEN obs
    expect(ws.getCell("T2").value).toBe("1");    // bucket estático (texto)
    expect(ws.getCell("U2").value).toBe("✔");    // símbolo MOT
    expect(ws.getCell("V2").value).toBe("✘");    // símbolo LEN
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

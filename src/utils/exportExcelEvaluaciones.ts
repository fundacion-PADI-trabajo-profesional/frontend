import type { Workbook, Worksheet } from "exceljs";
import type { ExportEvaluacionesData, FilaExport } from "../api/estadisticas";

// ─── Mapeos de presentación ──────────────────────────────────────────────────

export const ESTADO_LABEL: Record<string, string> = {
  A: "Aprobada",
  D: "Desaprobada",
  E: "En progreso",
  N: "No iniciada",
  sin_evaluar: "Sin evaluar",
};

export const TIPO_LABEL: Record<string, string> = { inicial: "Inicial", cierre: "Cierre" };

const SIMBOLO: Record<string, string> = { A: "✔", D: "✘", E: "…" };

const FILL_VERDE = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } } as const;
const FILL_ROJO = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } } as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

/** Convierte un número de columna (1-indexado) a letra de Excel: 1→A, 27→AA. */
export function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Columnas base de la hoja Datos: A..K (Zona..Áreas aprobadas). */
const BASE_COLS = 11;

export interface Layout {
  numAreas: number;
  /** Última fila del rango de datos: máx(2, filas+1) — nunca baja de 2 para que las fórmulas de rango sigan siendo válidas con dataset vacío. */
  lastDataRow: number;
  bucketCol: string;
  simboloCols: string[];
  detalleCols: string[];
  flagBaseCol: string;
  flagFullCol: string;
  rankCol: string;
  lastVisibleCol: string;
}

export function computeLayout(numAreas: number, numFilas: number): Layout {
  const lastVisible = BASE_COLS + 3 * numAreas;
  const bucket = lastVisible + 1;
  const flagBase = bucket + 1 + 2 * numAreas;
  return {
    numAreas,
    lastDataRow: Math.max(2, numFilas + 1),
    bucketCol: colLetter(bucket),
    simboloCols: Array.from({ length: numAreas }, (_, i) => colLetter(bucket + 1 + i)),
    detalleCols: Array.from({ length: numAreas }, (_, i) => colLetter(bucket + 1 + numAreas + i)),
    flagBaseCol: colLetter(flagBase),
    flagFullCol: colLetter(flagBase + 1),
    rankCol: colLetter(flagBase + 2),
    lastVisibleCol: colLetter(lastVisible),
  };
}

/**
 * Etiqueta de bucket para k áreas aprobadas: "0 áreas", "1 área", "4 áreas".
 * Nunca debe parecer un número: al elegir "4" en el dropdown, Sheets/LibreOffice
 * convierten la entrada a número y deja de matchear la columna Bucket (texto).
 */
function bucketLabel(k: number): string {
  return `${k} ${k === 1 ? "área" : "áreas"}`;
}

/** Bucket estático de la fila para los contadores del Control. */
export function bucketDeFila(f: FilaExport): string {
  if (f.areas_aprobadas !== null) return bucketLabel(f.areas_aprobadas);
  if (f.estado === "E") return "En progreso";
  return "Sin evaluar";
}

// ─── Helpers de celdas ───────────────────────────────────────────────────────

/**
 * Re-encoda el instante como medianoche UTC del día en hora local: ExcelJS
 * interpreta los Date en UTC, así el día mostrado coincide con el local.
 */
function fechaLocal(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function pautasTexto(aprobadas: number | null, total: number | null): string {
  if (aprobadas === null) return "";
  return total === null ? String(aprobadas) : `${aprobadas}/${total}`;
}

/** Texto de la celda de área de la lista del Control: `"4/7 - 5"` (pautas - umbral). */
function detalleArea(
  aprobadas: number | null,
  total: number | null,
  apruebaCon: number | null
): string {
  const pautas = pautasTexto(aprobadas, total);
  if (pautas === "") return "";
  return apruebaCon === null ? pautas : `${pautas} - ${apruebaCon}`;
}

// ─── Hoja Datos ──────────────────────────────────────────────────────────────

function fillDatos(ws: Worksheet, data: ExportEvaluacionesData, ly: Layout) {
  const headers = [
    "Zona", "Escuela", "Sala", "Aula", "Apellido", "Nombre", "DNI", "Tipo", "Estado", "Fecha",
    "Áreas aprobadas",
    ...data.areas.flatMap((a) => [
      `${a.nombre} — Pautas`,
      `${a.nombre} — Mín`,
      `${a.nombre} — Estado`,
    ]),
    "Bucket",
    ...data.areas.map((a) => `Símbolo ${a.nombre}`),
    ...data.areas.map((a) => `Detalle ${a.nombre}`),
    "flag_base",
    "flag_full",
    "rank",
  ];
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };

  data.filas.forEach((f, i) => {
    const r = i + 2;
    const porArea = new Map(f.areas.map((a) => [a.area_id, a]));

    const areaCells = data.areas.flatMap((a) => {
      const ea = porArea.get(a.id);
      return [
        pautasTexto(ea?.aprobadas ?? null, ea?.total ?? null),
        ea?.aprueba_con ?? "",
        ea?.estado ? ESTADO_LABEL[ea.estado] ?? ea.estado : "",
      ];
    });

    const row = ws.addRow([
      f.zona ?? "",
      f.escuela,
      f.sala,
      f.aula ?? "",
      f.apellido,
      f.nombre,
      f.dni ?? "",
      TIPO_LABEL[f.tipo] ?? f.tipo,
      ESTADO_LABEL[f.estado] ?? f.estado,
      f.fecha ? fechaLocal(f.fecha) : "",
      f.areas_aprobadas ?? "",
      ...areaCells,
      bucketDeFila(f),
      ...data.areas.map((a) => {
        const ea = porArea.get(a.id);
        return ea?.estado ? SIMBOLO[ea.estado] ?? "" : "";
      }),
      ...data.areas.map((a) => {
        const ea = porArea.get(a.id);
        return detalleArea(ea?.aprobadas ?? null, ea?.total ?? null, ea?.aprueba_con ?? null);
      }),
    ]);

    // Fills estáticos en los estados
    if (f.estado === "A") row.getCell(9).fill = FILL_VERDE;
    else if (f.estado === "D") row.getCell(9).fill = FILL_ROJO;
    data.areas.forEach((a, j) => {
      const ea = porArea.get(a.id);
      const cell = row.getCell(14 + j * 3); // columna "Estado" del área j
      if (ea?.estado === "A") cell.fill = FILL_VERDE;
      else if (ea?.estado === "D") cell.fill = FILL_ROJO;
    });

    // Fórmulas ocultas (motor del Control)
    ws.getCell(`${ly.flagBaseCol}${r}`).value = {
      formula:
        `IF(AND(OR(Control!$B$3="Todas",$B${r}=Control!$B$3),` +
        `OR(Control!$B$4="Todas",$C${r}=Control!$B$4),` +
        `OR(Control!$B$5="Todas",$D${r}=Control!$B$5),` +
        `$H${r}=Control!$B$6),1,0)`,
    };
    ws.getCell(`${ly.flagFullCol}${r}`).value = {
      formula: `IF(AND($${ly.flagBaseCol}${r}=1,OR(Control!$B$7="Todas",$${ly.bucketCol}${r}=Control!$B$7)),1,0)`,
    };
    ws.getCell(`${ly.rankCol}${r}`).value = {
      formula: `IF($${ly.flagFullCol}${r}=1,SUM($${ly.flagFullCol}$2:$${ly.flagFullCol}${r}),"")`,
    };
  });

  ws.getColumn(10).numFmt = "dd/mm/yyyy";

  const anchos = [14, 28, 10, 16, 18, 14, 12, 10, 14, 12, 10];
  anchos.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  data.areas.forEach((_, j) => {
    ws.getColumn(12 + j * 3).width = 10;
    ws.getColumn(13 + j * 3).width = 7;
    ws.getColumn(14 + j * 3).width = 13;
  });

  const bucketNum = BASE_COLS + 3 * ly.numAreas + 1;
  const rankNum = bucketNum + 2 * ly.numAreas + 3;
  for (let c = bucketNum; c <= rankNum; c++) ws.getColumn(c).hidden = true;

  // AutoFilter solo sobre las columnas visibles
  ws.autoFilter = { from: "A1", to: `${ly.lastVisibleCol}${ly.lastDataRow}` };
}

// ─── Hoja Criterios ──────────────────────────────────────────────────────────

function fillCriterios(ws: Worksheet, data: ExportEvaluacionesData) {
  const areaNombre = new Map(data.areas.map((a) => [a.id, a.nombre]));
  ws.addRow(["Sala", "Área", "Criterio"]);
  ws.getRow(1).font = { bold: true };
  for (const r of data.reglas) {
    const criterio =
      r.aprueba_con !== null && r.puntaje_total !== null
        ? `Aprueba con ${r.aprueba_con} de ${r.puntaje_total} pautas`
        : "—";
    ws.addRow([r.sala, areaNombre.get(r.area_id) ?? r.area_id, criterio]);
  }
  [12, 22, 30].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

// ─── Workbook ────────────────────────────────────────────────────────────────

/**
 * Construye el workbook completo del export (Control | Datos | Criterios) a
 * partir del dataset del backend. Función pura salvo el import lazy de ExcelJS.
 */
export async function buildWorkbookEvaluaciones(data: ExportEvaluacionesData): Promise<Workbook> {
  const { default: ExcelJS } = await import("exceljs");
  const wb: Workbook = new ExcelJS.Workbook();
  const ly = computeLayout(data.areas.length, data.filas.length);

  const control = wb.addWorksheet("Control", { views: [{ state: "frozen", ySplit: 12 }] });
  const datos = wb.addWorksheet("Datos", { views: [{ state: "frozen", ySplit: 1 }] });
  const criterios = wb.addWorksheet("Criterios", { views: [{ state: "frozen", ySplit: 1 }] });

  fillDatos(datos, data, ly);
  fillControl(control, data, ly);
  fillCriterios(criterios, data);

  return wb;
}

// ─── Hoja Control ────────────────────────────────────────────────────────────

/**
 * Hoja Control: 5 dropdowns (B3..B7), contadores (D3:E…) y lista extraída con
 * INDEX/MATCH sobre la columna rank de Datos. Las listas de opciones viven en
 * columnas ocultas L..P de esta misma hoja (sin named ranges ni INDIRECT), y los
 * helpers de color del CF en Q.. (uno por área). Con 6 áreas: lista visible hasta K,
 * listas L..P, helpers Q..V — sin colisión; con 7+, la lista visible pisaría L.
 */
function fillControl(ws: Worksheet, data: ExportEvaluacionesData, ly: Layout) {
  if (ly.numAreas > 6) {
    throw new Error(
      "El panel de control soporta hasta 6 áreas: las listas de opciones (columnas L..P) colisionarían con la lista visible."
    );
  }

  const N1 = ly.lastDataRow;

  ws.getCell("A1").value = `Panel de control — Evaluaciones ${data.periodo}`;
  ws.getCell("A1").font = { bold: true, size: 14 };

  // ── Listas de opciones (columnas ocultas) ──
  const uniq = (vals: string[]) =>
    Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b, "es"));
  const escuelas = ["Todas", ...uniq(data.filas.map((f) => f.escuela).filter(Boolean))];
  const salas = ["Todas", ...uniq(data.filas.map((f) => f.sala).filter(Boolean))];
  const aulas = ["Todas", ...uniq(data.filas.map((f) => f.aula ?? "").filter(Boolean))];
  const tipos = ["Inicial", "Cierre"];
  const buckets = [
    "Todas",
    ...Array.from({ length: ly.numAreas + 1 }, (_, i) => bucketLabel(ly.numAreas - i)),
    "En progreso",
    "Sin evaluar",
  ];

  const listas: Array<[string, string[]]> = [
    ["L", escuelas],
    ["M", salas],
    ["N", aulas],
    ["O", tipos],
    ["P", buckets],
  ];
  for (const [col, values] of listas) {
    values.forEach((v, i) => {
      ws.getCell(`${col}${i + 2}`).value = v; // strings → celdas de texto (los buckets deben matchear la columna Bucket)
    });
    ws.getColumn(col).hidden = true;
  }

  // ── Filtros ──
  const filtros: Array<[string, string, string[], string]> = [
    ["Escuela", "L", escuelas, "Todas"],
    ["Sala", "M", salas, "Todas"],
    ["Aula", "N", aulas, "Todas"],
    ["Tipo", "O", tipos, "Inicial"],
    ["Áreas aprobadas", "P", buckets, "Todas"],
  ];
  filtros.forEach(([label, listCol, values, def], i) => {
    const r = 3 + i;
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = { bold: true };
    const dd = ws.getCell(`B${r}`);
    dd.value = def;
    dd.dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`$${listCol}$2:$${listCol}$${values.length + 1}`],
    };
  });

  // ── Contadores ──
  const fBase = `Datos!$${ly.flagBaseCol}$2:$${ly.flagBaseCol}$${N1}`;
  const fFull = `Datos!$${ly.flagFullCol}$2:$${ly.flagFullCol}$${N1}`;
  const bRange = `Datos!$${ly.bucketCol}$2:$${ly.bucketCol}$${N1}`;

  const contadores: Array<[string, string]> = [
    ["Filas", `SUM(${fFull})`],
    ...Array.from({ length: ly.numAreas + 1 }, (_, i) => {
      const k = ly.numAreas - i;
      return [
        `${k} área${k === 1 ? "" : "s"} aprobada${k === 1 ? "" : "s"}`,
        `SUMPRODUCT(${fBase}*(${bRange}="${bucketLabel(k)}"))`,
      ] as [string, string];
    }),
    ["En progreso", `SUMPRODUCT(${fBase}*(${bRange}="En progreso"))`],
    ["Sin evaluar", `SUMPRODUCT(${fBase}*(${bRange}="Sin evaluar"))`],
  ];
  contadores.forEach(([label, formula], i) => {
    ws.getCell(`D${3 + i}`).value = label;
    ws.getCell(`D${3 + i}`).font = { bold: true };
    ws.getCell(`E${3 + i}`).value = { formula };
  });

  // ── Lista ──
  const headerLista = [
    "Escuela",
    "Aula",
    "Alumno",
    ...data.areas.map((a) => a.nombre),
    "Áreas aprob.",
    "Estado",
  ];
  headerLista.forEach((h, i) => {
    const c = ws.getCell(12, i + 1);
    c.value = h;
    c.font = { bold: true };
  });

  // INDEX/MATCH clásico; &"" evita que las celdas vacías de Datos se muestren como 0.
  const m = (col: string) =>
    `INDEX(Datos!$${col}$2:$${col}$${N1},MATCH(ROW()-12,Datos!$${ly.rankCol}$2:$${ly.rankCol}$${N1},0))`;

  const HELPER_COL = 17; // Q — helpers de color, a la derecha de las listas L..P

  for (let i = 0; i < data.filas.length; i++) {
    const r = 13 + i;
    const formulas = [
      `IFERROR(${m("B")}&"","")`,
      `IFERROR(${m("D")}&"","")`,
      `IFERROR(${m("E")}&", "&${m("F")},"")`,
      ...ly.detalleCols.map((dc) => `IFERROR(${m(dc)}&"","")`),
      `IFERROR(${m("K")}&"","")`,
      `IFERROR(${m("I")}&"","")`,
    ];
    formulas.forEach((formula, j) => {
      ws.getCell(r, j + 1).value = { formula };
    });
    // Helpers de color: el símbolo ✔/✘ del área alimenta el CF de la celda visible
    ly.simboloCols.forEach((sc, j) => {
      ws.getCell(r, HELPER_COL + j).value = { formula: `IFERROR(${m(sc)}&"","")` };
    });
  }
  data.areas.forEach((_, j) => {
    ws.getColumn(HELPER_COL + j).hidden = true;
  });

  // ── Formato condicional: verde/rojo según el símbolo oculto del área ──
  if (data.filas.length > 0) {
    const lastListRow = 12 + data.filas.length;
    data.areas.forEach((_, j) => {
      const colVisible = colLetter(4 + j);
      const colHelper = colLetter(HELPER_COL + j);
      ws.addConditionalFormatting({
        ref: `${colVisible}13:${colVisible}${lastListRow}`,
        rules: [
          {
            type: "expression",
            formulae: [`$${colHelper}13="✔"`],
            priority: 2 * j + 1,
            style: {
              font: { color: { argb: "FF006100" } },
              fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFC6EFCE" } },
            },
          },
          {
            type: "expression",
            formulae: [`$${colHelper}13="✘"`],
            priority: 2 * j + 2,
            style: {
              font: { color: { argb: "FF9C0006" } },
              fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFC7CE" } },
            },
          },
        ],
      });
    });
  }

  // ── Anchos ──
  [28, 16, 30].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  data.areas.forEach((_, j) => {
    ws.getColumn(4 + j).width = 12;
  });
  ws.getColumn(4 + ly.numAreas).width = 12;
  ws.getColumn(5 + ly.numAreas).width = 14;
}

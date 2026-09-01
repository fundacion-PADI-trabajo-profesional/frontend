import type { AreaCatalogo, Comparativo, ReporteEscuela, ResultadoTipo, SalaReporte } from "../api/reportes";

export type Modo = "inicial" | "cierre" | "comparativo";
export type EstadoCuadro = "g" | "b" | "h";
export type TipoCuadricula = "sala" | "area" | "tira" | "escuela" | "areaEscuela";

export const MODO_LABEL: Record<Modo, string> = { inicial: "Inicial", cierre: "Cierre", comparativo: "Inicial vs cierre" };

/** Medidas en unidades `u` (1 u = 1.6 % del ancho A4 = 9.52 pt). */
export interface LayoutCuadricula { cols: number; tile: number; gap: number; filas: number; alto: number }

const clamp = (min: number, x: number, max: number) => Math.min(max, Math.max(min, x));

/** Columnas, lado y gap de cada cuadrícula según la cantidad de chicos (spec §7.4). */
export function layoutCuadricula(n: number, tipo: TipoCuadricula): LayoutCuadricula {
  const N = Math.max(1, n);
  let cols: number, ancho: number, gap: number, tileMax = Infinity;
  switch (tipo) {
    case "sala":
      cols = N <= 24 ? 8 : N <= 40 ? 10 : N <= 60 ? 12 : N <= 100 ? 15 : N <= 200 ? 18 : 25; ancho = 25; gap = cols <= 8 ? 0.42 : 0.3; break;
    case "area":
      cols = N <= 24 ? 12 : N <= 60 ? 15 : 20; ancho = 14; gap = 0.17; break;
    case "escuela":
      cols = clamp(12, Math.ceil(Math.sqrt(2.5 * N)), 30); ancho = 30; gap = 0.2; break;
    case "areaEscuela":
      cols = clamp(21, Math.ceil(Math.sqrt(3 * N)), 40); ancho = 18; gap = 0.16; break;
    case "tira": {
      const filas = N <= 30 ? 1 : N <= 60 ? 2 : 3;
      cols = Math.ceil(N / filas); ancho = 18; gap = 0.13; tileMax = 0.62; break;
    }
  }
  const tile = Math.min(tileMax, (ancho - (cols - 1) * gap) / cols);
  const filas = Math.ceil(N / cols);
  return { cols, tile, gap, filas, alto: filas * tile + (filas - 1) * gap };
}

const ordenar = (arr: EstadoCuadro[]): EstadoCuadro[] => {
  const peso: Record<EstadoCuadro, number> = { g: 0, b: 1, h: 2 };
  return [...arr].sort((a, b) => peso[a] - peso[b]);
};

export function estadosTotales(r: { evaluados: number; aprobados: number }): EstadoCuadro[] {
  return [...Array<EstadoCuadro>(r.aprobados).fill("g"), ...Array<EstadoCuadro>(Math.max(0, r.evaluados - r.aprobados)).fill("b")];
}

export function estadosArea(r: ResultadoTipo, areaId: string): EstadoCuadro[] {
  return ordenar(r.estudiantes.map((e) => (e.areas[areaId] === "A" ? "g" : e.areas[areaId] === "D" ? "b" : "h")));
}

export function estadosTira(k: number, n: number): EstadoCuadro[] {
  return [...Array<EstadoCuadro>(Math.max(0, k)).fill("b"), ...Array<EstadoCuadro>(Math.max(0, n - k)).fill("h")];
}

/** Par inicial → cierre con posiciones estables: primero los que aprobaron la inicial, luego `comparativo.estudiantes`. */
export function estadosComparativo(sala: SalaReporte, areaId?: string): { inicial: EstadoCuadro[]; cierre: EstadoCuadro[] } | null {
  const c = sala.comparativo;
  const ini = sala.inicial;
  if (!c || !ini) return null;
  const aprobaron = ini.estudiantes.filter((e) => e.aprobado);
  const estadoIni = new Map(ini.estudiantes.map((e) => [e.estudiante_id, e]));
  const inicial: EstadoCuadro[] = [];
  const cierre: EstadoCuadro[] = [];
  for (const e of aprobaron) {
    const v = areaId ? e.areas[areaId] : "A";
    const est: EstadoCuadro = v === "A" ? "g" : v === "D" ? "b" : "h";
    inicial.push(est); cierre.push(est);
  }
  for (const e of c.estudiantes) {
    if (areaId) {
      const vi = estadoIni.get(e.estudiante_id)?.areas[areaId] ?? null;
      inicial.push(vi === "A" ? "g" : vi === "D" ? "b" : "h");
      const vc = e.areas[areaId];
      cierre.push(vc === "pendiente" ? "h" : vc === "ok" || vc === "recupero" ? "g" : "b");
    } else {
      inicial.push("b");
      cierre.push(e.resultado === "recupero" ? "g" : e.resultado === "persiste" ? "b" : "h");
    }
  }
  return { inicial, cierre };
}

export function textoResumenComparativo(c: Comparativo): string {
  const noPasaron = c.base - c.aprobaron_inicial;
  return `De los ${noPasaron} que no pasaron la inicial se reevaluó a ${c.reevaluados}: ${c.recuperaron} recuperaron todas las áreas, ${c.persisten} siguen con áreas para reforzar y ${c.pendientes} todavía no tienen evaluación de cierre. Cada cuadrado es el mismo chico en las dos cuadrículas: los que pasaron de azul a verde son los que recuperaron.`;
}

export function subtituloModo(modo: Modo, periodo: number): string {
  const t = { inicial: "Evaluación inicial", cierre: "Evaluación de cierre", comparativo: "Inicial vs cierre" }[modo];
  return `${t} · ${periodo}`;
}

export function slug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function nombreArchivo(p: { escuela: string; periodo: number; modo: Modo; sala?: string | null }): string {
  const modo = p.modo === "comparativo" ? "inicial-vs-cierre" : p.modo;
  return `PADI-Reporte-${slug(p.escuela)}-${p.periodo}-${modo}${p.sala ? `-${slug(p.sala)}` : ""}.pdf`;
}

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
/** Fondo interpolado blanco → azul según k/n (0.08 + 0.72·p) y color de texto legible. */
export function colorCelda(k: number, n: number): { bg: string; fg: string } {
  const p = n > 0 ? k / n : 0;
  const t = 0.08 + 0.72 * p;
  const [r, g, b] = [0x37, 0x5e, 0x9e].map((c) => 255 + (c - 255) * t);
  return { bg: `#${hex(r)}${hex(g)}${hex(b)}`, fg: p > 0.55 ? "#FFFFFF" : "#2B2F33" };
}

const CORTOS: Record<number, string> = { 2: "Lenguaje" };
const ICONOS: Record<number, "pelota" | "globo" | "bloques" | "corazon"> = { 1: "pelota", 2: "globo", 3: "bloques", 4: "corazon" };

export function nombreCortoArea(area: AreaCatalogo): string { return CORTOS[area.orden] ?? area.nombre; }
export function iconoArea(area: AreaCatalogo) { return ICONOS[area.orden] ?? null; }

export function textoAreas(ids: string[], areas: AreaCatalogo[]): string {
  if (areas.length === 4 && ids.length === 4) return "Las 4 áreas";
  return areas.filter((a) => ids.includes(a.id)).map(nombreCortoArea).join(", ");
}

export function salaTieneModo(sala: SalaReporte, modo: Modo): boolean { return sala[modo] !== null; }
export function escuelaTieneModo(data: ReporteEscuela, modo: Modo): boolean { return data.salas.some((s) => salaTieneModo(s, modo)); }

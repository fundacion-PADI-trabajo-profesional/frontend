import type { ReporteEscuela, SalaReporte, ResultadoTipo, Comparativo, AreaCatalogo, PautasArea } from "../../src/api/reportes";

export const AREAS: AreaCatalogo[] = [
  { id: "sm", nombre: "Sensoriomotora", orden: 1 },
  { id: "cl", nombre: "Comunicación y Lenguaje", orden: 2 },
  { id: "cog", nombre: "Cognitiva", orden: 3 },
  { id: "se", nombre: "Socioemocional", orden: 4 },
];

const NOMBRES = ["Acosta, Julián", "Benítez, Malena", "Cáceres, Thiago", "Díaz, Emilia", "Escobar, Renata", "Ferreyra, Mateo", "Gómez, Olivia", "Herrera, Valentino", "Ibarra, Martina", "Juárez, Simón", "Ledesma, Martina", "López, Catalina", "Molina, Amparo", "Núñez, Isabella", "Ojeda, Mía", "Paz, Felipe", "Quiroga, Sofía", "Ríos, Joaquín", "Sosa, Renata", "Torres, Ciro", "Vega, Santino", "Zárate, Bruno"];
const nombre = (i: number) => `${NOMBRES[i % NOMBRES.length].split(",")[0]} ${i >= NOMBRES.length ? i : ""}`.trim() + `, ${NOMBRES[i % NOMBRES.length].split(", ")[1]}`;

const pautas = (n: number): PautasArea[] => AREAS.map((a, ai) => ({
  area_id: a.id,
  items: [0, 1, 2].map((j) => ({ numero: j + 1, texto: `Pauta ${j + 1} de ${a.nombre}`, desaprobaron: Math.max(0, Math.round(n * (0.6 - ai * 0.12 - j * 0.08))), evaluados: n })),
}));

/** Sala con N chicos; los primeros `aprob` aprueban todo; el resto desaprueba 1..4 áreas según su índice. */
export function mkResultado(n: number, aprob: number): ResultadoTipo {
  const estudiantes = Array.from({ length: n }, (_, i) => {
    const falla = i < aprob ? 0 : 1 + (i % 4);
    const areas: Record<string, "A" | "D" | null> = {};
    AREAS.forEach((a, k) => { areas[a.id] = k < falla ? "D" : "A"; });
    return { estudiante_id: `est-${i}`, nombre: nombre(i), aprobado: falla === 0, areas };
  }).sort((x, y) => Object.values(y.areas).filter((v) => v === "D").length - Object.values(x.areas).filter((v) => v === "D").length || x.nombre.localeCompare(y.nombre, "es"));
  return {
    evaluados: n, aprobados: aprob, cierra_con: null,
    por_area: AREAS.map((a) => ({ area_id: a.id, evaluados: n, aprobados: estudiantes.filter((e) => e.areas[a.id] === "A").length })),
    estudiantes, pautas: pautas(n),
  };
}

/** Comparativo derivado de un resultado inicial: de los que no pasaron, la mitad recupera, dos quedan pendientes. */
export function mkComparativo(ini: ResultadoTipo): Comparativo {
  const noPasaron = ini.estudiantes.filter((e) => !e.aprobado);
  const estudiantes = noPasaron.map((e, i) => {
    const pendiente = i >= noPasaron.length - 2;
    const recupera = !pendiente && i % 2 === 0;
    const areas: Record<string, Comparativo["estudiantes"][number]["areas"][string]> = {};
    for (const a of AREAS) {
      if (pendiente) areas[a.id] = "pendiente";
      else if (e.areas[a.id] === "D") areas[a.id] = recupera || a.id === "cl" ? "recupero" : "persiste";
      else areas[a.id] = i === 1 && a.id === "se" ? "nueva" : "ok";
    }
    const resultado = pendiente ? "pendiente" : Object.values(areas).some((v) => v === "persiste" || v === "nueva") ? "persiste" : "recupero";
    return { estudiante_id: e.estudiante_id, nombre: e.nombre, resultado, areas };
  });
  const recuperaron = estudiantes.filter((e) => e.resultado === "recupero").length;
  const persisten = estudiantes.filter((e) => e.resultado === "persiste").length;
  const pendientes = estudiantes.filter((e) => e.resultado === "pendiente").length;
  return {
    base: ini.evaluados, aprobaron_inicial: ini.aprobados, reevaluados: recuperaron + persisten, recuperaron, persisten, pendientes,
    cierra_con: ini.aprobados + recuperaron,
    por_area: AREAS.map((a) => ({
      area_id: a.id,
      aprobados_inicial: ini.por_area.find((p) => p.area_id === a.id)!.aprobados,
      aprobados_cierre: ini.aprobados + estudiantes.filter((e) => e.areas[a.id] === "ok" || e.areas[a.id] === "recupero").length,
      sin_dato: pendientes,
    })),
    estudiantes,
    pautas: pautas(recuperaron + persisten),
  };
}

export function mkSala(salaId: number, n: number, aprob: number, opts: { cierre?: boolean } = {}): SalaReporte {
  const inicial = mkResultado(n, aprob);
  const comparativo = opts.cierre === false ? null : mkComparativo(inicial);
  const cierre = comparativo ? { ...mkResultado(comparativo.reevaluados, comparativo.recuperaron), cierra_con: { aprobados: comparativo.cierra_con, total: n } } : null;
  return { sala_id: salaId, sala: `Sala de ${salaId}`, inicial, cierre, comparativo };
}

export function mkReporte(salas: SalaReporte[]): ReporteEscuela {
  const suma = (f: (s: SalaReporte) => number) => salas.reduce((acc, s) => acc + f(s), 0);
  const porArea = (pick: (s: SalaReporte) => ResultadoTipo | null) => AREAS.map((a) => ({
    area_id: a.id,
    evaluados: suma((s) => pick(s)?.por_area.find((p) => p.area_id === a.id)?.evaluados ?? 0),
    aprobados: suma((s) => pick(s)?.por_area.find((p) => p.area_id === a.id)?.aprobados ?? 0),
  }));
  const conCierre = salas.filter((s) => s.cierre);
  const conCmp = salas.filter((s) => s.comparativo);
  return {
    escuela: { id: "9a1de644-815e-46d1-bb8f-aa1837f8a88b", nombre: "Jardín Municipal N° 1" },
    periodo: 2025,
    generado_en: "2026-09-01T12:00:00.000Z",
    areas: AREAS,
    salas,
    turno: null, turnos: [],
    resumen: {
      inicial: {
        evaluados: suma((s) => s.inicial?.evaluados ?? 0), aprobados: suma((s) => s.inicial?.aprobados ?? 0),
        por_area: porArea((s) => s.inicial),
        por_sala: salas.filter((s) => s.inicial).map((s) => ({ sala_id: s.sala_id, sala: s.sala, evaluados: s.inicial!.evaluados, aprobados: s.inicial!.aprobados, por_area: s.inicial!.por_area })),
      },
      cierre: conCierre.length ? {
        evaluados: suma((s) => s.cierre?.evaluados ?? 0), aprobados: suma((s) => s.cierre?.aprobados ?? 0),
        por_area: porArea((s) => s.cierre),
        por_sala: conCierre.map((s) => ({ sala_id: s.sala_id, sala: s.sala, evaluados: s.cierre!.evaluados, aprobados: s.cierre!.aprobados, por_area: s.cierre!.por_area })),
        cierra_con: { aprobados: suma((s) => s.cierre?.cierra_con?.aprobados ?? 0), total: suma((s) => s.cierre?.cierra_con?.total ?? 0) },
      } : null,
      comparativo: conCmp.length ? {
        base: suma((s) => s.comparativo?.base ?? 0), aprobaron_inicial: suma((s) => s.comparativo?.aprobaron_inicial ?? 0),
        reevaluados: suma((s) => s.comparativo?.reevaluados ?? 0), recuperaron: suma((s) => s.comparativo?.recuperaron ?? 0),
        persisten: suma((s) => s.comparativo?.persisten ?? 0), pendientes: suma((s) => s.comparativo?.pendientes ?? 0),
        cierra_con: suma((s) => s.comparativo?.cierra_con ?? 0),
        por_area: AREAS.map((a) => ({
          area_id: a.id,
          aprobados_inicial: suma((s) => s.comparativo?.por_area.find((p) => p.area_id === a.id)?.aprobados_inicial ?? 0),
          aprobados_cierre: suma((s) => s.comparativo?.por_area.find((p) => p.area_id === a.id)?.aprobados_cierre ?? 0),
        })),
        por_sala: conCmp.map((s) => ({ sala_id: s.sala_id, sala: s.sala, base: s.comparativo!.base, aprobaron_inicial: s.comparativo!.aprobaron_inicial, recuperaron: s.comparativo!.recuperaron, persisten: s.comparativo!.persisten, pendientes: s.comparativo!.pendientes, cierra_con: s.comparativo!.cierra_con })),
      } : null,
    },
  };
}

export const REPORTE_24 = mkReporte([mkSala(5, 24, 7)]);
export const REPORTE_44 = mkReporte([mkSala(5, 44, 9)]);
export const REPORTE_ESCUELA = mkReporte([mkSala(3, 18, 6), mkSala(4, 20, 5), mkSala(5, 24, 7)]);
export const REPORTE_SIN_CIERRE = mkReporte([mkSala(5, 24, 7, { cierre: false })]);

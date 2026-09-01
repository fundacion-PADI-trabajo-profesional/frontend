import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Rotulo } from "./Rotulo";
import { colorCelda, porcentaje, type Modo } from "../../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../../api/reportes";

interface CeldaDato { texto: string; k: number; n: number }

function Fila({ nombre, celdas, negrita }: { nombre: string; celdas: CeldaDato[]; negrita?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: u(0.25), marginBottom: u(0.25) }}>
      <Text style={{ width: u(8), fontSize: u(0.85), fontWeight: negrita ? 700 : 600, color: C.titulo, paddingVertical: u(0.55) }}>{nombre}</Text>
      {celdas.map((cd, i) => {
        const { bg, fg } = colorCelda(cd.k, cd.n);
        return (
          <View key={i} style={{ flex: 1, backgroundColor: bg, borderRadius: u(0.3), paddingVertical: u(0.85), alignItems: "center" }}>
            <Text style={{ fontSize: u(0.92), color: fg, fontWeight: negrita ? 700 : 400 }}>{cd.texto}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Tabla sala × área con porcentaje y sombreado por proporción (§7.7). En comparativo: "40 % → 71 %" sombreada por el cierre. */
export function TablaSalaArea({ data, modo }: { data: ReporteEscuela; modo: Modo }) {
  const areas = data.areas;
  const celdas = (fuente: { por_area: { area_id: string; evaluados?: number; aprobados?: number; aprobados_inicial?: number; aprobados_cierre?: number }[] }, n: number, todas: CeldaDato): CeldaDato[] => [
    ...areas.map((a) => {
      const p = fuente.por_area.find((x) => x.area_id === a.id);
      if (modo === "comparativo") return { texto: `${porcentaje(p?.aprobados_inicial ?? 0, n)} → ${porcentaje(p?.aprobados_cierre ?? 0, n)}`, k: p?.aprobados_cierre ?? 0, n };
      const evA = p?.evaluados ?? n;
      return { texto: porcentaje(p?.aprobados ?? 0, evA), k: p?.aprobados ?? 0, n: evA || n };
    }),
    todas,
  ];
  const filas = data.salas
    .filter((s) => s[modo])
    .map((s) => {
      if (modo === "comparativo") {
        const c = s.comparativo!;
        return { nombre: s.sala, celdas: celdas(c, c.base, { texto: `${porcentaje(c.aprobaron_inicial, c.base)} → ${porcentaje(c.cierra_con, c.base)}`, k: c.cierra_con, n: c.base }) };
      }
      const r = s[modo]!;
      return { nombre: s.sala, celdas: celdas(r, r.evaluados, { texto: porcentaje(r.aprobados, r.evaluados), k: r.aprobados, n: r.evaluados }) };
    });
  const rTot = modo === "comparativo" ? data.resumen.comparativo! : data.resumen[modo]!;
  const total = modo === "comparativo"
    ? { nombre: "Escuela", celdas: celdas(rTot as never, (rTot as { base: number }).base, { texto: `${porcentaje((rTot as { aprobaron_inicial: number }).aprobaron_inicial, (rTot as { base: number }).base)} → ${porcentaje((rTot as { cierra_con: number }).cierra_con, (rTot as { base: number }).base)}`, k: (rTot as { cierra_con: number }).cierra_con, n: (rTot as { base: number }).base }) }
    : { nombre: "Escuela", celdas: celdas(rTot as never, (rTot as { evaluados: number }).evaluados, { texto: porcentaje((rTot as { aprobados: number }).aprobados, (rTot as { evaluados: number }).evaluados), k: (rTot as { aprobados: number }).aprobados, n: (rTot as { evaluados: number }).evaluados }) };
  return (
    <View>
      <Rotulo>Por sala y área</Rotulo>
      <View style={{ flexDirection: "row", gap: u(0.25), marginBottom: u(0.3) }}>
        <View style={{ width: u(8) }} />
        {[...areas.map((a) => a.nombre), "Todas las áreas"].map((n, i) => (
          <Text key={i} style={{ flex: 1, fontSize: u(0.8), fontWeight: 600, color: C.titulo, textAlign: "center" }}>{n}</Text>
        ))}
      </View>
      {filas.map((f) => <Fila key={f.nombre} nombre={f.nombre} celdas={f.celdas} />)}
      <Fila nombre="Escuela" celdas={total.celdas} negrita />
      <Text style={{ fontSize: u(0.85), fontStyle: "italic", color: C.secundario, marginTop: u(0.4) }}>
        Porcentaje que aprobó cada área en cada sala. Cuanto más claro el casillero, más chicos para reforzar ahí.
      </Text>
    </View>
  );
}

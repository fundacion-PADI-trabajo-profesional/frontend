import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Rotulo } from "./Rotulo";
import { textoAreas } from "../../../utils/reporteEscuela";
import type { AreaCatalogo, EstudianteResultado, ResultadoTipo } from "../../../api/reportes";

function Pildora({ texto, verde }: { texto: string; verde?: boolean }) {
  return (
    <View style={{ backgroundColor: verde ? C.verdeClaro : C.azul, borderRadius: u(2), paddingVertical: u(0.42), paddingHorizontal: u(0.8) }}>
      <Text style={{ fontSize: u(0.8), fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", color: verde ? C.ink : C.blanco }}>
        {texto}
      </Text>
    </View>
  );
}

function Celda({ e, areas }: { e: EstudianteResultado | null; areas: AreaCatalogo[] }) {
  if (!e) return <View style={{ flex: 1 }} />;
  const desaprobadas = areas.filter((a) => e.areas[a.id] === "D").map((a) => a.id);
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: u(0.6), borderBottomWidth: 0.8, borderBottomColor: C.lineaFila, paddingVertical: u(0.08), paddingHorizontal: u(0.2) }}>
      <Text style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, fontSize: u(0.9) }}>{e.nombre}</Text>
      {desaprobadas.length > 0 && (
        <Text style={{ flexShrink: 0, maxWidth: "55%", fontSize: u(0.82), color: C.secundario, textAlign: "right" }}>{textoAreas(desaprobadas, areas)}</Text>
      )}
    </View>
  );
}

/** Estadística 3: quiénes aprobaron y quiénes no (§7.6). El panel puede cortarse entre filas. */
export function Nomina({ r, areas }: { r: ResultadoTipo; areas: AreaCatalogo[] }) {
  const aprobaron = r.estudiantes.filter((e) => e.aprobado);
  const noPasaron = r.estudiantes.filter((e) => !e.aprobado);
  const mitad = Math.ceil(noPasaron.length / 2);
  const nFilas = Math.max(aprobaron.length, mitad);
  const filas = Array.from({ length: nFilas }, (_, i) => ({
    a: aprobaron[i] ?? null, n1: noPasaron[i] ?? null, n2: noPasaron[i + mitad] ?? null,
  }));
  const pad = { paddingHorizontal: u(1.2), backgroundColor: C.panel } as const;
  return (
    <View>
      <Rotulo>Quiénes aprobaron y quiénes no</Rotulo>
      <View wrap={false} minPresenceAhead={60} style={{ ...pad, borderTopLeftRadius: u(1), borderTopRightRadius: u(1), paddingTop: u(1), flexDirection: "row", gap: u(1.4) }}>
        <View style={{ flex: 0.75 }}><Pildora texto="Aprobaron" verde /></View>
        <View style={{ flex: 2.3 }}><Pildora texto="No pasaron la prueba" /></View>
      </View>
      {filas.map((f, i) => (
        <View key={i} wrap={false} style={{ ...pad, flexDirection: "row", gap: u(1.4), paddingTop: u(0.05) }}>
          <View style={{ flex: 0.75, flexDirection: "row" }}><Celda e={f.a} areas={areas} /></View>
          <View style={{ flex: 1.15, flexDirection: "row" }}><Celda e={f.n1} areas={areas} /></View>
          <View style={{ flex: 1.15, flexDirection: "row" }}><Celda e={f.n2} areas={areas} /></View>
        </View>
      ))}
      <View style={{ ...pad, height: u(1), borderBottomLeftRadius: u(1), borderBottomRightRadius: u(1) }} />
    </View>
  );
}

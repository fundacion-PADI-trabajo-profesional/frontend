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

/** Celda de un renglón (solo nombre): aprobaron no tiene áreas que mostrar (§7.6 / v2-D3). */
function CeldaAprobado({ e }: { e: EstudianteResultado | null }) {
  if (!e) return <View style={{ flex: 1 }} />;
  return (
    <View style={{ flex: 1, borderBottomWidth: 0.8, borderBottomColor: C.lineaFila, paddingVertical: u(0.2), paddingHorizontal: u(0.2) }}>
      <Text style={{ fontSize: u(0.9) }}>{e.nombre}</Text>
    </View>
  );
}

/** Celda de dos renglones (nombre / áreas desaprobadas): nunca comparten línea, así no pueden pisarse (§7.6). */
function CeldaNoPaso({ e, areas }: { e: EstudianteResultado | null; areas: AreaCatalogo[] }) {
  if (!e) return <View style={{ flex: 1 }} />;
  const desaprobadas = areas.filter((a) => e.areas[a.id] === "D").map((a) => a.id);
  return (
    <View style={{ flex: 1, borderBottomWidth: 0.8, borderBottomColor: C.lineaFila, paddingVertical: u(0.2), paddingHorizontal: u(0.2), gap: u(0.15) }}>
      <Text style={{ fontSize: u(0.9) }}>{e.nombre}</Text>
      {desaprobadas.length > 0 && (
        <Text style={{ fontSize: u(0.82), color: C.secundario }}>{textoAreas(desaprobadas, areas)}</Text>
      )}
    </View>
  );
}

/**
 * Estadística 3: quiénes aprobaron y quiénes no (§7.6). Secciones apiladas en vez de columnas en
 * paralelo (v2-D3): antes "aprobaron" y "no pasaron" compartían fila con `nFilas = max(...)`, así que
 * una sección corta desperdiciaba tanto alto como ocupara la más alta. Ahora cada sección tiene su
 * propia píldora a todo el ancho del panel y su propia grilla, una debajo de la otra — el alto total es
 * la suma de ambas, no el máximo. El panel puede cortarse entre filas.
 */
export function Nomina({ r, areas }: { r: ResultadoTipo; areas: AreaCatalogo[] }) {
  const aprobaron = r.estudiantes.filter((e) => e.aprobado);
  const noPasaron = r.estudiantes.filter((e) => !e.aprobado);
  const colsA = 4;
  const filasA = Math.ceil(aprobaron.length / colsA);
  const colsN = 3;
  const t = Math.ceil(noPasaron.length / colsN);
  const pad = { paddingHorizontal: u(1.2), backgroundColor: C.panel } as const;
  return (
    <View>
      <Rotulo>Quiénes aprobaron y quiénes no</Rotulo>
      <View wrap={false} minPresenceAhead={60} style={{ ...pad, borderTopLeftRadius: u(1), borderTopRightRadius: u(1), paddingTop: u(1) }}>
        <Pildora texto="Aprobaron" verde />
      </View>
      {Array.from({ length: filasA }, (_, i) => (
        <View key={`a${i}`} wrap={false} style={{ ...pad, flexDirection: "row", gap: u(1.4), paddingTop: u(0.05) }}>
          {Array.from({ length: colsA }, (_, c) => (
            <CeldaAprobado key={c} e={aprobaron[i * colsA + c] ?? null} />
          ))}
        </View>
      ))}
      <View style={{ ...pad, height: u(0.6) }} />
      <View wrap={false} minPresenceAhead={60} style={{ ...pad, paddingTop: u(0.05) }}>
        <Pildora texto="No pasaron la prueba" />
      </View>
      {Array.from({ length: t }, (_, i) => (
        <View key={`n${i}`} wrap={false} style={{ ...pad, flexDirection: "row", gap: u(1.4), paddingTop: u(0.05) }}>
          <CeldaNoPaso e={noPasaron[i] ?? null} areas={areas} />
          <CeldaNoPaso e={noPasaron[i + t] ?? null} areas={areas} />
          <CeldaNoPaso e={noPasaron[i + 2 * t] ?? null} areas={areas} />
        </View>
      ))}
      <View style={{ ...pad, height: u(1), borderBottomLeftRadius: u(1), borderBottomRightRadius: u(1) }} />
    </View>
  );
}

import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Chip } from "./Chip";
import { Rotulo } from "./Rotulo";
import { chipsComparativo, nombreCortoArea } from "../../../utils/reporteEscuela";
import type { AreaCatalogo, EstudianteComparativo, SalaReporte } from "../../../api/reportes";

/** Nombre y chips en renglones separados: nunca comparten línea, así no pueden pisarse (§7.6 / fix producción). */
function CeldaCmp({ e, areas }: { e: EstudianteComparativo | null; areas: AreaCatalogo[] }) {
  if (!e) return <View style={{ flex: 1 }} />;
  const chips = chipsComparativo(e, areas);
  return (
    <View style={{ flex: 1, borderBottomWidth: 0.8, borderBottomColor: C.lineaFila, paddingVertical: u(0.28), paddingHorizontal: u(0.2), gap: u(0.22) }}>
      <Text style={{ fontSize: u(0.9) }}>{e.nombre}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: u(0.3) }}>
        {chips.map(({ area, aprobada }) => (
          <Chip key={area.id} variant={aprobada ? "aprobada" : "desaprobada"}>{nombreCortoArea(area)}</Chip>
        ))}
      </View>
    </View>
  );
}

/** Nómina del comparativo: recuperaron | siguen, con chips por área y fila de pendientes (§7.6). */
export function NominaComparativo({ sala, areas }: { sala: SalaReporte; areas: AreaCatalogo[] }) {
  const c = sala.comparativo!;
  const recuperaron = c.estudiantes.filter((e) => e.resultado === "recupero");
  const siguen = c.estudiantes.filter((e) => e.resultado === "persiste");
  const pendientes = c.estudiantes.filter((e) => e.resultado === "pendiente");
  const nFilas = Math.max(recuperaron.length, siguen.length);
  const pad = { paddingHorizontal: u(1.2), backgroundColor: C.panel } as const;
  const pildora = (texto: string, verde?: boolean) => (
    <View style={{ backgroundColor: verde ? C.verdeClaro : C.azul, borderRadius: u(2), paddingVertical: u(0.42), paddingHorizontal: u(0.8) }}>
      <Text style={{ fontSize: u(0.8), fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", color: verde ? C.ink : C.blanco }}>{texto}</Text>
    </View>
  );
  return (
    <View>
      <Rotulo>Quiénes recuperaron y quiénes siguen</Rotulo>
      <View wrap={false} minPresenceAhead={60} style={{ ...pad, borderTopLeftRadius: u(1), borderTopRightRadius: u(1), paddingTop: u(1), flexDirection: "row", gap: u(1.4) }}>
        <View style={{ flex: 1 }}>{pildora("Recuperaron · aprobaron todo en el cierre", true)}</View>
        <View style={{ flex: 1.25 }}>{pildora("Siguen con áreas para reforzar")}</View>
      </View>
      {Array.from({ length: nFilas }, (_, i) => (
        <View key={i} wrap={false} style={{ ...pad, flexDirection: "row", gap: u(1.4), paddingTop: u(0.2) }}>
          <View style={{ flex: 1, flexDirection: "row" }}><CeldaCmp e={recuperaron[i] ?? null} areas={areas} /></View>
          <View style={{ flex: 1.25, flexDirection: "row" }}><CeldaCmp e={siguen[i] ?? null} areas={areas} /></View>
        </View>
      ))}
      {pendientes.length > 0 && (
        <View wrap={false} style={{ ...pad, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: u(0.5) }}>
          <Text style={{ fontSize: u(0.9), fontStyle: "italic", color: C.secundario }}>Sin evaluación de cierre</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: u(0.3) }}>
            {pendientes.map((e) => <Chip key={e.estudiante_id} variant="pendiente">{e.nombre}</Chip>)}
          </View>
        </View>
      )}
      <View style={{ ...pad, height: u(1), borderBottomLeftRadius: u(1), borderBottomRightRadius: u(1) }} />
      <Text style={{ fontSize: u(0.85), fontStyle: "italic", color: C.secundario, marginTop: u(0.6), lineHeight: 1.45 }}>
        Se muestran las 4 áreas de cada chico según cómo terminó el año: verde aprobada · azul desaprobada.
      </Text>
    </View>
  );
}

import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Cuadricula } from "./Cuadricula";
import { IconoArea } from "./IconoArea";
import { Rotulo } from "./Rotulo";
import { estadosTira, layoutCuadricula } from "../../../utils/reporteEscuela";
import type { AreaCatalogo, PautasArea } from "../../../api/reportes";

/** Estadística 4: pautas más desaprobadas, dos columnas de áreas (§7.6). Reusada por el comparativo con otros textos. */
export function Pautas({ pautas, areas, titulo, caption }: { pautas: PautasArea[]; areas: AreaCatalogo[]; titulo: string; caption: string }) {
  return (
    <View>
      <Rotulo>{titulo}</Rotulo>
      <Text style={{ fontSize: u(0.85), fontStyle: "italic", color: C.secundario, marginTop: -u(0.6), marginBottom: u(1.2) }}>{caption}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: u(3), rowGap: u(0.6) }}>
        {areas.map((a) => {
          const pa = pautas.find((p) => p.area_id === a.id);
          return (
            <View key={a.id} style={{ width: "47%" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: u(0.55), marginBottom: u(0.4) }}>
                <IconoArea area={a} size={u(1.4)} color={C.titulo} />
                <Text style={{ fontSize: u(1.05), fontWeight: 700, color: C.titulo }}>{a.nombre}</Text>
              </View>
              {(pa?.items.length ? pa.items : null)?.map((item, i) => (
                <View key={i} style={{ marginBottom: u(0.55) }}>
                  <Text style={{ fontSize: u(0.95), marginBottom: u(0.25) }}>{item.texto}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: u(0.8) }}>
                    <Cuadricula estados={estadosTira(item.desaprobaron, item.evaluados)} layout={layoutCuadricula(item.evaluados, "tira")} />
                    <Text style={{ fontSize: u(0.95), minWidth: u(4.4), textAlign: "right" }}>
                      <Text style={{ fontWeight: 700 }}>{item.desaprobaron}</Text> de {item.evaluados}
                    </Text>
                  </View>
                </View>
              )) ?? <Text style={{ fontSize: u(0.9), fontStyle: "italic", color: C.secundario }}>Sin datos de pautas</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

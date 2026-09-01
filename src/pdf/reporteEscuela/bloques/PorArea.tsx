import { Text, View } from "@react-pdf/renderer";
import { u } from "../theme";
import { Cuadricula } from "./Cuadricula";
import { IconoArea } from "./IconoArea";
import { Rotulo } from "./Rotulo";
import { estadosArea, layoutCuadricula } from "../../../utils/reporteEscuela";
import type { AreaCatalogo, ResultadoTipo } from "../../../api/reportes";

/** Estadística 2: aprobados por área (§7.6). */
export function PorArea({ r, areas }: { r: ResultadoTipo; areas: AreaCatalogo[] }) {
  return (
    <View>
      <Rotulo>Aprobados por área</Rotulo>
      {areas.map((a) => {
        const pa = r.por_area.find((p) => p.area_id === a.id);
        return (
          <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: u(0.9), marginBottom: u(0.7) }}>
            <IconoArea area={a} size={u(1.6)} />
            <Text style={{ width: u(8.5), fontSize: u(0.95), fontWeight: 600 }}>{a.nombre}</Text>
            <Cuadricula estados={estadosArea(r, a.id)} layout={layoutCuadricula(r.evaluados, "area")} />
            <Text style={{ flexGrow: 1, textAlign: "right", fontSize: u(1) }}>
              <Text style={{ fontWeight: 700 }}>{pa?.aprobados ?? 0}</Text> de {pa?.evaluados ?? 0}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

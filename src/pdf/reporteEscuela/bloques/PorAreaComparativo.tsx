import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Cuadricula } from "./Cuadricula";
import { IconoArea } from "./IconoArea";
import { Rotulo } from "./Rotulo";
import { estadosComparativo, layoutCuadricula } from "../../../utils/reporteEscuela";
import type { AreaCatalogo, SalaReporte } from "../../../api/reportes";

/** Aprobados por área en pares inicial → cierre, con "9 → 17 de 24" (§7.6). */
export function PorAreaComparativo({ sala, areas }: { sala: SalaReporte; areas: AreaCatalogo[] }) {
  const c = sala.comparativo!;
  const layout = layoutCuadricula(c.base, "area", 12.5);
  return (
    <View>
      <Rotulo>Aprobados por área · inicial → cierre</Rotulo>
      {areas.map((a) => {
        const par = estadosComparativo(sala, a.id)!;
        const pa = c.por_area.find((p) => p.area_id === a.id);
        return (
          <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: u(0.7), marginBottom: u(0.9) }}>
            <IconoArea area={a} size={u(1.6)} />
            <Text style={{ width: u(8.5), fontSize: u(0.95), fontWeight: 600 }}>{a.nombre}</Text>
            <Cuadricula estados={par.inicial} layout={layout} />
            <Text style={{ fontSize: u(1.4), color: C.azul }}>→</Text>
            <Cuadricula estados={par.cierre} layout={layout} />
            <Text style={{ flexGrow: 1, textAlign: "right", fontSize: u(1) }}>
              <Text style={{ fontWeight: 700 }}>{pa?.aprobados_inicial ?? 0}</Text> → <Text style={{ fontWeight: 700 }}>{pa?.aprobados_cierre ?? 0}</Text> de {c.base}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

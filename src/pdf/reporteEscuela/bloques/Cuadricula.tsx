import { View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import type { EstadoCuadro, LayoutCuadricula } from "../../../utils/reporteEscuela";

const COLOR: Record<EstadoCuadro, string> = { g: C.verde, b: C.azul, h: C.grisTile };

/** Cuadrícula de "cada cuadrado es un chico". `layout` viene de `layoutCuadricula` (en unidades u). */
export function Cuadricula({ estados, layout }: { estados: EstadoCuadro[]; layout: LayoutCuadricula }) {
  const tile = u(layout.tile);
  const gap = u(layout.gap);
  const width = layout.cols * tile + (layout.cols - 1) * gap;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width, gap }}>
      {estados.map((s, i) => (
        <View key={i} style={{ width: tile, height: tile, borderRadius: tile * 0.12, backgroundColor: COLOR[s] }} />
      ))}
    </View>
  );
}

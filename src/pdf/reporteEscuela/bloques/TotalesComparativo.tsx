import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Cuadricula } from "./Cuadricula";
import { Leyenda } from "./Leyenda";
import { Rotulo } from "./Rotulo";
import { estadosComparativo, layoutCuadricula, textoResumenComparativo } from "../../../utils/reporteEscuela";
import type { SalaReporte } from "../../../api/reportes";

/** Totales del comparativo: par de cuadrículas con cada chico en la misma posición (§7.6). */
export function TotalesComparativo({ sala }: { sala: SalaReporte }) {
  const c = sala.comparativo!;
  const par = estadosComparativo(sala)!;
  const layout = layoutCuadricula(c.base, "sala", 24);
  const cap = (t: string, n: number) => (
    <Text style={{ fontSize: u(0.95), color: C.titulo, marginBottom: u(0.5) }}>
      {t} · <Text style={{ fontWeight: 700 }}>{n}</Text> de {c.base} aprobaron
    </Text>
  );
  return (
    <View>
      <Rotulo>Resultados totales</Rotulo>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: u(1) }}>
        <View>{cap("Inicial", c.aprobaron_inicial)}<Cuadricula estados={par.inicial} layout={layout} /></View>
        <Text style={{ fontSize: u(2.6), color: C.azul, marginBottom: u(2.4) }}>→</Text>
        <View>{cap("Cierre", c.cierra_con)}<Cuadricula estados={par.cierre} layout={layout} /></View>
      </View>
      <Leyenda items={[
        { color: C.verde, texto: "aprobaron todas las áreas" },
        { color: C.azul, texto: "tienen al menos un área para reforzar" },
        { color: C.grisTile, texto: "sin evaluación de cierre" },
      ]} />
      <Text style={{ fontSize: u(0.95), color: C.titulo, marginTop: u(0.8), lineHeight: 1.4 }}>{textoResumenComparativo(c)}</Text>
    </View>
  );
}

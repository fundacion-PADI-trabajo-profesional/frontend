import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";
import { Cuadricula } from "./Cuadricula";
import { Leyenda } from "./Leyenda";
import { Rotulo } from "./Rotulo";
import { estadosTotales, layoutCuadricula } from "../../../utils/reporteEscuela";
import type { ResultadoTipo } from "../../../api/reportes";

/** Estadística 1: resultados totales de la sala (§7.6). */
export function Totales({ r }: { r: ResultadoTipo }) {
  return (
    <View>
      <Rotulo>Resultados totales</Rotulo>
      <Cuadricula estados={estadosTotales(r)} layout={layoutCuadricula(r.evaluados, "sala")} />
      <Leyenda items={[
        { color: C.verde, n: r.aprobados, texto: "aprobaron todas las áreas" },
        { color: C.azul, n: r.evaluados - r.aprobados, texto: "tienen al menos un área para reforzar" },
      ]} />
      <Text style={{ fontSize: u(0.85), fontStyle: "italic", color: C.secundario, marginTop: u(0.5) }}>
        Cada cuadrado es un chico o una chica de la sala ({r.evaluados} en total).
      </Text>
      {r.cierra_con && (
        <Text style={{ fontSize: u(1), marginTop: u(0.6) }}>
          La sala cierra el año con <Text style={{ fontWeight: 700 }}>{r.cierra_con.aprobados} de {r.cierra_con.total}</Text> aprobados.
        </Text>
      )}
    </View>
  );
}

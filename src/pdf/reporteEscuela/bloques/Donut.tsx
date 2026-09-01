import { Path, Svg, Text, View } from "@react-pdf/renderer";
import { C, F, u } from "../theme";
import { arcoDonut, porcentaje } from "../../../utils/reporteEscuela";

/**
 * Donut de aprobados/evaluados (v2-C §1): arco verde `0°→360·aprobados/evaluados` y azul el resto,
 * con el porcentaje grande al centro. `size` en pt (el llamador lo arma con `u(...)`). Sin evaluados: anillo gris + "—".
 * `pendientes` (opcional) agrega un tercer arco gris al final del anillo (comparativo): verde `0→gA`,
 * azul `gA→gB`, gris `gB→360`, con `gA = 360·aprobados/evaluados` y `gB = 360·(evaluados−pendientes)/evaluados`.
 * Sin `pendientes` (o en 0), `gB` da 360 y el arco gris queda vacío: comportamiento idéntico al anterior.
 */
export function Donut({ aprobados, evaluados, pendientes, size, titulo }: { aprobados: number; evaluados: number; pendientes?: number; size: number; titulo?: string }) {
  const r = size / 2;
  const strokeWidth = size * 0.16;
  const radio = r - strokeWidth / 2;
  const gA = evaluados > 0 ? Math.max(0, Math.min(360, (360 * aprobados) / evaluados)) : 0;
  const gB = evaluados > 0 ? Math.max(0, Math.min(360, (360 * (evaluados - (pendientes ?? 0))) / evaluados)) : 0;
  const trazo = { strokeWidth, fill: "none" as const, strokeLinecap: "butt" as const };
  return (
    <View style={{ alignItems: "center" }}>
      {titulo && (
        <Text style={{ fontFamily: F.display, fontWeight: 700, fontSize: u(1.1), color: C.titulo, marginBottom: u(0.4) }}>{titulo}</Text>
      )}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {evaluados <= 0 ? (
            <Path d={arcoDonut(r, r, radio, 0, 360)} stroke={C.grisTile} {...trazo} />
          ) : (
            <>
              {gB < 360 && <Path d={arcoDonut(r, r, radio, gB, 360)} stroke={C.grisTile} {...trazo} />}
              {gA < gB && <Path d={arcoDonut(r, r, radio, gA, gB)} stroke={C.azul} {...trazo} />}
              {gA > 0 && <Path d={arcoDonut(r, r, radio, 0, gA)} stroke={C.verde} {...trazo} />}
            </>
          )}
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: F.display, fontWeight: 800, fontSize: size * 0.22, color: C.titulo }}>
            {evaluados > 0 ? porcentaje(aprobados, evaluados) : "—"}
          </Text>
          {evaluados > 0 && <Text style={{ fontSize: u(0.75), color: C.secundario }}>aprobaron</Text>}
        </View>
      </View>
      <Text style={{ fontSize: u(0.85), color: C.secundario, marginTop: u(0.4) }}>de {evaluados} evaluados</Text>
    </View>
  );
}

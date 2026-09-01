import { View } from "@react-pdf/renderer";
import { C, u } from "../theme";

/**
 * Barra apilada horizontal 100 % (v2-G "por sala" del resumen, granularidad media entre el donut y las
 * cuadrículas de sala/área): segmento verde `aprobados/evaluados` crece desde la izquierda, azul llena
 * el resto a la derecha, separados por una línea blanca fina, esquinas rectas (borderRadius 0, a tono
 * con ColumnaApilada — los cuadrados quedan reservados para las páginas de sala). Sin evaluados: barra
 * gris entera. Sin números adentro (van al costado en el llamador).
 * `pendientes` (opcional, espejo de `Donut`): agrega un tercer segmento gris al final `pendientes/evaluados`
 * (comparativo, sin evaluación de cierre). Sin `pendientes` (o en 0) el comportamiento es idéntico al anterior.
 */
export function BarraApilada({
  aprobados,
  evaluados,
  pendientes,
  ancho,
  alto = u(1.6),
}: {
  aprobados: number;
  evaluados: number;
  pendientes?: number;
  ancho: number;
  alto?: number;
}) {
  const p = evaluados > 0 ? Math.max(0, Math.min(1, aprobados / evaluados)) : 0;
  const pFin = evaluados > 0 ? Math.max(0, Math.min(1, (evaluados - (pendientes ?? 0)) / evaluados)) : 0;
  const anchoVerde = ancho * p;
  const anchoAzul = ancho * Math.max(0, pFin - p);
  const hayAzul = pFin > p;
  const hayGris = pFin < 1;
  const azulStyle = hayGris ? { width: anchoAzul } : { flexGrow: 1 };
  return (
    <View style={{ width: ancho, height: alto, borderRadius: 0, overflow: "hidden", flexDirection: "row", backgroundColor: C.grisTile }}>
      {evaluados > 0 && (
        <>
          {p > 0 && <View style={{ width: anchoVerde, height: alto, backgroundColor: C.verde }} />}
          {p > 0 && (hayAzul || hayGris) && <View style={{ width: 1.2, height: alto, backgroundColor: C.blanco }} />}
          {hayAzul && <View style={{ ...azulStyle, height: alto, backgroundColor: C.azul }} />}
          {hayAzul && hayGris && <View style={{ width: 1.2, height: alto, backgroundColor: C.blanco }} />}
          {hayGris && <View style={{ flexGrow: 1, height: alto, backgroundColor: C.grisTile }} />}
        </>
      )}
    </View>
  );
}

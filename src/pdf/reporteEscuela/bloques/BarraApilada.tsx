import { View } from "@react-pdf/renderer";
import { C, u } from "../theme";

/**
 * Barra apilada horizontal 100 % (v2-G "por sala" del resumen, granularidad media entre el donut y las
 * cuadrículas de sala/área): segmento verde `aprobados/evaluados` crece desde la izquierda, azul llena
 * el resto a la derecha, separados por una línea blanca fina, esquinas rectas (borderRadius 0, a tono
 * con ColumnaApilada — los cuadrados quedan reservados para las páginas de sala). Sin evaluados: barra
 * gris entera. Sin números adentro (van al costado en el llamador).
 */
export function BarraApilada({ aprobados, evaluados, ancho, alto = u(1.6) }: { aprobados: number; evaluados: number; ancho: number; alto?: number }) {
  const p = evaluados > 0 ? Math.max(0, Math.min(1, aprobados / evaluados)) : 0;
  const anchoVerde = ancho * p;
  return (
    <View style={{ width: ancho, height: alto, borderRadius: 0, overflow: "hidden", flexDirection: "row", backgroundColor: C.grisTile }}>
      {evaluados > 0 && (
        <>
          {p > 0 && <View style={{ width: anchoVerde, height: alto, backgroundColor: C.verde }} />}
          {p > 0 && p < 1 && <View style={{ width: 1.2, height: alto, backgroundColor: C.blanco }} />}
          {p < 1 && <View style={{ flexGrow: 1, height: alto, backgroundColor: C.azul }} />}
        </>
      )}
    </View>
  );
}

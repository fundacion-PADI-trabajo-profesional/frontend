import { View } from "@react-pdf/renderer";
import { C, u } from "../theme";

/**
 * Barra apilada horizontal (v2-C §2): segmento verde `aprobados/evaluados`, azul el resto, separados por
 * una línea blanca fina, extremos redondeados. Sin evaluados: barra gris entera. Sin números adentro.
 */
export function BarraApilada({ aprobados, evaluados, ancho, alto = u(0.75) }: { aprobados: number; evaluados: number; ancho: number; alto?: number }) {
  const p = evaluados > 0 ? Math.max(0, Math.min(1, aprobados / evaluados)) : 0;
  const anchoVerde = ancho * p;
  return (
    <View style={{ width: ancho, height: alto, borderRadius: alto / 2, overflow: "hidden", flexDirection: "row", backgroundColor: C.grisTile }}>
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

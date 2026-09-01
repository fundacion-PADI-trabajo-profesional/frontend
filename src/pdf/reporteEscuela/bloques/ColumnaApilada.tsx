import { View } from "@react-pdf/renderer";
import { C, u } from "../theme";

/**
 * Columna apilada vertical 100 % (rediseño "aprobados por área"): segmento verde
 * `aprobados/evaluados` crece desde ABAJO, azul llena el resto arriba, separados por una línea
 * blanca fina, extremos redondeados (borde + overflow oculto). Sin evaluados: columna gris entera.
 * Sin números adentro (van arriba de la columna en el llamador).
 */
export function ColumnaApilada({ aprobados, evaluados, alto = u(9), ancho = u(3.5) }: { aprobados: number; evaluados: number; alto?: number; ancho?: number }) {
  const p = evaluados > 0 ? Math.max(0, Math.min(1, aprobados / evaluados)) : 0;
  const altoVerde = alto * p;
  return (
    <View style={{ width: ancho, height: alto, borderRadius: 0, overflow: "hidden", flexDirection: "column", backgroundColor: C.grisTile }}>
      {evaluados > 0 && (
        <>
          {p < 1 && <View style={{ width: ancho, flexGrow: 1, backgroundColor: C.azul }} />}
          {p > 0 && p < 1 && <View style={{ width: ancho, height: 1.2, backgroundColor: C.blanco }} />}
          {p > 0 && <View style={{ width: ancho, height: altoVerde, backgroundColor: C.verde }} />}
        </>
      )}
    </View>
  );
}

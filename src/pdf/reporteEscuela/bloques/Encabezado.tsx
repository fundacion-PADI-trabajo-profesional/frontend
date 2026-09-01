import { Text, View } from "@react-pdf/renderer";
import { C, F, PAGE, u } from "../theme";

/**
 * Encabezado fijo de las páginas de sala/resumen (§7.3): motivo de la marca, título,
 * subtítulo (con "(continuación)" cuando la sección sigue en otra hoja) y línea de escuela.
 */
export function Encabezado({ titulo, subtitulo, linea }: { titulo: string; subtitulo: string; linea: string }) {
  return (
    <View fixed style={{ marginBottom: u(2.6) }}>
      <View style={{ position: "absolute", top: -PAGE.paddingTop, right: u(6) - PAGE.paddingHorizontal, width: u(7), height: u(8.2) }}>
        <View style={{ position: "absolute", left: 0, top: 0, width: u(2.6), height: u(6.2), backgroundColor: C.verdeClaro }} />
        <View style={{ position: "absolute", left: u(2), top: u(1.2), width: u(5), height: u(7), backgroundColor: C.azul }} />
      </View>
      <Text style={{ fontFamily: F.display, fontWeight: 800, fontSize: u(3.7), textTransform: "uppercase", color: C.titulo, letterSpacing: 0.3 }}>
        {titulo}
      </Text>
      <Text
        style={{ fontWeight: 700, fontStyle: "italic", fontSize: u(1.55), textTransform: "uppercase", color: C.azul, marginTop: u(0.5), letterSpacing: 0.3 }}
        render={({ subPageNumber }) => ((subPageNumber ?? 1) > 1 ? `${subtitulo} (continuación)` : subtitulo)}
      />
      <Text style={{ fontSize: u(1.05), color: C.secundario, marginTop: u(0.5) }}>{linea}</Text>
    </View>
  );
}

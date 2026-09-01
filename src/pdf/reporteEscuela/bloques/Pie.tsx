import { Image, Text, View } from "@react-pdf/renderer";
import { C, PAGE, u } from "../theme";

/** Pie fijo: logo · "escuela · evaluación · año" · número de página (§7.3). */
export function Pie({ logo, textoCorrido }: { logo: string; textoCorrido: string }) {
  return (
    <View
      fixed
      style={{ position: "absolute", bottom: u(1.2), left: PAGE.paddingHorizontal, right: PAGE.paddingHorizontal, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
    >
      <Image src={logo} style={{ height: u(2.4), width: u(7), objectFit: "contain" }} />
      <Text style={{ fontSize: u(0.8), color: C.secundario }}>{textoCorrido}</Text>
      <Text style={{ fontSize: u(0.95), fontWeight: 700 }} render={({ pageNumber }) => String(pageNumber)} />
    </View>
  );
}

import { Text, View } from "@react-pdf/renderer";
import { u } from "../theme";

export interface ItemLeyenda { color: string; n?: number; texto: string }

export function Leyenda({ items }: { items: ItemLeyenda[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: u(1.6), rowGap: u(0.3), marginTop: u(1) }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: u(0.4) }}>
          <View style={{ width: u(1), height: u(1), borderRadius: u(0.15), backgroundColor: it.color }} />
          <Text style={{ fontSize: u(1) }}>
            {it.n !== undefined && <Text style={{ fontWeight: 700 }}>{it.n} </Text>}
            {it.texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

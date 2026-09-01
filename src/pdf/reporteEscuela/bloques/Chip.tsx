import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";

export type ChipVariant = "aprobada" | "desaprobada" | "pendiente";

/** Chip de área en la nómina del comparativo (§7.6): estado final de cada chico, sin prefijos. */
export function Chip({ variant, children }: { variant: ChipVariant; children: string }) {
  const c = C.chip[variant];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: u(2), paddingVertical: u(0.12), paddingHorizontal: u(0.55) }}>
      <Text style={{ fontSize: u(0.75), fontWeight: 600, color: c.fg }}>{children}</Text>
    </View>
  );
}

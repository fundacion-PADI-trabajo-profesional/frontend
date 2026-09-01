import { Text, View } from "@react-pdf/renderer";
import { C, u } from "../theme";

export type ChipVariant = "recupero" | "persiste" | "nueva" | "pendiente";
// Las fuentes embebidas (Montserrat) no tienen glifo para ✓ (U+2713) y react-pdf no
// resuelve fallback de fuente: cae en .notdef. √ (U+221A) sí está y es visualmente
// equivalente a un check, así que se usa como sustituto.
const PREFIJO: Record<ChipVariant, string> = { recupero: "√ ", persiste: "", nueva: "▲ ", pendiente: "" };

/** Chip de área en la nómina del comparativo (§7.6). */
export function Chip({ variant, children }: { variant: ChipVariant; children: string }) {
  const c = C.chip[variant];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: u(2), paddingVertical: u(0.12), paddingHorizontal: u(0.55), ...(variant === "nueva" ? { borderWidth: 0.8, borderColor: C.azul } : {}) }}>
      <Text style={{ fontSize: u(0.75), fontWeight: 600, color: c.fg }}>{PREFIJO[variant] + children}</Text>
    </View>
  );
}

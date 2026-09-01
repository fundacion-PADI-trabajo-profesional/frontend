import { Text } from "@react-pdf/renderer";
import { C, F, u } from "../theme";

/** Rótulo de sección: League Spartan 700, mayúsculas, azul (§7.2). */
export function Rotulo({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: F.display, fontWeight: 700, fontSize: u(1.05), letterSpacing: 1.2, textTransform: "uppercase", color: C.azul, marginBottom: u(1) }}>
      {children}
    </Text>
  );
}

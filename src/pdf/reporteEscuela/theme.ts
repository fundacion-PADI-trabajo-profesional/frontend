/** Unidad de la maqueta: 1 u = 1.6 % del ancho A4 (595.28 pt) ≈ 9.52 pt (spec §7). */
export const U = 9.52;
export const u = (x: number) => x * U;

export const C = {
  azul: "#375E9E",
  verde: "#86B93F",
  verdeClaro: "#B8DB7B",
  grisTile: "#E3E8EA",
  ink: "#2B2F33",
  titulo: "#4A4F55",
  secundario: "#6B7177",
  panel: "#F1F3F4",
  lineaFila: "#375E9E44",
  blanco: "#FFFFFF",
  chip: {
    recupero: { bg: "#DDEFC4", fg: "#2F5A0E" },
    persiste: { bg: "#DCE4F1", fg: "#274A82" },
    nueva: { bg: "#FFFFFF", fg: "#274A82" },
    pendiente: { bg: "#E6E9EB", fg: "#4A4F55" },
  },
} as const;

export const F = { display: "League Spartan", body: "Montserrat" } as const;

/** El pie es `fixed` y absoluto: el paddingBottom le reserva el lugar (§7.3). */
export const PAGE = { paddingTop: u(3.6), paddingHorizontal: u(4.2), paddingBottom: u(4.8) } as const;

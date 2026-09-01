import { Font } from "@react-pdf/renderer";

export interface FontSources { ls700: string; ls800: string; m400: string; m500: string; m600: string; m700: string; m700i: string }

let registradas = false;

/** Registra las familias del PDF. Idempotente; el browser pasa URLs de Vite y los tests rutas del filesystem. */
export function registerFonts(src: FontSources) {
  if (registradas) return;
  registradas = true;
  Font.register({ family: "League Spartan", fonts: [
    { src: src.ls700, fontWeight: 700 },
    { src: src.ls800, fontWeight: 800 },
  ] });
  Font.register({ family: "Montserrat", fonts: [
    { src: src.m400, fontWeight: 400 },
    { src: src.m500, fontWeight: 500 },
    { src: src.m600, fontWeight: 600 },
    { src: src.m700, fontWeight: 700 },
    { src: src.m700i, fontWeight: 700, fontStyle: "italic" },
  ] });
  // Sin partir palabras: los textos del reporte son cortos y el corte silábico inglés queda mal en español.
  Font.registerHyphenationCallback((w) => [w]);
}

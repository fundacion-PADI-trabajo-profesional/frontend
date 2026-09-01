// @vitest-environment node
import { describe, it, expect, beforeAll, vi } from "vitest";
import path from "node:path";

// test/setup.ts stubs fetch con vi.fn() (devuelve undefined y rompe el loader WASM de yoga).
// Con que fetch RECHACE alcanza: yoga captura el error y cae a su decodificador base64 interno.
vi.stubGlobal("fetch", () => Promise.reject(new Error("fetch deshabilitado en el smoke test de PDF")));

import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../../src/pdf/reporteEscuela/fonts";
import { ReporteEscuelaDocument } from "../../src/pdf/reporteEscuela/ReporteEscuelaDocument";
import type { Modo } from "../../src/utils/reporteEscuela";
import type { ReporteEscuela } from "../../src/api/reportes";
import { REPORTE_24, REPORTE_44, REPORTE_ESCUELA, REPORTE_SIN_CIERRE } from "../fixtures/reporteEscuela";

const dir = new URL(".", import.meta.url).pathname;
const F = (f: string) => path.resolve(dir, "../../src/pdf/fonts", f);
const ASSETS = { logo: path.resolve(dir, "../../public/assets/images/logo_sin_fondo.png") };

beforeAll(() =>
  registerFonts({
    ls700: F("LeagueSpartan-Bold.ttf"), ls800: F("LeagueSpartan-ExtraBold.ttf"),
    m400: F("Montserrat-Regular.ttf"), m500: F("Montserrat-Medium.ttf"), m600: F("Montserrat-SemiBold.ttf"),
    m700: F("Montserrat-Bold.ttf"), m700i: F("Montserrat-BoldItalic.ttf"),
  })
);

export const paginas = (buf: Buffer) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
export const render = (data: ReporteEscuela, modo: Modo, salaId: number | null = null) =>
  renderToBuffer(<ReporteEscuelaDocument data={data} modo={modo} salaId={salaId} assets={ASSETS} />);

describe("ReporteEscuelaDocument — portada", () => {
  it("genera un PDF válido con la portada", async () => {
    const buf = await render({ ...REPORTE_24, salas: [] }, "inicial");
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(paginas(buf)).toBe(1);
  });
});

describe("ReporteEscuelaDocument — documento completo", () => {
  // Nómina a dos renglones (v2-D) + "No pasaron la prueba" a 3 columnas (v2-E, Ruling controller):
  // se buscó recuperar densidad angostando las celdas de no-pasaron en más columnas. Conteos
  // re-verificados contra el motor de layout real (yoga), no estimados — coinciden con los de v2-D:
  // la 3ra columna reduce filas donde "no pasaron" domina (p. ej. sala de 20 en REPORTE_ESCUELA, que
  // vuelve a entrar en 1 hoja), pero en salas donde "aprobaron" domina el conteo de filas no baja (misma
  // cantidad de filas que a 2 columnas) y las celdas más angostas ahora envuelven a 2 líneas más seguido
  // el texto de áreas de los que reprobaron 3 de 4 (p. ej. la sala de 18), por lo que esa sala pasa a
  // ocupar 2 hojas en vez de 1. El total de hojas de REPORTE_ESCUELA no cambia (sigue en 7): es una
  // redistribución, no una regresión aislada — verificado visualmente que ninguna celda se corta ni se
  // superpone en ningún caso (Ruling A: nunca comprimir por debajo de la legibilidad para forzar el
  // conteo de páginas).
  it("escuela de una sala de 24: portada + resumen + sala (2 hojas, nómina no entra en 1) = 4", async () => {
    expect(paginas(await render(REPORTE_24, "inicial"))).toBe(4);
  });
  it("escuela de una sala de 44: portada + resumen + 2 = 4", async () => {
    expect(paginas(await render(REPORTE_44, "inicial"))).toBe(4);
  });
  it("escuela de tres salas chicas: portada + resumen + 3 salas (2 se parten en 2 hojas) = 7", async () => {
    expect(paginas(await render(REPORTE_ESCUELA, "inicial"))).toBe(7);
  });
  it("una sola sala: sin resumen (portada + sala en 2 hojas) = 3", async () => {
    expect(paginas(await render(REPORTE_24, "inicial", 5))).toBe(3);
  });
  it("comparativo de 24: el bloque de pautas fluye a otra hoja si no entra", async () => {
    const n = paginas(await render(REPORTE_24, "comparativo"));
    expect(n).toBeGreaterThanOrEqual(4); // portada + resumen + sala en 1–2 hojas
    expect(n).toBeLessThanOrEqual(5);
  });
  it("modo cierre sin cierres: portada + aviso (sin resumen)", async () => {
    expect(paginas(await render(REPORTE_SIN_CIERRE, "cierre"))).toBe(2);
  });
});

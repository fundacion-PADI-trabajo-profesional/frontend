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
import { REPORTE_24, REPORTE_44, REPORTE_SIN_CIERRE } from "../fixtures/reporteEscuela";

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

describe("ReporteEscuelaDocument — secciones de sala (inicial/cierre)", () => {
  it("24 chicos: la sala entra en una hoja (portada + sala = 2)", async () => {
    expect(paginas(await render(REPORTE_24, "inicial"))).toBe(2);
  });
  it("44 chicos: la sala usa dos hojas (portada + 2 = 3)", async () => {
    expect(paginas(await render(REPORTE_44, "inicial"))).toBe(3);
  });
  it("una sola sala: portada + su sección", async () => {
    expect(paginas(await render(REPORTE_24, "inicial", 5))).toBe(2);
  });
  it("modo cierre sin cierres: hoja con el aviso", async () => {
    const buf = await render(REPORTE_SIN_CIERRE, "cierre");
    expect(paginas(buf)).toBe(2); // portada + hoja "Sin evaluación de cierre en 2025"
  });
});

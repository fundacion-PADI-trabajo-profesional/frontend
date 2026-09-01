// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";

// Initialize globals and WASM support for Node environment
globalThis.TextEncoder = class TextEncoder {
  encode(str: string) {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
    return arr;
  }
};
globalThis.TextDecoder = class TextDecoder {
  decode(arr: Uint8Array) {
    let str = "";
    for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
    return str;
  }
};
globalThis.fetch = async (url: string | Request) => {
  if (typeof url === "string" && url.startsWith("data:application/wasm;base64,")) {
    const base64 = url.slice(29);
    const buffer = Buffer.from(base64, "base64");
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
    } as Response;
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../../src/pdf/reporteEscuela/fonts";
import { ReporteEscuelaDocument } from "../../src/pdf/reporteEscuela/ReporteEscuelaDocument";
import type { Modo } from "../../src/utils/reporteEscuela";
import type { ReporteEscuela } from "../../src/api/reportes";
import { REPORTE_24 } from "../fixtures/reporteEscuela";

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

import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReporteEscuelaDocument } from "./ReporteEscuelaDocument";
import { registerFontsBrowser } from "./fonts.browser";
import { ASSETS } from "./assets.browser";
import type { Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

/** Genera el PDF en el navegador. Este módulo solo se importa con `await import(...)` (bundle aparte). */
export async function generarReportePdf(data: ReporteEscuela, opts: { modo: Modo; salaId: number | null }): Promise<Blob> {
  registerFontsBrowser();
  // `pdf()` tipa su argumento como ReactElement<DocumentProps> (todas las props opcionales de `Document`);
  // como `ReporteEscuelaDocument` expone otras props (data/modo/salaId/assets), TS lo rechaza por "weak type"
  // aunque en tiempo de ejecución renderiza el mismo `<Document>`. Cast puntual contra la firma real de `pdf`.
  const documento = createElement(ReporteEscuelaDocument, { data, modo: opts.modo, salaId: opts.salaId, assets: ASSETS });
  return pdf(documento as unknown as Parameters<typeof pdf>[0]).toBlob();
}

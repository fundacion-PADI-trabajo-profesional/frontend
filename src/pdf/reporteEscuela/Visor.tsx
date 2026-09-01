import { PDFViewer } from "@react-pdf/renderer";
import { ReporteEscuelaDocument } from "./ReporteEscuelaDocument";
import { registerFontsBrowser } from "./fonts.browser";
import { ASSETS } from "./assets.browser";
import type { Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

registerFontsBrowser();

/** Vista previa embebida. Se carga con `lazy()` desde la página. */
export default function Visor({ data, modo, salaId }: { data: ReporteEscuela; modo: Modo; salaId: number | null }) {
  return (
    <PDFViewer style={{ width: "100%", height: "78vh", border: 0 }} showToolbar>
      <ReporteEscuelaDocument data={data} modo={modo} salaId={salaId} assets={ASSETS} />
    </PDFViewer>
  );
}

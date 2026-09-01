import { Document } from "@react-pdf/renderer";
import { PaginaPortada } from "./PaginaPortada";
import type { Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

export interface ReporteDocumentProps { data: ReporteEscuela; modo: Modo; salaId: number | null; assets: { logo: string } }

export function ReporteEscuelaDocument({ data, modo, salaId, assets }: ReporteDocumentProps) {
  return (
    <Document title={`Reporte PADI · ${data.escuela.nombre} · ${data.periodo}`} language="es">
      <PaginaPortada data={data} modo={modo} salaId={salaId} assets={assets} />
    </Document>
  );
}

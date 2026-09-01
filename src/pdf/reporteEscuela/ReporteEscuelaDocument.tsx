import { Document } from "@react-pdf/renderer";
import { PaginaPortada } from "./PaginaPortada";
import { PaginaResumen } from "./PaginaResumen";
import { SeccionSala } from "./SeccionSala";
import type { Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

export interface ReporteDocumentProps { data: ReporteEscuela; modo: Modo; salaId: number | null; assets: { logo: string } }

export function ReporteEscuelaDocument({ data, modo, salaId, assets }: ReporteDocumentProps) {
  return (
    <Document title={`Reporte PADI · ${data.escuela.nombre} · ${data.periodo}`} language="es">
      <PaginaPortada data={data} modo={modo} salaId={salaId} assets={assets} />
      {salaId === null && data.salas.length > 0 && (modo === "comparativo" ? data.resumen.comparativo : data.resumen[modo]) && (
        <PaginaResumen data={data} modo={modo} assets={assets} />
      )}
      {(salaId === null ? data.salas : data.salas.filter((s) => s.sala_id === salaId)).map((s) => (
        <SeccionSala key={s.sala_id} data={data} sala={s} modo={modo} assets={assets} />
      ))}
    </Document>
  );
}

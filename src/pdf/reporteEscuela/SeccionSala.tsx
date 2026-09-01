import { Page, Text, View } from "@react-pdf/renderer";
import { C, F, PAGE, u } from "./theme";
import { Encabezado } from "./bloques/Encabezado";
import { Pie } from "./bloques/Pie";
import { Totales } from "./bloques/Totales";
import { PorArea } from "./bloques/PorArea";
import { Nomina } from "./bloques/Nomina";
import { Pautas } from "./bloques/Pautas";
import { TotalesComparativo } from "./bloques/TotalesComparativo";
import { PorAreaComparativo } from "./bloques/PorAreaComparativo";
import { NominaComparativo } from "./bloques/NominaComparativo";
import { subtituloModo, type Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela, SalaReporte } from "../../api/reportes";

const gap = () => <View style={{ height: u(0.9) }} />;

/** Página(s) de una sala. `wrap`: los bloques son indivisibles y la nómina se corta entre filas (§6.3). */
export function SeccionSala({ data, sala, modo, assets }: { data: ReporteEscuela; sala: SalaReporte; modo: Modo; assets: { logo: string } }) {
  const sub = subtituloModo(modo, data.periodo);
  const turnoTxt = data.turno ? ` · turno ${data.turno}` : "";
  const pieTxt = `${data.escuela.nombre}${turnoTxt} · ${sub}`;
  const c = modo === "comparativo" ? sala.comparativo : null;
  const r = modo === "inicial" ? sala.inicial : modo === "cierre" ? sala.cierre : null;
  const linea = c
    ? `${data.escuela.nombre}${turnoTxt} · ${c.base} niños y niñas · ${c.reevaluados} reevaluados en el cierre`
    : r
      ? `${data.escuela.nombre}${turnoTxt} · ${r.evaluados} niños y niñas evaluados con la Prueba PADI`
      : `${data.escuela.nombre}${turnoTxt}`;
  const sinDatos = modo === "comparativo" ? !c : !r;
  return (
    <Page size="A4" wrap style={{ ...PAGE, fontFamily: F.body, fontSize: u(1.1), color: C.ink }}>
      <Encabezado titulo={`Resultados ${sala.sala}`} subtitulo={sub} linea={linea} />
      {sinDatos ? (
        <Text style={{ fontSize: u(1.2), color: C.secundario, marginTop: u(4) }}>
          Sin {!sala.inicial ? "evaluación inicial" : "evaluación de cierre"} en {data.periodo}.
        </Text>
      ) : (
        <>
          {modo === "comparativo" && c && (
            <>
              <View wrap={false}><TotalesComparativo sala={sala} /></View>
              {gap()}
              <View wrap={false}><PorAreaComparativo sala={sala} areas={data.areas} /></View>
              {gap()}
              <NominaComparativo sala={sala} areas={data.areas} />
              {gap()}
              <View wrap={false}>
                <Pautas
                  pautas={c.pautas}
                  areas={data.areas}
                  titulo="Pautas que siguen costando · evaluación de cierre"
                  caption={`Las tres pautas de cada área que más chicos no lograron en el cierre, sobre los ${c.reevaluados} reevaluados. Cada cuadrado azul es un chico que la desaprobó.`}
                />
              </View>
            </>
          )}
          {r && (
            <>
              <View wrap={false} style={{ flexDirection: "row", gap: u(3) }}>
                <View style={{ flex: 1 }}><Totales r={r} /></View>
                <View style={{ flex: 1.2 }}><PorArea r={r} areas={data.areas} /></View>
              </View>
              {gap()}
              <Nomina r={r} areas={data.areas} />
              {gap()}
              <View wrap={false}>
                <Pautas
                  pautas={r.pautas}
                  areas={data.areas}
                  titulo="Pautas más desaprobadas"
                  caption="Las tres pautas de cada área que más chicos y chicas no lograron. Cada cuadrado azul es un chico que la desaprobó."
                />
              </View>
            </>
          )}
        </>
      )}
      <Pie logo={assets.logo} textoCorrido={pieTxt} />
    </Page>
  );
}

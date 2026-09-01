import { Page, Text, View } from "@react-pdf/renderer";
import { C, F, PAGE, u } from "./theme";
import { Encabezado } from "./bloques/Encabezado";
import { Pie } from "./bloques/Pie";
import { Rotulo } from "./bloques/Rotulo";
import { Cuadricula } from "./bloques/Cuadricula";
import { Donut } from "./bloques/Donut";
import { BarraApilada } from "./bloques/BarraApilada";
import { Leyenda } from "./bloques/Leyenda";
import { IconoArea } from "./bloques/IconoArea";
import { TablaSalaArea } from "./bloques/TablaSalaArea";
import { estadosTotales, layoutCuadricula, porcentaje, subtituloModo, type Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

const gap = () => <View style={{ height: u(2.2) }} />;

const leyendaTotales = [
  { color: C.verde, texto: "aprobaron todas las áreas" },
  { color: C.azul, texto: "tienen al menos un área para reforzar" },
];

/** Página 2 del reporte de escuela: totales, por sala, por área y tabla sala × área (§6.3, rediseño v2-C). */
export function PaginaResumen({ data, modo, assets }: { data: ReporteEscuela; modo: Modo; assets: { logo: string } }) {
  const sub = subtituloModo(modo, data.periodo);
  const cmp = modo === "comparativo" ? data.resumen.comparativo! : null;
  const r = modo === "comparativo" ? null : data.resumen[modo]!;
  const evaluados = cmp ? cmp.base : r!.evaluados;
  const turnoTxt = data.turno ? ` · turno ${data.turno}` : "";
  const linea = `${data.escuela.nombre}${turnoTxt} · ${evaluados} niños y niñas evaluados con la Prueba PADI`;
  return (
    <Page size="A4" wrap style={{ ...PAGE, fontFamily: F.body, fontSize: u(1.1), color: C.ink }}>
      <Encabezado titulo="Resumen de la escuela" subtitulo={sub} linea={linea} />

      <View wrap={false}>
        <Rotulo>Resultados totales de la escuela</Rotulo>
        {cmp ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: u(2) }}>
              <Donut aprobados={cmp.aprobaron_inicial} evaluados={cmp.base} size={u(7)} titulo="Inicial" />
              <Text style={{ fontSize: u(2.2), color: C.azul }}>→</Text>
              <Donut aprobados={cmp.cierra_con} evaluados={cmp.base} pendientes={cmp.pendientes} size={u(7)} titulo="Cierre" />
              <View style={{ width: u(19) }}>
                <Leyenda items={cmp.pendientes > 0 ? [...leyendaTotales, { color: C.grisTile, texto: "sin evaluación de cierre" }] : leyendaTotales} />
              </View>
            </View>
            {cmp.pendientes > 0 && (
              <Text style={{ fontSize: u(0.85), color: C.secundario, marginTop: u(0.6) }}>
                {cmp.pendientes} todavía sin evaluación de cierre
              </Text>
            )}
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: u(2) }}>
            <Donut aprobados={r!.aprobados} evaluados={evaluados} size={u(9)} />
            <View style={{ width: u(17) }}>
              <Leyenda items={leyendaTotales} />
            </View>
          </View>
        )}
        {modo === "cierre" && data.resumen.cierre?.cierra_con && (
          <Text style={{ fontSize: u(1), marginTop: u(0.6) }}>
            La escuela cierra el año con <Text style={{ fontWeight: 700 }}>{data.resumen.cierre.cierra_con.aprobados} de {data.resumen.cierre.cierra_con.total}</Text> aprobados.
          </Text>
        )}
      </View>
      {gap()}

      <View wrap={false}>
        <Rotulo>Por sala</Rotulo>
        {cmp
          ? cmp.por_sala.map((s) => (
              <Text key={s.sala_id} style={{ fontSize: u(1), marginBottom: u(0.6) }}>
                <Text style={{ fontWeight: 700 }}>{s.sala}</Text> ({s.base} chicos): {porcentaje(s.aprobaron_inicial, s.base)} → {porcentaje(s.cierra_con, s.base)}
                {s.pendientes > 0 ? ` · ${s.pendientes} sin cierre` : ""}
              </Text>
            ))
          : r!.por_sala.map((s) => (
              <View key={s.sala_id} style={{ flexDirection: "row", alignItems: "center", gap: u(1.2), marginBottom: u(1.1) }}>
                <View style={{ width: u(9) }}>
                  <Text style={{ fontSize: u(1.05), fontWeight: 700 }}>{s.sala}</Text>
                  <Text style={{ fontSize: u(0.85), color: C.secundario }}>{s.evaluados} evaluados</Text>
                </View>
                <Cuadricula estados={estadosTotales(s)} layout={layoutCuadricula(s.evaluados, "area")} />
                <Text style={{ flexGrow: 1, textAlign: "right", fontSize: u(1) }}>
                  <Text style={{ fontWeight: 700 }}>{s.aprobados}</Text> de {s.evaluados} aprobaron todas las áreas
                </Text>
              </View>
            ))}
      </View>
      {gap()}

      <View wrap={false}>
        <Rotulo>Aprobados por área</Rotulo>
        {data.areas.map((a) => {
          const etiqueta = cmp
            ? (() => {
                const p = cmp.por_area.find((x) => x.area_id === a.id);
                const apIni = p?.aprobados_inicial ?? 0;
                const apCierre = p?.aprobados_cierre ?? 0;
                return { barra: { aprobados: apCierre, evaluados: cmp.base }, texto: `${porcentaje(apIni, cmp.base)} → ${porcentaje(apCierre, cmp.base)}`, deN: cmp.base };
              })()
            : (() => {
                const p = r!.por_area.find((x) => x.area_id === a.id);
                const evA = p?.evaluados ?? 0;
                const apA = p?.aprobados ?? 0;
                return { barra: { aprobados: apA, evaluados: evA }, texto: porcentaje(apA, evA), deN: evA };
              })();
          return (
            <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: u(0.9), marginBottom: u(0.85) }}>
              <IconoArea area={a} size={u(1.6)} />
              <Text style={{ width: u(8.5), fontSize: u(0.95), fontWeight: 600 }}>{a.nombre}</Text>
              <BarraApilada aprobados={etiqueta.barra.aprobados} evaluados={etiqueta.barra.evaluados} ancho={u(20)} />
              <View style={{ flexGrow: 1, alignItems: "flex-end" }}>
                <Text style={{ fontSize: u(1.15), fontWeight: 700, color: C.titulo }}>{etiqueta.texto}</Text>
                <Text style={{ fontSize: u(0.75), color: C.secundario }}>de {etiqueta.deN} evaluados</Text>
              </View>
            </View>
          );
        })}
      </View>
      {gap()}

      <View wrap={false}>
        <TablaSalaArea data={data} modo={modo} />
      </View>

      <Pie logo={assets.logo} textoCorrido={`${data.escuela.nombre}${turnoTxt} · ${sub}`} />
    </Page>
  );
}

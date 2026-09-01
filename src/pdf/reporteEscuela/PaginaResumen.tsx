import { Page, Text, View } from "@react-pdf/renderer";
import { C, F, PAGE, u } from "./theme";
import { Encabezado } from "./bloques/Encabezado";
import { Pie } from "./bloques/Pie";
import { Rotulo } from "./bloques/Rotulo";
import { Cuadricula } from "./bloques/Cuadricula";
import { Leyenda } from "./bloques/Leyenda";
import { IconoArea } from "./bloques/IconoArea";
import { TablaSalaArea } from "./bloques/TablaSalaArea";
import { estadosComparativoResumen, estadosTotales, layoutCuadricula, subtituloModo, type Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

const gap = () => <View style={{ height: u(2.2) }} />;

/** Página 2 del reporte de escuela: totales, por sala, por área y tabla sala × área (§6.3). */
export function PaginaResumen({ data, modo, assets }: { data: ReporteEscuela; modo: Modo; assets: { logo: string } }) {
  const sub = subtituloModo(modo, data.periodo);
  const cmp = modo === "comparativo" ? data.resumen.comparativo! : null;
  const r = modo === "comparativo" ? null : data.resumen[modo]!;
  const evaluados = cmp ? cmp.base : r!.evaluados;
  const linea = `${data.escuela.nombre} · ${evaluados} niños y niñas evaluados con la Prueba PADI`;
  const parEscuela = cmp ? estadosComparativoResumen(cmp) : null;
  const layoutEscuela = layoutCuadricula(evaluados, "escuela", cmp ? 24 : undefined);
  return (
    <Page size="A4" wrap style={{ ...PAGE, fontFamily: F.body, fontSize: u(1.1), color: C.ink }}>
      <Encabezado titulo="Resumen de la escuela" subtitulo={sub} linea={linea} />

      <View wrap={false}>
        <Rotulo>Resultados totales de la escuela</Rotulo>
        {parEscuela ? (
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: u(1) }}>
            <View>
              <Text style={{ fontSize: u(0.95), color: C.titulo, marginBottom: u(0.5) }}>Inicial · <Text style={{ fontWeight: 700 }}>{cmp!.aprobaron_inicial}</Text> de {cmp!.base} aprobaron</Text>
              <Cuadricula estados={parEscuela.inicial} layout={layoutEscuela} />
            </View>
            <Text style={{ fontSize: u(2.6), color: C.azul, marginBottom: u(2.4) }}>→</Text>
            <View>
              <Text style={{ fontSize: u(0.95), color: C.titulo, marginBottom: u(0.5) }}>Cierre · <Text style={{ fontWeight: 700 }}>{cmp!.cierra_con}</Text> de {cmp!.base} aprobaron</Text>
              <Cuadricula estados={parEscuela.cierre} layout={layoutEscuela} />
            </View>
          </View>
        ) : (
          <Cuadricula estados={estadosTotales(r!)} layout={layoutEscuela} />
        )}
        <Leyenda items={[
          { color: C.verde, n: cmp ? cmp.cierra_con : r!.aprobados, texto: "aprobaron todas las áreas" },
          { color: C.azul, n: cmp ? cmp.base - cmp.cierra_con - cmp.pendientes : evaluados - r!.aprobados, texto: "tienen al menos un área para reforzar" },
          ...(cmp ? [{ color: C.grisTile, n: cmp.pendientes, texto: "sin evaluación de cierre" }] : []),
        ]} />
        <Text style={{ fontSize: u(0.85), fontStyle: "italic", color: C.secundario, marginTop: u(0.5) }}>
          {modo === "cierre"
            ? `Cada cuadrado es un chico o una chica de la escuela evaluado en el cierre (${evaluados} en total).`
            : `Cada cuadrado es un chico o una chica de la escuela (${evaluados} en total).`}
        </Text>
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
                <Text style={{ fontWeight: 700 }}>{s.sala}</Text> · {s.base} chicos — {s.aprobaron_inicial} aprobaron la inicial · {s.recuperaron} recuperaron · {s.persisten} siguen · {s.pendientes} sin cierre → cierra con <Text style={{ fontWeight: 700 }}>{s.cierra_con} de {s.base}</Text>
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

      {!cmp && (
        <>
          <View wrap={false}>
            <Rotulo>Aprobados por área</Rotulo>
            {data.areas.map((a) => {
              const p = r!.por_area.find((x) => x.area_id === a.id);
              return (
                <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: u(0.9), marginBottom: u(0.85) }}>
                  <IconoArea area={a} size={u(1.6)} />
                  <Text style={{ width: u(8.5), fontSize: u(0.95), fontWeight: 600 }}>{a.nombre}</Text>
                  <Cuadricula estados={[...Array(p?.aprobados ?? 0).fill("g"), ...Array(Math.max(0, (p?.evaluados ?? 0) - (p?.aprobados ?? 0))).fill("b")] as ("g" | "b")[]} layout={layoutCuadricula(p?.evaluados ?? 0, "areaEscuela")} />
                  <Text style={{ flexGrow: 1, textAlign: "right", fontSize: u(1) }}>
                    <Text style={{ fontWeight: 700 }}>{p?.aprobados ?? 0}</Text> de {p?.evaluados ?? 0}
                  </Text>
                </View>
              );
            })}
          </View>
          {gap()}
        </>
      )}

      <View wrap={false}>
        <TablaSalaArea data={data} modo={modo} />
      </View>

      <Pie logo={assets.logo} textoCorrido={`${data.escuela.nombre} · ${sub}`} />
    </Page>
  );
}

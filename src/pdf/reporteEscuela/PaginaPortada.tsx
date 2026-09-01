import { Image, Page, Text, View } from "@react-pdf/renderer";
import { C, F, PAGE, u } from "./theme";
import { subtituloModo, type Modo } from "../../utils/reporteEscuela";
import type { ReporteEscuela } from "../../api/reportes";

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function PaginaPortada({ data, modo, salaId, assets }: { data: ReporteEscuela; modo: Modo; salaId: number | null; assets: { logo: string } }) {
  const salas = salaId === null ? data.salas : data.salas.filter((s) => s.sala_id === salaId);
  const chicos = new Set<string>();
  for (const s of salas) for (const r of [s.inicial, s.cierre]) r?.estudiantes.forEach((e) => chicos.add(e.estudiante_id));
  const salasTxt = salaId !== null || salas.length === 1
    ? salas[0]?.sala ?? (salaId !== null ? `Sala de ${salaId}` : "Sin salas evaluadas")
    : `Salas de ${salas.map((s) => s.sala_id).join(", ").replace(/, ([^,]*)$/, " y $1")}`;
  return (
    <Page size="A4" style={{ ...PAGE, fontFamily: F.body, fontSize: u(1.1), color: C.ink, flexDirection: "column" }}>
      <View style={{ position: "absolute", top: 0, right: u(7), width: u(24), height: u(30) }}>
        <View style={{ position: "absolute", left: 0, top: 0, width: u(8), height: u(20), backgroundColor: C.verdeClaro }} />
        <View style={{ position: "absolute", left: u(6), top: u(4), width: u(16), height: u(23), backgroundColor: C.azul }} />
      </View>
      <View style={{ marginTop: u(26.4), maxWidth: u(40) }}>
        <Text style={{ fontFamily: F.display, fontWeight: 700, fontSize: u(1), letterSpacing: 1.4, textTransform: "uppercase", color: C.azul, marginBottom: u(1.4) }}>
          Fundación PADI · Devolución institucional
        </Text>
        <Text style={{ fontFamily: F.display, fontWeight: 800, fontSize: u(5.6), textTransform: "uppercase", color: C.titulo, lineHeight: 1 }}>
          Resultados{"\n"}Prueba PADI
        </Text>
        <Text style={{ fontWeight: 700, fontStyle: "italic", fontSize: u(2), textTransform: "uppercase", color: C.azul, marginTop: u(1.2) }}>
          {subtituloModo(modo, data.periodo)}
        </Text>
        <Text style={{ fontWeight: 600, fontSize: u(2.4), marginTop: u(3) }}>{data.escuela.nombre}</Text>
        <Text style={{ fontSize: u(1.05), color: C.secundario, marginTop: u(1), lineHeight: 1.5 }}>
          {salasTxt}{data.turno ? ` · turno ${data.turno}` : ""} · {chicos.size} niños y niñas evaluados{"\n"}
          Generado el {fechaLarga(data.generado_en)} desde la plataforma PADI
        </Text>
      </View>
      <View style={{ flexGrow: 1 }} />
      <View style={{ borderTopWidth: 1, borderTopColor: C.grisTile, paddingTop: u(1.4), flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Image src={assets.logo} style={{ height: u(3.4), width: u(10), objectFit: "contain" }} />
        <Text style={{ fontSize: u(0.9), color: C.secundario, maxWidth: u(34), textAlign: "right", lineHeight: 1.4 }}>
          Prueba PADI de detección de riesgos en el desarrollo · áreas sensoriomotora, comunicación y lenguaje, cognitiva y socioemocional
        </Text>
      </View>
    </Page>
  );
}

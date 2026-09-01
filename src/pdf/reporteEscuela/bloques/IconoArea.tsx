import { Svg, Path, Circle, Rect } from "@react-pdf/renderer";
import { C } from "../theme";
import { iconoArea } from "../../../utils/reporteEscuela";
import type { AreaCatalogo } from "../../../api/reportes";

/** Ícono de trazo del área (pelota / globo / bloques / corazón), asignado por `orden` (§7.5). */
export function IconoArea({ area, size, color = C.azul }: { area: AreaCatalogo; size: number; color?: string }) {
  const tipo = iconoArea(area);
  if (!tipo) return null;
  const p = { stroke: color, strokeWidth: 1.9, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {tipo === "pelota" && (<>
        <Circle cx="12" cy="12" r="8" {...p} />
        <Path d="M4.6 9.5c3 2.6 11.8 2.6 14.8 0M4.6 14.5c3-2.6 11.8-2.6 14.8 0" {...p} />
      </>)}
      {tipo === "globo" && <Path d="M4 5h16v10H10l-5 4v-4H4z" {...p} />}
      {tipo === "bloques" && (<>
        <Rect x="3.5" y="13" width="7.5" height="7.5" rx="1" {...p} />
        <Rect x="13" y="13" width="7.5" height="7.5" rx="1" {...p} />
        <Rect x="8.25" y="3.5" width="7.5" height="7.5" rx="1" {...p} />
      </>)}
      {tipo === "corazon" && <Path d="M12 20.5s-8-4.8-8-10.5a4.3 4.3 0 0 1 8-2.2 4.3 4.3 0 0 1 8 2.2c0 5.7-8 10.5-8 10.5z" {...p} />}
    </Svg>
  );
}

import { Box, ButtonBase, Tooltip, Typography } from "@mui/material"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import type { AreaDetalle } from "../../api/evaluaciones"
import { anilloDeArea, type EstadoAnillo } from "../../utils/avance-area"

const COLOR: Record<EstadoAnillo, string> = {
  aprobada: "#2e7d32",
  desaprobada: "#c62828",
  en_progreso: "#1976d2",
  sin_empezar: "#98a2b3",
}
const PISTA = "#eef1f4"

interface Props {
  areas: AreaDetalle[]
  /** Si se pasa, cada anillo es un botón que abre esa área. */
  onAreaClick?: (area: AreaDetalle) => void
  /** Versión chica para la tabla de escritorio: sólo anillos, con el detalle en el tooltip. */
  compacto?: boolean
}

/**
 * Un anillo por área de una evaluación: se llena con el avance de carga y el color dice el estado.
 * La regla de qué se muestra está en `anilloDeArea` (utils/avance-area.ts).
 */
export default function AnillosAreas({ areas, onAreaClick, compacto = false }: Props) {
  if (areas.length === 0) return null
  const lado = compacto ? 30 : 56
  const grosor = compacto ? 4 : 5

  return (
    <Box
      data-testid="anillos-areas"
      sx={
        compacto
          ? { display: "flex", gap: 0.75 }
          : { display: "grid", gridTemplateColumns: `repeat(${areas.length}, minmax(0, 1fr))`, gap: 0.5, textAlign: "center", alignItems: "start" }
      }
    >
      {areas.map((area) => {
        const anillo = anilloDeArea(area)
        const color = COLOR[anillo.estado]
        const detalle = [anillo.centro, anillo.leyenda].filter(Boolean).join(" · ")
        const dibujo = (
          <Box
            sx={{
              width: lado,
              height: lado,
              borderRadius: "50%",
              mx: "auto",
              display: "grid",
              placeItems: "center",
              position: "relative",
              background: `conic-gradient(${color} ${anillo.porcentaje}%, ${PISTA} 0)`,
              "&::before": { content: '""', position: "absolute", inset: `${grosor}px`, borderRadius: "50%", bgcolor: "#fff" },
            }}
          >
            <Box sx={{ position: "relative", display: "grid", placeItems: "center", color }}>
              {anillo.estado === "aprobada" && <CheckRoundedIcon sx={{ fontSize: compacto ? 15 : 24 }} />}
              {anillo.estado === "desaprobada" && <CloseRoundedIcon sx={{ fontSize: compacto ? 15 : 24 }} />}
              {!compacto && anillo.centro && (
                <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 600, color: "text.primary", letterSpacing: "-0.3px", fontVariantNumeric: "tabular-nums" }}>
                  {anillo.centro}
                </Typography>
              )}
            </Box>
          </Box>
        )
        const contenido = (
          <>
            {dibujo}
            {!compacto && (
              <>
                <Typography sx={{ mt: 0.5, fontSize: 10.5, letterSpacing: "-0.3px", lineHeight: 1.2, overflowWrap: "anywhere", hyphens: "auto" }} lang="es">
                  {area.nombre}
                </Typography>
                <Typography sx={{ fontSize: 11, lineHeight: 1.2, fontWeight: 600, color: anillo.estado === "sin_empezar" ? "text.secondary" : color }}>
                  {anillo.leyenda}
                </Typography>
              </>
            )}
          </>
        )
        const etiqueta = `${area.nombre}: ${detalle}`

        return (
          <Tooltip key={area.instanciaId || area.id} title={compacto ? etiqueta : ""} arrow>
            {onAreaClick ? (
              <ButtonBase
                aria-label={`${etiqueta}. Abrir el área`}
                onClick={(ev) => {
                  ev.stopPropagation()
                  onAreaClick(area)
                }}
                sx={{ display: "block", width: compacto ? "auto" : "100%", borderRadius: 2, py: compacto ? 0 : 0.5, minWidth: 0, "&:hover": { bgcolor: "action.hover" }, "&:focus-visible": { outline: "2px solid #375E9E" } }}
              >
                {contenido}
              </ButtonBase>
            ) : (
              <Box aria-label={etiqueta} sx={{ minWidth: 0 }}>{contenido}</Box>
            )}
          </Tooltip>
        )
      })}
    </Box>
  )
}

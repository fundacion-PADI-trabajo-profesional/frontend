import { Box, Tooltip, Typography } from "@mui/material"
import { INSIGNIA_CUD, INSIGNIA_TRATAMIENTO, insigniasDe, type ContextoEvaluador, type Insignia } from "../../utils/datosEvaluador"

function Cuadrito({ insignia, lado }: { insignia: Insignia; lado: number }) {
    return (
        <Box
            component="span"
            sx={{
                width: lado, height: lado, borderRadius: "5px", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                bgcolor: insignia.color, color: "#fff", fontSize: Math.round(lado * 0.6), fontWeight: 700, lineHeight: 1,
            }}
        >
            {insignia.letra}
        </Box>
    )
}

/**
 * Insignias de una letra junto al semáforo: C = tiene CUD, T = en tratamiento (ADR 0020).
 * Sale del dato más reciente respondido en una evaluación; sin dato o "no" no dibuja nada.
 */
export default function InsigniasContexto({ contexto, lado = 18 }: { contexto?: ContextoEvaluador | null; lado?: number }) {
    const insignias = insigniasDe(contexto)
    if (insignias.length === 0) return null
    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
            {insignias.map((insignia) => (
                <Tooltip key={insignia.clave} title={insignia.etiqueta}>
                    <Box component="span" aria-label={insignia.etiqueta} sx={{ display: "inline-flex" }}>
                        <Cuadrito insignia={insignia} lado={lado} />
                    </Box>
                </Tooltip>
            ))}
        </Box>
    )
}

/** Referencia de las letras, para poner una vez por pantalla. */
export function LeyendaInsignias() {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", color: "#666" }}>
            {[INSIGNIA_CUD, INSIGNIA_TRATAMIENTO].map((insignia) => (
                <Box key={insignia.clave} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                    <Cuadrito insignia={insignia} lado={16} />
                    <Typography sx={{ fontSize: 12 }}>{insignia.etiqueta}</Typography>
                </Box>
            ))}
        </Box>
    )
}

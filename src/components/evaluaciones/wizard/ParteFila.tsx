import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { PreguntaBase } from "../../../api/evaluaciones";
import { paletaBotonRespuesta } from "../../../utils/respuestas";
import { alternarRespuesta } from "../../../utils/pautas";

interface Props {
    parte: PreguntaBase;
    /** "6.1", "6.2"… */
    etiqueta: string;
    respuesta: number | null | undefined;
    onResponder: (preguntaId: string, valor: 0 | 1 | null) => void;
}

/** Una parte de una pauta con desglose: consigna, criterio y sus botones Sí/No. Volver a tocar la opción marcada la quita. */
export default function ParteFila({ parte, etiqueta, respuesta, onResponder }: Props) {
    const respondida = respuesta === 0 || respuesta === 1;

    const boton = (valor: 0 | 1, texto: string, Icono: typeof CheckIcon) => {
        const paleta = paletaBotonRespuesta(valor, parte.puntaje_invertido);
        const marcada = respuesta === valor;
        return (
            <Button
                variant="outlined"
                onClick={() => onResponder(parte.id, alternarRespuesta(respuesta, valor))}
                aria-label={`${texto}, parte ${etiqueta}${marcada ? " (marcada, tocar para quitar)" : ""}`}
                aria-pressed={marcada}
                data-valor={valor}
                data-marcada={marcada ? "si" : "no"}
                sx={{
                    minWidth: 72, minHeight: { xs: 46, sm: 44 }, px: 1.75, borderRadius: 2.5, gap: 0.5,
                    textTransform: "none", fontWeight: 700, fontSize: "0.95rem",
                    flex: { xs: 1, sm: "none" },
                    ...(marcada
                        ? { bgcolor: paleta.color, borderColor: paleta.color, color: "#fff", "&:hover": { bgcolor: paleta.color, borderColor: paleta.color } }
                        : { borderColor: "#d1d5db", color: "#374151", "&:hover": { bgcolor: paleta.hoverBg, borderColor: paleta.color } }),
                }}
            >
                <Icono sx={{ fontSize: 18 }} /> {texto}
            </Button>
        );
    };

    return (
        <Box sx={{
            display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1.5,
            p: 2, borderRadius: 3, border: "1.5px solid", borderColor: respondida ? "#e5e7eb" : "#c7d2fe", bgcolor: respondida ? "#fff" : "#fafbff",
        }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "#eef2ff", color: "#3730a3", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {etiqueta}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.4, color: "#111827" }}>{parte.consigna}</Typography>
                    {parte.aprueba_con && (
                        <Typography variant="body2" sx={{ color: "#4b5563", mt: 0.5 }}>Aprueba si: {parte.aprueba_con}</Typography>
                    )}
                    {parte.puntaje_invertido && (
                        <Typography variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.75, px: 1, py: 0.25, borderRadius: 1.5, bgcolor: "#FEF2F2", color: "#991B1B", fontWeight: 700 }}>
                            <WarningAmberIcon sx={{ fontSize: 14 }} /> Aprueba si responde NO
                        </Typography>
                    )}
                    {parte.detalle && (
                        <Typography variant="body2" sx={{ mt: 0.75, color: "#006064", bgcolor: "#e0f7fa", px: 1, py: 0.5, borderRadius: 1 }}>Nota: {parte.detalle}</Typography>
                    )}
                    {parte.materiales && parte.materiales !== "-" && (
                        <Typography variant="body2" sx={{ mt: 0.75, color: "#d97706", display: "flex", alignItems: "center", gap: 0.5 }}>
                            <BuildIcon sx={{ fontSize: 14 }} /> Materiales: {parte.materiales}
                        </Typography>
                    )}
                    {parte.signed_url && (
                        <Box sx={{ mt: 1 }}>
                            <img src={parte.signed_url} alt="Material de la parte" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain" }} />
                        </Box>
                    )}
                </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                {boton(0, "No", CloseIcon)}
                {boton(1, "Sí", CheckIcon)}
            </Box>
        </Box>
    );
}

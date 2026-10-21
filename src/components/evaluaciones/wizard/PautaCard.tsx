import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { paletaBotonRespuesta } from "../../../utils/respuestas";
import { alternarRespuesta, consignaEnPartes, estadoPauta, textosCompartidos, type Pauta, type Respuestas } from "../../../utils/pautas";
import ParteFila from "./ParteFila";

interface Props {
    pauta: Pauta;
    /** Posición de la pauta en el área, desde 0. */
    indice: number;
    total: number;
    respuestas: Respuestas;
    onResponder: (preguntaId: string, valor: 0 | 1 | null) => void;
    onAnterior: () => void;
    onSiguiente: () => void;
}

const AYUDA_QUITAR = "Para quitar una respuesta, tocá de nuevo la opción marcada.";

/** La pantalla de una pauta: cabecera, cuerpo simple o con desglose, y pie de navegación. Sin estado propio. */
export default function PautaCard({ pauta, indice, total, respuestas, onResponder, onAnterior, onSiguiente }: Props) {
    const r = estadoPauta(pauta, respuestas);
    const compartidos = textosCompartidos(pauta);
    const consigna = compartidos.detalle ? consignaEnPartes(compartidos.detalle) : null;
    const esSimple = r.total === 1;
    const esUltima = indice === total - 1;
    const numero = pauta.numero ?? indice + 1;
    const avance = esUltima ? "finalizar" : r.completa ? "siguiente" : "saltar";
    const textoAvance = { finalizar: "Finalizar área", siguiente: "Siguiente pauta", saltar: "Saltar pauta" }[avance];
    const colorBarra = r.completa ? (r.aprobada ? "#16a34a" : "#dc2626") : "#f59e0b";

    const simple = pauta.partes[0];
    const respuestaSimple = respuestas[simple.id];
    const paletaNo = paletaBotonRespuesta(0, simple.puntaje_invertido);
    const paletaSi = paletaBotonRespuesta(1, simple.puntaje_invertido);

    const botonGrande = (valor: 0 | 1, texto: string, Icono: typeof CheckIcon, paleta: { color: string; borderColor: string; hoverBg: string }) => {
        const marcada = respuestaSimple === valor;
        return (
            <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => onResponder(simple.id, alternarRespuesta(respuestaSimple, valor))}
                aria-pressed={marcada}
                data-valor={valor}
                data-marcada={marcada ? "si" : "no"}
                sx={{
                    py: 2, minHeight: 92, borderRadius: 3.5, display: "flex", flexDirection: "column", textTransform: "none", fontWeight: 700, fontSize: "1.05rem",
                    ...(marcada
                        ? { bgcolor: paleta.color, borderColor: paleta.color, color: "#fff", "&:hover": { bgcolor: paleta.color, borderColor: paleta.color } }
                        : { borderColor: paleta.borderColor, color: paleta.color, "&:hover": { bgcolor: paleta.hoverBg, borderColor: paleta.color } }),
                }}
            >
                <Icono sx={{ fontSize: 30, mb: 0.5 }} />
                {texto}
            </Button>
        );
    };

    // overflow visible: el Card de MUI trae overflow:hidden, que anularía el pie sticky en celular
    return (
        <Card sx={{ borderRadius: 4, display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "visible" }}>
            {/* px/pt por separado: con `p` responsive, su media query pisaba el `pb: 0` y dejaba 28px de aire antes de las partes */}
            <CardContent sx={{ px: { xs: 2, sm: 3.5 }, pt: { xs: 2, sm: 3.5 }, pb: 0 }}>
                <Typography variant="caption" sx={{ letterSpacing: ".06em", textTransform: "uppercase", color: "#4b5563", fontWeight: 700 }}>
                    Pauta {numero}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mt: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>{pauta.titulo}</Typography>
                    {!esSimple && (
                        <Chip size="small" label={`Se aprueba con ${r.necesarias} de ${r.total}`} sx={{ fontWeight: 700, color: "#1e40af", bgcolor: "#dbeafe", border: "1.5px solid #93c5fd" }} />
                    )}
                </Box>
                {!esSimple && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1.5 }}>
                        <Box sx={{ flex: 1, height: 6, bgcolor: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${Math.round((r.respondidas / r.total) * 100)}%`, bgcolor: colorBarra, borderRadius: 999, transition: "width .2s" }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {r.respondidas} de {r.total} partes respondidas
                        </Typography>
                    </Box>
                )}
                {consigna && (
                    <Box sx={{ mt: 2, p: { xs: 1.5, sm: 2 }, bgcolor: "#e0f7fa", border: "1px solid #b2ebf2", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#006064", letterSpacing: ".06em", textTransform: "uppercase" }}>Consigna</Typography>
                        <Typography sx={{ mt: 0.5, fontWeight: 600, color: "#004d56", lineHeight: 1.45, whiteSpace: "pre-line" }}>{consigna.principal}</Typography>
                        {consigna.resto && (
                            // <details> nativo: se pliega sin estado propio y el texto largo no tapa las partes
                            <Box component="details" sx={{
                                mt: 1,
                                "& summary": { cursor: "pointer", listStyle: "none", display: "inline-flex", alignItems: "center", gap: 0.25, fontWeight: 700, fontSize: "0.85rem", color: "#006064", minHeight: 32 },
                                "& summary::-webkit-details-marker": { display: "none" },
                                "& summary svg": { transition: "transform .15s" },
                                "&[open] summary svg": { transform: "rotate(180deg)" },
                            }}>
                                <Box component="summary"><ExpandMoreIcon fontSize="small" /> Cómo presentarla (ejemplos)</Box>
                                <Typography variant="body2" sx={{ mt: 0.5, color: "#004d56", lineHeight: 1.55, whiteSpace: "pre-line" }}>{consigna.resto}</Typography>
                            </Box>
                        )}
                    </Box>
                )}
                {compartidos.materiales && (
                    <Typography variant="body2" sx={{ mt: 1.5, color: "#d97706", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <BuildIcon sx={{ fontSize: "1rem" }} /> Materiales: {compartidos.materiales}
                    </Typography>
                )}
            </CardContent>

            {esSimple ? (
                <CardContent sx={{ p: { xs: 2, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 2 }}>
                    {simple.puntaje_invertido && (
                        <Typography sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, alignSelf: "flex-start", px: 2, py: 0.75, borderRadius: 2, fontSize: "0.875rem", fontWeight: 700, bgcolor: "#FEF2F2", color: "#991B1B", border: "1.5px solid #FECACA" }}>
                            <WarningAmberIcon sx={{ fontSize: "1rem" }} /> Aprueba si responde NO
                        </Typography>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.4, color: "#111827" }}>
                        {simple.consigna || simple.titulo || "¿Cumple con el criterio?"}
                    </Typography>
                    {simple.signed_url && (
                        <Box sx={{ textAlign: "center" }}>
                            <img src={simple.signed_url} alt="Material de la pregunta" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8, objectFit: "contain" }} />
                        </Box>
                    )}
                    {simple.aprueba_con && (
                        <Box sx={{ p: 1.5, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
                            <Typography sx={{ fontWeight: 600, color: "#166534", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                                <CheckIcon sx={{ fontSize: "1rem" }} /> Criterio de aprobación: {simple.aprueba_con}
                            </Typography>
                        </Box>
                    )}
                    {simple.detalle && (
                        <Typography variant="body2" sx={{ bgcolor: "#e0f7fa", color: "#006064", p: 1.5, borderRadius: 2 }}>Nota: {simple.detalle}</Typography>
                    )}
                    {simple.materiales && simple.materiales !== "-" && (
                        <Typography variant="body2" sx={{ bgcolor: "#fffbeb", color: "#d97706", p: 1, borderRadius: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <BuildIcon sx={{ fontSize: "1rem" }} /> Materiales: {simple.materiales}
                        </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        {botonGrande(0, "No", HighlightOffIcon, paletaNo)}
                        {botonGrande(1, "Sí", CheckCircleOutlineIcon, paletaSi)}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#6b7280", textAlign: "center" }}>{AYUDA_QUITAR}</Typography>
                </CardContent>
            ) : (
                <CardContent sx={{ p: { xs: 1.5, sm: 3.5 }, pt: { xs: 2, sm: 2.5 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {pauta.partes.map((parte, i) => (
                        <ParteFila key={parte.id} parte={parte} etiqueta={`${numero}.${i + 1}`} respuesta={respuestas[parte.id]} onResponder={onResponder} mostrarDetalle={!compartidos.detalle} mostrarMateriales={!compartidos.materiales} />
                    ))}
                    <Typography variant="caption" sx={{ color: "#6b7280", textAlign: "center" }}>Cada parte se guarda al tocarla. {AYUDA_QUITAR}</Typography>
                </CardContent>
            )}

            <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                px: { xs: 1.5, sm: 3.5 }, py: 2, borderTop: "1px solid #f3f4f6", mt: "auto",
                position: { xs: "sticky", sm: "static" }, bottom: 0, bgcolor: "#fff", borderRadius: "0 0 16px 16px",
            }}>
                <Button
                    variant="text"
                    onClick={onAnterior}
                    disabled={indice === 0}
                    data-anterior="si"
                    startIcon={<ChevronLeftIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#374151", minHeight: 44, flex: { xs: 1, sm: "none" } }}
                >
                    Anterior
                </Button>
                <Button
                    variant={avance === "saltar" ? "outlined" : "contained"}
                    onClick={onSiguiente}
                    data-avance={avance}
                    endIcon={<ChevronRightIcon />}
                    sx={{
                        textTransform: "none", fontWeight: 700, minHeight: 44, borderRadius: 2.5, flex: { xs: 1, sm: "none" },
                        ...(avance === "saltar"
                            ? { borderColor: "#d1d5db", color: "#374151" }
                            : { bgcolor: "#65944F", "&:hover": { bgcolor: "#558040" } }),
                    }}
                >
                    {textoAvance}
                </Button>
            </Box>
        </Card>
    );
}

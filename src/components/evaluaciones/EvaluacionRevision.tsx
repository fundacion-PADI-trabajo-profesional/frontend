import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Paper, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, Alert, Dialog, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getRespuestasParaRevision, type PreguntasResponse } from '../../api/evaluaciones';
import { agruparPautas, estadoPauta, type Respuestas } from '../../utils/pautas';
import BarraRevision from './BarraRevision';

interface Props {
    open: boolean;
    onClose: () => void;
    onCorrect?: () => void;
    evaluacionId: string;
    areaId: string;
    areaNombre: string;
    score: number;
    total: number;
    statusId: string;
}

export default function EvaluacionRevision({ open, onClose, onCorrect, evaluacionId, areaId, areaNombre, score, total, statusId }: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PreguntasResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getRespuestasParaRevision(evaluacionId, areaId)
                .then(setData)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [open, evaluacionId, areaId]);

    const getAnswerText = (preguntaId: string, puntajeInvertido?: boolean) => {
        const respuesta = data?.respuestas.find(r => r.pregunta_id === preguntaId);
        if (respuesta === undefined || respuesta.respuesta === null) return { text: 'No respondida', icon: <CancelIcon color="disabled" />, esCorrecta: false };
        const esCorrecta = puntajeInvertido ? respuesta.respuesta === 0 : respuesta.respuesta === 1;
        const text = respuesta.respuesta === 1 ? 'Sí' : 'No';
        const icon = esCorrecta ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />;
        return { text, icon, esCorrecta };
    };

    // Misma agrupación y misma regla de aprobación que el wizard (src/utils/pautas.ts)
    const pautas = useMemo(() => agruparPautas(data?.preguntas ?? []), [data]);
    const respuestasMapa = useMemo<Respuestas>(() => {
        const mapa: Respuestas = {};
        (data?.respuestas ?? []).forEach((r) => { mapa[r.pregunta_id] = r.respuesta; });
        return mapa;
    }, [data]);

    if (!open) return null;

    // Recalcular aciertos localmente respetando puntaje_invertido
    const aciertosCalculados = pautas.reduce((acc, p) => acc + (estadoPauta(p, respuestasMapa).aprobada ? 1 : 0), 0);
    const totalGrupos = pautas.length || total;
    const scoreEfectivo = data ? aciertosCalculados : score;
    const totalEfectivo = data ? totalGrupos : total;
    const puntajePorcentual = totalEfectivo > 0 ? (scoreEfectivo / totalEfectivo) * 100 : 0;

    return (
        <Dialog fullScreen open={open} onClose={onClose}>
            <BarraRevision areaNombre={areaNombre} onClose={onClose} onCorrect={onCorrect} />

            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Alert severity={statusId === 'A' ? 'success' : statusId === 'D' ? 'error' : 'info'} sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Estado Final: {statusId === 'A' ? 'Aprobada' : statusId === 'D' ? 'Desaprobada' : 'Completada'}
                    </Typography>
                    <Typography variant="body2">
                        Aciertos: {scoreEfectivo} de {totalEfectivo} ({puntajePorcentual.toFixed(1)}%)
                    </Typography>
                </Alert>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Stack spacing={2}>
                        {pautas.map((pauta) => {
                            const r = estadoPauta(pauta, respuestasMapa);
                            const preguntasDelGrupo = pauta.partes;

                            return (
                                <Paper key={pauta.clave} elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
                                    {/* Header del grupo */}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            bgcolor: "#F7F9FC", // suave
                                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 800 }}>
                                                {pauta.titulo}
                                            </Typography>
                                            {r.total > 1 && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Se aprueba con {r.necesarias} de {r.total}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                size="small"
                                                label={`${r.correctas}/${r.total}`}
                                                sx={{
                                                    bgcolor: "#EEF2FF",
                                                    color: "#4A78C2",
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    !r.completa ? "Incompleta" : r.aprobada ? "Pauta aprobada" : "Pauta no aprobada"
                                                }
                                                sx={{
                                                    fontWeight: 700,
                                                    ...(!r.completa
                                                        ? { bgcolor: "#FFF7E6", color: "#B26A00" }  // N pastel
                                                        : r.aprobada
                                                            ? { bgcolor: "#ECF7F0", color: "#4F8A5B" } // A pastel
                                                            : { bgcolor: "#FDEFF0", color: "#C05A63" } // D pastel
                                                    )
                                                }}
                                            />
                                        </Stack>
                                    </Box>

                                    {/* Preguntas del grupo */}
                                    <List disablePadding>
                                        {preguntasDelGrupo.map((p, idx: number) => {
                                            const { text, esCorrecta } = getAnswerText(p.id, p.puntaje_invertido);
                                            return (
                                                <React.Fragment key={p.id}>
                                                    <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.25 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                    {idx + 1}. {p.consigna}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography component="div" variant="body2" color="text.secondary">
                                                                    Grupo de Pregunta: {formatCamelCaseLabel(p.grupopregunta)}
                                                                </Typography>
                                                            }
                                                        />
                                                        <ListItemIcon sx={{ minWidth: 40, alignItems: "center", justifyContent: "center" }}>
                                                            <Chip
                                                                label={text}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    ...(text === "No respondida"
                                                                        ? { bgcolor: "#F1F3F5", color: "#6C757D" }
                                                                        : esCorrecta
                                                                            ? { bgcolor: "#ECF7F0", color: "#4F8A5B" }
                                                                            : { bgcolor: "#FDEFF0", color: "#C05A63" })
                                                                }}
                                                            />
                                                        </ListItemIcon>
                                                    </ListItem>
                                                    <Divider />
                                                </React.Fragment>
                                            );
                                        })}
                                    </List>
                                </Paper>
                            );
                        })}
                    </Stack>

                )}
            </Box>
        </Dialog>
    );
}

//Helper function
const formatCamelCaseLabel = (value?: string) => {
    if (!value) return "-";

    return value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (str) => str.toUpperCase());
};
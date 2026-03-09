import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, IconButton, CircularProgress, Paper, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, Alert, Dialog, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getRespuestasParaRevision, type PreguntasResponse } from '../api/evaluaciones';

interface Props {
    open: boolean;
    onClose: () => void;
    evaluacionId: string;
    areaId: string;
    areaNombre: string;
    score: number;
    total: number;
    statusId: string;
}

export default function EvaluacionRevision({ open, onClose, evaluacionId, areaId, areaNombre, score, total, statusId }: Props) {
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

    const getAnswerText = (preguntaId: string) => {
        const respuesta = data?.respuestas.find(r => r.pregunta_id === preguntaId);
        if (respuesta === undefined || respuesta.respuesta === null) return { text: 'No respondida', icon: <CancelIcon color="disabled" /> };
        if (respuesta.respuesta === 1) return { text: 'Sí', icon: <CheckCircleIcon color="success" /> };
        return { text: 'No', icon: <CancelIcon color="error" /> };
    };

    const getGroupTitleFromQuestions = (preguntas: any[], groupNumber: number) => {
        // Todas las preguntas del grupo comparten el mismo título
        return preguntas?.[0]?.titulo ?? `Grupo ${groupNumber}`;
    };

    // Agrupar preguntas por numero (grupo)
    const grouped = useMemo(() => {
        const preguntas = data?.preguntas ?? [];
        const map = new Map<number, typeof preguntas>();

        for (const p of preguntas) {
            const key = Number(p.numero);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }

        // orden por numero asc
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [data]);

    // Stats por grupo (mayoría: ceil(total/2))
    const getGroupStats = (preguntas: any[]) => {
        const total = preguntas.length;

        let answered = 0;
        let correct = 0;

        for (const p of preguntas) {
            const r = data?.respuestas.find(x => x.pregunta_id === p.id)?.respuesta ?? null;
            if (r !== null && r !== undefined) {
                answered += 1;
                if (r === 1) correct += 1;
            }
        }

        const needed = Math.ceil(total / 2);
        const aprobado = answered === total && correct >= needed;
        const completo = answered === total;

        return { total, answered, correct, needed, aprobado, completo };
    };

    if (!open) return null;

    const puntajePorcentual = (score / total) * 100;

    return (
        <Dialog fullScreen open={open} onClose={onClose}>
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
                    Revisión: {areaNombre}
                </Typography>
            </Box>

            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Alert severity={statusId === 'A' ? 'success' : statusId === 'D' ? 'error' : 'info'} sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Estado Final: {statusId === 'A' ? 'Aprobada' : statusId === 'D' ? 'Desaprobada' : 'Completada'}
                    </Typography>
                    <Typography variant="body2">
                        Aciertos: {score} de {total} ({puntajePorcentual.toFixed(1)}%)
                    </Typography>
                </Alert>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Stack spacing={2}>
                        {grouped.map(([groupNumber, preguntasDelGrupo]) => {
                            const stats = getGroupStats(preguntasDelGrupo);

                            return (
                                <Paper key={groupNumber} elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
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
                                                {getGroupTitleFromQuestions(preguntasDelGrupo, groupNumber)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Se aprueba con {stats.needed}/{stats.total} respuestas “Sí”
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                size="small"
                                                label={`${stats.correct}/${stats.total}`}
                                                sx={{
                                                    bgcolor: "#EEF2FF",
                                                    color: "#4A78C2",
                                                    fontWeight: 700
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    !stats.completo ? "Incompleto" : stats.aprobado ? "Sección aprobada" : "Sección no aprobada"
                                                }
                                                sx={{
                                                    fontWeight: 700,
                                                    ...(!stats.completo
                                                        ? { bgcolor: "#FFF7E6", color: "#B26A00" }  // N pastel
                                                        : stats.aprobado
                                                            ? { bgcolor: "#ECF7F0", color: "#4F8A5B" } // A pastel
                                                            : { bgcolor: "#FDEFF0", color: "#C05A63" } // D pastel
                                                    )
                                                }}
                                            />
                                        </Stack>
                                    </Box>

                                    {/* Preguntas del grupo */}
                                    <List disablePadding>
                                        {preguntasDelGrupo.map((p: any, idx: number) => {
                                            const { text } = getAnswerText(p.id);
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
                                                                    ...(text === "Sí"
                                                                        ? { bgcolor: "#ECF7F0", color: "#4F8A5B" }
                                                                        : text === "No"
                                                                            ? { bgcolor: "#FDEFF0", color: "#C05A63" }
                                                                            : { bgcolor: "#F1F3F5", color: "#6C757D" })
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
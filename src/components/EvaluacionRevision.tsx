// Archivo: src/components/EvaluacionRevision.tsx

import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress, Paper, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, Alert, Dialog } from '@mui/material';
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
                    <List component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                        {data?.preguntas.map((p, index) => {
                            const { text, icon } = getAnswerText(p.id);
                            return (
                                <React.Fragment key={p.id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemText
                                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{index + 1}. {p.consigna}</Typography>}
                                            secondary={
                                                <Typography component="div" variant="body2" color="text.secondary">
                                                    Grupo: {p.grupopregunta} | Material: {p.materiales || '-'}
                                                </Typography>
                                            }
                                        />
                                        <ListItemIcon sx={{ minWidth: 40, alignItems: 'center', justifyContent: 'center' }}>
                                            <Chip label={text} size="small" color={text === 'Sí' ? 'success' : text === 'No' ? 'error' : 'default'} sx={{ mr: 1 }} />
                                        </ListItemIcon>
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Dialog>
    );
}
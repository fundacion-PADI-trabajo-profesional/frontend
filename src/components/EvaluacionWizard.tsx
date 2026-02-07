"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    LinearProgress,
    Dialog,
    Slide,
    Alert
} from "@mui/material"
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import HighlightOffIcon from "@mui/icons-material/HighlightOff"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import React from "react"

import {
    getPreguntasArea,
    enviarRespuestas,
    type PreguntaBase,
    type RespuestaPrevia
} from "../api/evaluaciones"

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
    open: boolean
    onClose: () => void
    evaluacionId: string
    areaId: string
    areaNombre: string
}

type WizardStep = "INTRO" | "QUESTIONS" | "FINISH"

export default function EvaluacionWizard({ open, onClose, evaluacionId, areaId, areaNombre }: Props) {
    const [step, setStep] = useState<WizardStep>("INTRO")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Data
    const [preguntas, setPreguntas] = useState<PreguntaBase[]>([])
    const [respuestas, setRespuestas] = useState<Record<string, number | null>>({})

    // Control del wizard
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // 1. Cargar preguntas al abrir y reanudar el índice
    useEffect(() => {
        if (open && evaluacionId && areaId) {
            setStep("INTRO")
            setLoading(true)
            getPreguntasArea(evaluacionId, areaId)
                .then((data) => {
                    setPreguntas(data.preguntas || [])

                    const map: Record<string, number | null> = {}
                    const respuestasArr = data.respuestas || [];
                    respuestasArr.forEach((r) => {
                        map[r.pregunta_id] = r.respuesta;
                    });
                    setRespuestas(map);

                    // Encontrar el primer índice sin respuesta (para retomar)
                    const allQuestionIds = data.preguntas.map(p => p.id);
                    const unansweredId = allQuestionIds.find(id => map[id] === null || map[id] === undefined);

                    if (unansweredId) {
                        const index = allQuestionIds.indexOf(unansweredId);
                        setCurrentQuestionIndex(index > 0 ? index : 0);
                    } else if (data.preguntas.length > 0 && data.respuestas.length === data.preguntas.length) {
                        // Si todo está respondido, empezar en finish
                        setStep("FINISH");
                    }
                })
                .catch(err => {
                    console.error("Error cargando preguntas:", err);
                    // setStep("FINISH"); // O mostrar error
                })
                .finally(() => setLoading(false))
        }
    }, [open, evaluacionId, areaId])


    // Función de guardado que recibe el ID y el valor exacto a guardar
    const saveAnswersAndAdvance = async (isFinalSave: boolean, nextIndex: number | 'CLOSE', questionId: string, answerValue: number | null) => {
        setSaving(true);

        // 1. Preparar el payload (usando el valor directo)
        const payload = [
            { id: questionId, answer: answerValue }
        ];

        try {
            await enviarRespuestas(evaluacionId, areaId, payload);

            if (nextIndex === 'CLOSE') {
                onClose();
            } else if (nextIndex === preguntas.length) {
                setStep("FINISH");
            } else {
                setCurrentQuestionIndex(nextIndex);
            }

        } catch (e) {
            console.error("Error al guardar la respuesta:", e);
            alert("Fallo al guardar la respuesta. Revisa tu conexión y el estado del servidor.");
        } finally {
            setSaving(false);
        }
    }

    // Guardar respuesta y avanzar
    const handleAnswer = async (value: number) => {
        // 1. Obtener pregunta actual
        const preguntaActual = preguntas[currentQuestionIndex];

        // 2. Actualizar estado local (para reflejar visualmente)
        const newRespuestas = { ...respuestas, [preguntaActual.id]: value };
        setRespuestas(newRespuestas);

        // 3. Determinar si es la última pregunta y el índice siguiente
        const isLastQuestion = currentQuestionIndex === preguntas.length - 1;
        const nextIndex = currentQuestionIndex + 1;

        // 4. Guardar en backend y avanzar usando el valor directo (VALUE)
        await saveAnswersAndAdvance(isLastQuestion, nextIndex, preguntaActual.id, value);
    }

    // Handler para el botón 'Atrás'
    const handleGoBack = () => {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    }


    // Handler para cerrar: asegura que se guarde el progreso actual (si se salió sin responder la última)
    const handleCloseDialog = () => {
        if (!preguntas || preguntas.length === 0) {
            onClose();
            return;
        }

        const preguntaActual = preguntas[currentQuestionIndex];
        if (!preguntaActual) {
            onClose();
            return;
        }

        const answerValue = respuestas[preguntaActual.id] ?? null;
        saveAnswersAndAdvance(false, 'CLOSE', preguntaActual.id, answerValue);
    }


    // --- RENDERS ---

    if (!open) return null
    const preguntaActual = preguntas[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex) / preguntas.length) * 100;

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleCloseDialog} // <- Usamos el handler que guarda
            TransitionComponent={Transition}
        >
            {/* HEADER TIPO APP */}
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                {/* Usamos el handler de cierre que guarda antes de salir */}
                <IconButton edge="start" color="inherit" onClick={handleCloseDialog} aria-label="close" disabled={saving}>
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" component="div">
                    {areaNombre}
                </Typography>
                {step === "QUESTIONS" && (
                    <Button
                        color="inherit"
                        onClick={handleGoBack}
                        disabled={currentQuestionIndex === 0 || saving}
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        Atrás
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ height: '100%', bgcolor: '#f5f5f5', p: 2 }}>

                    {/* VISTA 1: INTRO / DISCLAIMER */}
                    {step === "INTRO" && (
                        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 4, p: 2 }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                    Antes de comenzar
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    Vas a evaluar el área de <strong>{areaNombre}</strong>. Esta sección se cerrará automáticamente al finalizar la última pregunta, actualizando el puntaje y el estado.
                                </Typography>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={() => setStep("QUESTIONS")}
                                    sx={{
                                        bgcolor: '#111827',
                                        color: '#fff',
                                        py: 1.5,
                                        '&:hover': { bgcolor: '#374151' }
                                    }}
                                >
                                    Iniciar Evaluación ({preguntas.length} Preguntas)
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* VISTA 2: PREGUNTAS (WIZARD) */}
                    {step === "QUESTIONS" && preguntas.length > 0 && preguntaActual && (
                        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2, display: 'flex', flexDirection: 'column', height: '80vh' }}>
                            {/* Barra de progreso */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    Pregunta {currentQuestionIndex + 1} de {preguntas.length}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercent}
                                    sx={{ height: 8, borderRadius: 4, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: '#5c7cfa' } }}
                                />
                            </Box>

                            {/* Tarjeta de Pregunta */}
                            <Card sx={{ flex: 1, borderRadius: 4, display: 'flex', flexDirection: 'column', mb: 2 }}>
                                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>

                                    <Box sx={{ mb: 2 }}>
                                        {preguntaActual.tipoPregunta && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    // Estilo condicional basado en el tipo
                                                    bgcolor: preguntaActual.tipoPregunta === 'Evaluable' ? '#DBEAFE' : '#FFFBEB', // Azul o Amarillo claro
                                                    color: preguntaActual.tipoPregunta === 'Evaluable' ? '#2563EB' : '#D97706', // Azul oscuro o Naranja
                                                }}
                                            >
                                                {preguntaActual.tipoPregunta}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Consigna */}
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, lineHeight: 1.4 }}>
                                        {preguntaActual.consigna || preguntaActual.titulo || "¿Cumple con el criterio?"}
                                    </Typography>

                                    {/* Detalle / Criterio de aprobación */}
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Criterio de Aprobación: {preguntaActual.aprueba_con}
                                    </Typography>

                                    {/* --- NUEVO: MOSTRAR DETALLE DE LA PREGUNTA (Ejemplos, Notas) --- */}
                                    {preguntaActual.detalle && (
                                        <Alert severity="info" sx={{ mb: 2, bgcolor: '#e0f7fa', color: '#006064' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                Nota: {preguntaActual.detalle}
                                            </Typography>
                                        </Alert>
                                    )}

                                    {/* --- NUEVO: MOSTRAR MATERIALES --- */}
                                    {preguntaActual.materiales && preguntaActual.materiales !== '-' && (
                                        <Typography variant="body2" sx={{ bgcolor: '#fffbeb', p: 1, borderRadius: 1, color: '#d97706' }}>
                                            🛠️ Materiales: {preguntaActual.materiales}
                                        </Typography>
                                    )}
                                    {/* Si el campo materiales es '-' o null y no se debe mostrar nada, este bloque lo omite. */}


                                </CardContent>

                                {/* Botones de Respuesta */}
                                <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        onClick={() => handleAnswer(0)} // No (0)
                                        disabled={saving}
                                        sx={{
                                            py: 2,
                                            borderColor: '#fee2e2',
                                            color: '#ef4444',
                                            display: 'flex', flexDirection: 'column',
                                            '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' }
                                        }}
                                    >
                                        <HighlightOffIcon sx={{ fontSize: 30, mb: 0.5 }} />
                                        No
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        onClick={() => handleAnswer(1)} // Si (1)
                                        disabled={saving}
                                        sx={{
                                            py: 2,
                                            borderColor: '#dcfce7',
                                            color: '#22c55e',
                                            display: 'flex', flexDirection: 'column',
                                            '&:hover': { bgcolor: '#f0fdf4', borderColor: '#22c55e' }
                                        }}
                                    >
                                        <CheckCircleOutlineIcon sx={{ fontSize: 30, mb: 0.5 }} />
                                        Si
                                    </Button>
                                </Box>
                            </Card>
                            {saving && (
                                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', color: '#5c7cfa' }}>
                                    Guardando progreso... <CircularProgress size={10} color="inherit" />
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* VISTA 3: FINALIZADO */}
                    {step === "FINISH" && (
                        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 8, borderRadius: 4, textAlign: 'center', p: 4 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 60, color: '#22c55e', mb: 2 }} />
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                ¡Área Completada!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                El estado del área **{areaNombre}** ha sido actualizado. El sistema ahora calculará los resultados finales si todas las secciones están completas.
                            </Typography>
                            <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#111827' }}>
                                Volver a la evaluación
                            </Button>
                        </Card>
                    )}
                </Box>
            )}
        </Dialog>
    )
}
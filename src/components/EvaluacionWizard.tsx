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
    onClose: () => void // Se llama al cerrar (X) o terminar
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
    const [respuestas, setRespuestas] = useState<Record<string, number | null>>({}) // Mapa: preguntaId -> 1 (Si), 0 (No), null

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
                    let firstUnansweredIndex = 0;

                    data.respuestas.forEach(r => {
                        map[r.pregunta_id] = r.respuesta;
                        // Si la respuesta es null, es la primera sin responder (para retomar)
                        if (r.respuesta === null) {
                            if (firstUnansweredIndex === 0) {
                                // Solo actualiza si aún está en 0 (la primera pregunta)
                                // En un sistema real, necesitaríamos un orden claro aquí. Usaremos el orden de las preguntas.
                            }
                        }
                    });
                    setRespuestas(map);

                    // Encontrar el primer índice sin respuesta (para retomar)
                    const allQuestionIds = data.preguntas.map(p => p.id);
                    const unansweredId = allQuestionIds.find(id => map[id] === null || map[id] === undefined);

                    if (unansweredId) {
                        const index = allQuestionIds.indexOf(unansweredId);
                        setCurrentQuestionIndex(index > 0 ? index : 0);
                    } else {
                        // Si todo está respondido, empezar desde 0 pero ir al FINISH
                        setCurrentQuestionIndex(0);
                        if (data.preguntas.length > 0 && data.respuestas.length > 0) {
                            // Si la cantidad de respuestas no coincide con el total de preguntas, 
                            // o si la última respuesta fue la última pregunta, esto es complejo. 
                            // Asumiremos que si hay respuestas, se puede empezar la INTRO.
                        }
                    }
                })
                .catch(err => {
                    console.error("Error cargando preguntas:", err);
                    setStep("FINISH"); // Mover al final o mostrar error
                })
                .finally(() => setLoading(false))
        }
    }, [open, evaluacionId, areaId])

    // Lógica de guardado al avanzar o al cerrar (para "En Progreso")
    const saveAnswersAndAdvance = async (isFinalSave: boolean, nextIndex: number | 'CLOSE') => {
        setSaving(true);

        // 1. Preparar el payload de guardado (solo la respuesta actual)
        const preguntaActual = preguntas[currentQuestionIndex];

        const payload = [
            { id: preguntaActual.id, answer: respuestas[preguntaActual.id] }
        ];

        try {
            await enviarRespuestas(evaluacionId, areaId, payload);

            if (nextIndex === 'CLOSE') {
                onClose(); // Cerrar y refrescar la vista padre (EvaluacionDetalle)
            } else if (nextIndex === preguntas.length) {
                setStep("FINISH");
            } else {
                setCurrentQuestionIndex(nextIndex);
            }

        } catch (e) {
            console.error("Error al guardar la respuesta:", e);
            // Si falla, el usuario no debería avanzar para no perder data.
            alert("Fallo al guardar la respuesta. Revisa tu conexión.");
        } finally {
            setSaving(false);
        }
    }

    // Guardar respuesta y avanzar
    const handleAnswer = async (value: number) => {
        // 1. Actualizar estado local
        const preguntaActual = preguntas[currentQuestionIndex]
        const newRespuestas = { ...respuestas, [preguntaActual.id]: value }
        setRespuestas(newRespuestas)

        // 2. Determinar si es la última pregunta
        const isLastQuestion = currentQuestionIndex === preguntas.length - 1;
        const nextIndex = currentQuestionIndex + 1;

        // 3. Guardar en backend y avanzar
        await saveAnswersAndAdvance(isLastQuestion, nextIndex);
    }

    // Handler para el botón 'Atrás'
    const handleGoBack = () => {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    }


    // --- RENDERS ---

    if (!open) return null
    const preguntaActual = preguntas[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex) / preguntas.length) * 100;

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={() => saveAnswersAndAdvance(false, 'CLOSE')} // Guardar al cerrar (En progreso)
            TransitionComponent={Transition}
        >
            {/* HEADER TIPO APP */}
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                {/* Usamos el handler de cierre que guarda antes de salir */}
                <IconButton edge="start" color="inherit" onClick={() => saveAnswersAndAdvance(false, 'CLOSE')} aria-label="close" disabled={saving}>
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

                                {/* Contenido de Disclaimer, Materiales, etc. */}
                                <Box sx={{ bgcolor: '#fffbeb', p: 2, borderRadius: 2, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#D97706' }}>Materiales de Referencia:</Typography>
                                    <Typography variant="body2">{preguntas.length > 0 ? preguntas[0].materiales || 'No especificado' : 'Cargando materiales...'}</Typography>
                                    {/* Mostrar primer material como referencia */}
                                </Box>

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

                                    {/* Consigna */}
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, lineHeight: 1.4 }}>
                                        {preguntaActual.consigna || preguntaActual.titulo || "¿Cumple con el criterio?"}
                                    </Typography>

                                    {/* Detalle / Criterio de aprobación */}
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        **Criterio:** Aprueba con {preguntaActual.aprueba_con}
                                    </Typography>

                                    {preguntaActual.materiales && (
                                        <Typography variant="body2" sx={{ bgcolor: '#fffbeb', p: 1, borderRadius: 1, color: '#d97706' }}>
                                            Material: {preguntaActual.materiales}
                                        </Typography>
                                    )}

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
"use client"

import { useState, useEffect, useRef } from "react"
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
    Alert,
    Tooltip,
    Paper
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
    type PreguntaBase
} from "../../api/evaluaciones"

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement },
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

function SidebarPanel({
    preguntas,
    respuestas,
    currentIndex,
    onJump,
}: {
    preguntas: PreguntaBase[];
    respuestas: Record<string, number | null>;
    currentIndex: number;
    onJump: (idx: number) => void;
}) {
    const answeredCount = preguntas.filter(
        p => respuestas[p.id] === 0 || respuestas[p.id] === 1
    ).length;

    return (
        <Paper elevation={2} sx={{
            width: 168,
            flexShrink: 0,
            p: 1.5,
            borderRadius: 3,
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 16,
            display: { xs: 'none', sm: 'block' }
        }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#374151' }}>
                Respondidas
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#6b7280', fontWeight: 600 }}>
                {answeredCount} / {preguntas.length}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {preguntas.map((p, idx) => {
                    const answer = respuestas[p.id];
                    const isCurrent = idx === currentIndex;
                    const isYes = answer === 1;
                    const isNo = answer === 0;
                    const isAnswered = isYes || isNo;

                    return (
                        <Tooltip
                            key={p.id}
                            title={`P${idx + 1}: ${isYes ? 'Sí ✓' : isNo ? 'No ✗' : 'Sin responder'}`}
                            placement="top"
                        >
                            <Box
                                onClick={() => onJump(idx)}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isAnswered ? '0.85rem' : '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: isCurrent ? '2.5px solid #5c7cfa' : '2px solid transparent',
                                    bgcolor: isYes ? '#dcfce7' : isNo ? '#fee2e2' : '#f3f4f6',
                                    color: isCurrent ? '#5c7cfa' : isYes ? '#16a34a' : isNo ? '#ef4444' : '#9ca3af',
                                    boxShadow: isCurrent ? '0 0 0 2px #c7d2fe' : 'none',
                                    transition: 'all 0.15s',
                                    '&:hover': { opacity: 0.8, transform: 'scale(1.05)' }
                                }}
                            >
                                {isYes ? '✓' : isNo ? '✗' : idx + 1}
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e5e7eb' }}>
                {[
                    { color: '#dcfce7', border: '#16a34a', label: 'Sí' },
                    { color: '#fee2e2', border: '#ef4444', label: 'No' },
                    { color: '#f3f4f6', border: '#9ca3af', label: 'Sin resp.' },
                ].map(item => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, border: `1px solid ${item.border}` }} />
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}

function MobileCircleRow({
    preguntas,
    respuestas,
    currentIndex,
    onJump,
}: {
    preguntas: PreguntaBase[];
    respuestas: Record<string, number | null>;
    currentIndex: number;
    onJump: (idx: number) => void;
}) {
    const currentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [currentIndex]);

    return (
        <Box sx={{ position: 'relative', display: { xs: 'block', sm: 'none' }, mb: 2 }}>
            <Box sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: 0.75,
                pb: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
            }}>
                {preguntas.map((p, idx) => {
                    const answer = respuestas[p.id];
                    const isCurrent = idx === currentIndex;
                    const isYes = answer === 1;
                    const isNo = answer === 0;
                    const isAnswered = isYes || isNo;

                    return (
                        <Box
                            key={p.id}
                            ref={isCurrent ? currentRef : null}
                            onClick={() => onJump(idx)}
                            sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isAnswered ? '0.8rem' : '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: isCurrent ? '2.5px solid #5c7cfa' : '2px solid transparent',
                                bgcolor: isYes ? '#dcfce7' : isNo ? '#fee2e2' : '#f3f4f6',
                                color: isCurrent ? '#5c7cfa' : isYes ? '#16a34a' : isNo ? '#ef4444' : '#9ca3af',
                                boxShadow: isCurrent ? '0 0 0 2px #c7d2fe' : 'none',
                            }}
                        >
                            {isYes ? '✓' : isNo ? '✗' : idx + 1}
                        </Box>
                    );
                })}
            </Box>
            <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, transparent, #f5f5f5)', pointerEvents: 'none' }} />
        </Box>
    );
}

export default function EvaluacionWizard({ open, onClose, evaluacionId, areaId, areaNombre }: Props) {
    const [step, setStep] = useState<WizardStep>("INTRO")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [allPreviouslyAnswered, setAllPreviouslyAnswered] = useState(false)

    const [preguntas, setPreguntas] = useState<PreguntaBase[]>([])
    const [respuestas, setRespuestas] = useState<Record<string, number | null>>({})
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    const materialesNecesarios = Array.from(
        new Set(
            preguntas
                .map((p) => p.materiales)
                .filter((m) => m && m.trim() !== "")
        )
    );

    useEffect(() => {
        if (open && evaluacionId && areaId) {
            setStep("INTRO")
            setAllPreviouslyAnswered(false)
            setLoading(true)
            getPreguntasArea(evaluacionId, areaId)
                .then((data) => {
                    setPreguntas(data.preguntas || [])

                    const map: Record<string, number | null> = {}
                        ; (data.respuestas || []).forEach((r) => {
                            map[r.pregunta_id] = r.respuesta;
                        });
                    setRespuestas(map);

                    const allIds = data.preguntas.map(p => p.id);
                    const firstUnansweredId = allIds.find(id => map[id] !== 0 && map[id] !== 1);

                    if (firstUnansweredId) {
                        const index = allIds.indexOf(firstUnansweredId);
                        setCurrentQuestionIndex(index >= 0 ? index : 0);
                        setAllPreviouslyAnswered(false);
                    } else if (data.preguntas.length > 0) {
                        // Todas respondidas: modo revisión/corrección
                        setCurrentQuestionIndex(0);
                        setAllPreviouslyAnswered(true);
                    } else {
                        setCurrentQuestionIndex(0);
                    }
                })
                .catch(err => console.error("Error cargando preguntas:", err))
                .finally(() => setLoading(false))
        }
    }, [open, evaluacionId, areaId])

    const checkAllAnswered = (r: Record<string, number | null>) =>
        preguntas.every(p => r[p.id] === 0 || r[p.id] === 1);

    const handleAnswer = async (value: number) => {
        const preguntaActual = preguntas[currentQuestionIndex];
        const newRespuestas = { ...respuestas, [preguntaActual.id]: value };
        setRespuestas(newRespuestas);
        setSaving(true);

        try {
            await enviarRespuestas(evaluacionId, areaId, [{ id: preguntaActual.id, answer: value }]);

            const nextIndex = currentQuestionIndex + 1;
            if (nextIndex >= preguntas.length) {
                if (checkAllAnswered(newRespuestas)) {
                    setStep("FINISH");
                } else {
                    const firstUnanswered = preguntas.findIndex(p => newRespuestas[p.id] !== 0 && newRespuestas[p.id] !== 1);
                    setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
                }
            } else {
                setCurrentQuestionIndex(nextIndex);
            }
        } catch (e) {
            console.error("Error al guardar la respuesta:", e);
            alert("Fallo al guardar la respuesta. Revisá tu conexión.");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= preguntas.length) {
            const firstUnanswered = preguntas.findIndex(
                (p, idx) => idx !== currentQuestionIndex && (respuestas[p.id] !== 0 && respuestas[p.id] !== 1)
            );
            if (firstUnanswered >= 0) {
                setCurrentQuestionIndex(firstUnanswered);
            } else if (checkAllAnswered(respuestas)) {
                setStep("FINISH");
            } else {
                setCurrentQuestionIndex(0);
            }
        } else {
            setCurrentQuestionIndex(nextIndex);
        }
    };

    const handleGoBack = () => {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    };

    const handleJumpTo = (idx: number) => {
        setCurrentQuestionIndex(idx);
    };

    if (!open) return null

    const preguntaActual = preguntas[currentQuestionIndex];
    const progressPercent = (currentQuestionIndex / preguntas.length) * 100;
    const unansweredCount = preguntas.filter(p => respuestas[p.id] !== 0 && respuestas[p.id] !== 1).length;

    const introButtonLabel = allPreviouslyAnswered
        ? 'Revisar / Corregir respuestas'
        : unansweredCount < preguntas.length
            ? 'Continuar evaluación'
            : 'Comenzar evaluación';

    return (
        <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
            {/* HEADER */}
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', flexShrink: 0 }}>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close" disabled={saving}>
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6">
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ flex: 1, bgcolor: '#f5f5f5', p: 2, overflow: 'auto' }}>

                    {/* VISTA 1: INTRO */}
                    {step === "INTRO" && (
                        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 4, p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#111827' }}>
                                {allPreviouslyAnswered ? 'Revisar respuestas' : 'Antes de comenzar'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {allPreviouslyAnswered
                                    ? <>El área <strong>{areaNombre}</strong> ya fue completada. Podés revisar y corregir las respuestas.</>
                                    : <>Vas a evaluar el área: <strong>{areaNombre}</strong>. Asegurate de estar en un ambiente tranquilo con el niño/a.</>
                                }
                            </Typography>
                            {!allPreviouslyAnswered && (
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Podés saltear preguntas y volver a ellas más tarde usando el panel de progreso lateral.
                                </Typography>
                            )}

                            {materialesNecesarios.length > 0 && (
                                <Box sx={{ mb: 4, p: 2, bgcolor: '#eef2ff', borderRadius: 2, borderLeft: '4px solid #5c7cfa' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#373a40', mb: 1 }}>
                                        📋 Materiales necesarios para esta sala y área:
                                    </Typography>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#495057' }}>
                                        {materialesNecesarios.map((material, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2">{material}</Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </Box>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={() => setStep("QUESTIONS")}
                                sx={{ bgcolor: '#111827', py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1.1rem' }}
                            >
                                {introButtonLabel}
                            </Button>
                        </Card>
                    )}

                    {/* VISTA 2: PREGUNTAS */}
                    {step === "QUESTIONS" && preguntas.length > 0 && preguntaActual && (
                        <Box sx={{ display: 'flex', gap: 2, maxWidth: 920, mx: 'auto', mt: 2, alignItems: 'flex-start' }}>

                            {/* Área principal de pregunta */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>

                                {/* Barra de progreso */}
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Pregunta {currentQuestionIndex + 1} de {preguntas.length}
                                        </Typography>
                                        {unansweredCount > 0 && (
                                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                                                {unansweredCount} pendiente{unansweredCount !== 1 ? 's' : ''}
                                            </Typography>
                                        )}
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progressPercent}
                                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: '#5c7cfa' } }}
                                    />
                                </Box>

                                {/* Círculos de navegación (solo mobile) */}
                                <MobileCircleRow
                                    preguntas={preguntas}
                                    respuestas={respuestas}
                                    currentIndex={currentQuestionIndex}
                                    onJump={handleJumpTo}
                                />

                                {/* Tarjeta de pregunta */}
                                <Card sx={{ flex: 1, borderRadius: 4, display: 'flex', flexDirection: 'column', mb: 2 }}>
                                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>

                                        {/* <Box sx={{ mb: 2 }}>
                                            {preguntaActual.tipoPregunta && (
                                                <Box component="span" sx={{
                                                    px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700,
                                                    bgcolor: preguntaActual.tipoPregunta === 'Evaluable' ? '#DBEAFE' : '#FFFBEB',
                                                    color: preguntaActual.tipoPregunta === 'Evaluable' ? '#2563EB' : '#D97706',
                                                }}>
                                                    {preguntaActual.tipoPregunta}
                                                </Box>
                                            )}
                                        </Box> */}
                                        <Box sx={{ mb: 3 }}>
                                            {preguntaActual.tipoPregunta && (
                                                <Box component="span" sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.75,
                                                    px: 2,
                                                    py: 0.75,
                                                    borderRadius: 2,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 700,
                                                    letterSpacing: 0.2,
                                                    bgcolor: preguntaActual.tipoPregunta === 'Evaluable' ? '#DBEAFE' : '#FEF3C7',
                                                    color: preguntaActual.tipoPregunta === 'Evaluable' ? '#1D4ED8' : '#B45309',
                                                    border: `1.5px solid ${preguntaActual.tipoPregunta === 'Evaluable' ? '#93C5FD' : '#FCD34D'}`,
                                                }}>
                                                    {preguntaActual.tipoPregunta === 'Evaluable' ? '📋' : '👁️'}
                                                    {preguntaActual.tipoPregunta}
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Indicador de respuesta actual (modo corrección) */}
                                        {(respuestas[preguntaActual.id] === 1 || respuestas[preguntaActual.id] === 0) && (
                                            <Alert
                                                severity={respuestas[preguntaActual.id] === 1 ? "success" : "error"}
                                                sx={{ mb: 2 }}
                                            >
                                                Respuesta actual: <strong>{respuestas[preguntaActual.id] === 1 ? 'Sí' : 'No'}</strong>. Podés cambiarla.
                                            </Alert>
                                        )}

                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, lineHeight: 1.4 }}>
                                            {preguntaActual.consigna || preguntaActual.titulo || "¿Cumple con el criterio?"}
                                        </Typography>

                                        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#166534', fontSize: '0.95rem' }}>
                                                ✓ Criterio de Aprobación: {preguntaActual.aprueba_con}
                                            </Typography>
                                        </Box>

                                        {preguntaActual.detalle && (
                                            <Alert severity="info" sx={{ mb: 2, bgcolor: '#e0f7fa', color: '#006064' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Nota: {preguntaActual.detalle}
                                                </Typography>
                                            </Alert>
                                        )}

                                        {preguntaActual.materiales && preguntaActual.materiales !== '-' && (
                                            <Typography variant="body2" sx={{ fontWeight: 500, bgcolor: '#fffbeb', p: 1, borderRadius: 1, color: '#d97706', fontSize: '0.95rem' }}>
                                                🛠️ Materiales: {preguntaActual.materiales}
                                            </Typography>
                                        )}
                                    </CardContent>

                                    {/* Botones de respuesta + Saltear */}
                                    <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
                                        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="large"
                                                onClick={() => handleAnswer(0)}
                                                disabled={saving}
                                                sx={{
                                                    py: 2, borderColor: '#fee2e2', color: '#ef4444',
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
                                                onClick={() => handleAnswer(1)}
                                                disabled={saving}
                                                sx={{
                                                    py: 2, borderColor: '#dcfce7', color: '#22c55e',
                                                    display: 'flex', flexDirection: 'column',
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#22c55e' }
                                                }}
                                            >
                                                <CheckCircleOutlineIcon sx={{ fontSize: 30, mb: 0.5 }} />
                                                Sí
                                            </Button>
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="text"
                                            onClick={handleSkip}
                                            disabled={saving}
                                            sx={{ color: '#6b7280', textTransform: 'none', fontSize: '0.875rem' }}
                                        >
                                            Siguiente pregunta →
                                        </Button>
                                    </Box>
                                </Card>

                                {saving && (
                                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', color: '#5c7cfa' }}>
                                        Guardando... <CircularProgress size={10} color="inherit" />
                                    </Typography>
                                )}

                                {/* Botón finalizar manual (cuando no quedan pendientes) */}
                                {unansweredCount === 0 && (
                                    <Button
                                        variant="contained"
                                        onClick={() => setStep("FINISH")}
                                        sx={{ mt: 1, bgcolor: '#111827', textTransform: 'none' }}
                                    >
                                        Finalizar evaluación del área
                                    </Button>
                                )}
                            </Box>

                            {/* Panel lateral de progreso */}
                            <SidebarPanel
                                preguntas={preguntas}
                                respuestas={respuestas}
                                currentIndex={currentQuestionIndex}
                                onJump={handleJumpTo}
                            />
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
                                Todas las respuestas del área <strong>{areaNombre}</strong> han sido guardadas. El sistema calculará los resultados finales si todas las secciones están completas.
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Button
                                    variant="contained"
                                    onClick={onClose}
                                    sx={{ bgcolor: '#111827', textTransform: 'none' }}
                                >
                                    Volver a la evaluación
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => { setCurrentQuestionIndex(0); setStep("QUESTIONS"); }}
                                    sx={{ textTransform: 'none', color: '#5c7cfa', borderColor: '#5c7cfa' }}
                                >
                                    Corregir respuestas
                                </Button>
                            </Box>
                        </Card>
                    )}
                </Box>
            )}
        </Dialog>
    )
}

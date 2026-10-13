import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Card, Checkbox, CircularProgress, Dialog, FormControlLabel, IconButton, Slide, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";

import { enviarRespuestas, getPreguntasArea, type PreguntaBase } from "../../api/evaluaciones";
import { agruparPautas, estadoPauta, pautaRecienCompletada, siguientePautaPendiente, type Respuestas } from "../../utils/pautas";
import { crearColaGuardado } from "../../utils/colaGuardado";
import SeguimientoPautas from "./wizard/SeguimientoPautas";
import PautaCard from "./wizard/PautaCard";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
    open: boolean;
    onClose: () => void;
    evaluacionId: string;
    areaId: string;
    areaNombre: string;
}

type WizardStep = "INTRO" | "QUESTIONS" | "FINISH";

const CLAVE_AVANZAR_SOLA = "padi.wizard.avanzarSola";
const DEMORA_AVANCE_MS = 500;

function leerAvanzarSola(): boolean {
    try { return localStorage.getItem(CLAVE_AVANZAR_SOLA) !== "no"; } catch { return true; }
}
function guardarAvanzarSola(valor: boolean) {
    try { localStorage.setItem(CLAVE_AVANZAR_SOLA, valor ? "si" : "no"); } catch { /* sin almacenamiento disponible */ }
}

/** Wizard de evaluación de un área: una pantalla por pauta. */
export default function EvaluacionWizard({ open, onClose, evaluacionId, areaId, areaNombre }: Props) {
    const [step, setStep] = useState<WizardStep>("INTRO");
    const [loading, setLoading] = useState(false);
    const [guardadosPendientes, setGuardadosPendientes] = useState(0);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [preguntas, setPreguntas] = useState<PreguntaBase[]>([]);
    const [respuestas, setRespuestas] = useState<Respuestas>({});
    const [pautaIdx, setPautaIdx] = useState(0);
    const [avanzarSola, setAvanzarSola] = useState<boolean>(leerAvanzarSola);
    const [todasCompletasAlAbrir, setTodasCompletasAlAbrir] = useState(false);

    const pautaIdxRef = useRef(0);
    const avanceRef = useRef<number | null>(null);
    // Copia síncrona de las respuestas: la cola y el avance deciden con el valor más nuevo,
    // sin esperar al próximo render.
    const respuestasRef = useRef<Respuestas>({});
    pautaIdxRef.current = pautaIdx;

    const pautas = useMemo(() => agruparPautas(preguntas), [preguntas]);

    const actualizarRespuestas = (nuevas: Respuestas) => {
        respuestasRef.current = nuevas;
        setRespuestas(nuevas);
    };

    // Guardado por detrás: la pantalla no se bloquea; si un envío falla, se restauran esas partes.
    const cola = useMemo(() => crearColaGuardado({
        enviar: (items) => enviarRespuestas(evaluacionId, areaId, items),
        onCambio: setGuardadosPendientes,
        onError: (fallidos, error) => {
            console.error("Error al guardar respuestas:", error);
            const restauradas: Respuestas = { ...respuestasRef.current };
            fallidos.forEach((f) => { restauradas[f.id] = f.anterior; });
            actualizarRespuestas(restauradas);
            setSaveError("Fallo al guardar la respuesta. Revisá tu conexión.");
        },
    }), [evaluacionId, areaId]);

    const materialesNecesarios = Array.from(new Set(
        preguntas.map((p) => p.materiales).filter((m): m is string => !!m && m.trim() !== "" && m.trim() !== "-"),
    ));

    useEffect(() => {
        if (!(open && evaluacionId && areaId)) return;
        // Se descarta todo lo del área anterior antes de cargar, así una carga fallida no deja
        // preguntas de otra área bajo el nombre de esta.
        if (avanceRef.current !== null) { window.clearTimeout(avanceRef.current); avanceRef.current = null; }
        setStep("INTRO");
        setSaveError(null);
        setPreguntas([]);
        actualizarRespuestas({});
        setPautaIdx(0);
        setTodasCompletasAlAbrir(false);
        setLoading(true);
        getPreguntasArea(evaluacionId, areaId)
            .then((data) => {
                const lista = data.preguntas || [];
                const mapa: Respuestas = {};
                (data.respuestas || []).forEach((r) => { mapa[r.pregunta_id] = r.respuesta; });
                setPreguntas(lista);
                actualizarRespuestas(mapa);
                const primeraPendiente = siguientePautaPendiente(agruparPautas(lista), mapa, -1);
                setPautaIdx(primeraPendiente ?? 0);
                setTodasCompletasAlAbrir(primeraPendiente === null && lista.length > 0);
            })
            .catch((err) => {
                console.error("Error cargando preguntas:", err);
                setSaveError("No se pudieron cargar las preguntas del área. Cerrá y volvé a intentar.");
            })
            .finally(() => setLoading(false));
    }, [open, evaluacionId, areaId]);

    // Cancela un avance programado si el diálogo se cierra o se desmonta.
    useEffect(() => () => { if (avanceRef.current !== null) window.clearTimeout(avanceRef.current); }, []);

    const irDespuesDe = (desde: number, resp: Respuestas) => {
        if (desde < pautas.length - 1) { setPautaIdx(desde + 1); return; }
        const pendiente = siguientePautaPendiente(pautas, resp, desde);
        if (pendiente === null) setStep("FINISH"); else setPautaIdx(pendiente);
    };

    const programarAvance = (desde: number, resp: Respuestas) => {
        if (avanceRef.current !== null) window.clearTimeout(avanceRef.current);
        avanceRef.current = window.setTimeout(() => {
            avanceRef.current = null;
            if (pautaIdxRef.current !== desde) return; // la docente ya se movió
            irDespuesDe(desde, resp);
        }, DEMORA_AVANCE_MS);
    };

    const cancelarAvance = () => {
        if (avanceRef.current !== null) { window.clearTimeout(avanceRef.current); avanceRef.current = null; }
    };

    const responder = (preguntaId: string, valor: 0 | 1 | null) => {
        // Cualquier toque invalida un avance ya programado: si se quita una respuesta antes de
        // que venza, la pauta deja de estar completa y no debe saltar.
        cancelarAvance();
        const antes = respuestasRef.current;
        const anterior = antes[preguntaId] ?? null;
        const nuevas: Respuestas = { ...antes, [preguntaId]: valor };
        const desde = pautaIdx;
        actualizarRespuestas(nuevas);
        setSaveError(null);
        cola.encolar(preguntaId, valor, anterior);
        // La pantalla ya muestra la respuesta: el avance cuenta desde el toque, no desde el servidor,
        // y solo cuando la pauta pasa de incompleta a completa.
        if (avanzarSola && pautaRecienCompletada(pautas[desde], antes, nuevas)) programarAvance(desde, nuevas);
    };

    const cambiarAvanzarSola = (valor: boolean) => { setAvanzarSola(valor); guardarAvanzarSola(valor); };
    const irA = (i: number) => { cancelarAvance(); setPautaIdx(i); };
    const siguiente = () => { if (pautaIdx < pautas.length - 1) irA(pautaIdx + 1); else { cancelarAvance(); setStep("FINISH"); } };
    const anterior = () => irA(Math.max(0, pautaIdx - 1));

    if (!open) return null;

    const pautaActual = pautas[pautaIdx];
    const pendientes = pautas.filter((p) => !estadoPauta(p, respuestas).completa).length;
    const introButtonLabel = todasCompletasAlAbrir ? "Revisar / Corregir respuestas" : pendientes < pautas.length ? "Continuar evaluación" : "Comenzar evaluación";

    const casillaAvanzarSola = (
        <FormControlLabel
            control={<Checkbox checked={avanzarSola} onChange={(e) => cambiarAvanzarSola(e.target.checked)} sx={{ color: "#65944F", "&.Mui-checked": { color: "#65944F" } }} />}
            label={<Typography variant="body2">Avanzar sola al completar la pauta</Typography>}
        />
    );

    return (
        <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
            <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="Cerrar evaluación" disabled={guardadosPendientes > 0}>
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 1, flex: 1, fontWeight: 700 }} variant="h6" noWrap>{areaNombre}</Typography>
                {guardadosPendientes > 0 && (
                    <Typography variant="caption" sx={{ color: "#5c7cfa", display: "flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
                        <CircularProgress size={12} color="inherit" /> Guardando…
                    </Typography>
                )}
                {step === "QUESTIONS" && pautas.length > 0 && (
                    <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 600, whiteSpace: "nowrap", ml: 1 }}>
                        Pauta {pautaActual?.numero ?? pautaIdx + 1} de {pautas.length}
                    </Typography>
                )}
            </Box>

            {saveError && (
                <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mx: 2, mt: 1 }}>{saveError}</Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ flex: 1, bgcolor: "#f5f5f5", p: { xs: 1.5, sm: 2 }, overflow: "auto" }}>

                    {step === "INTRO" && (
                        <Card sx={{ maxWidth: 600, mx: "auto", mt: 4, borderRadius: 4, p: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "#111827" }}>
                                {todasCompletasAlAbrir ? "Revisar respuestas" : "Antes de comenzar"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {todasCompletasAlAbrir
                                    ? <>El área <strong>{areaNombre}</strong> ya fue completada. Podés revisar y corregir las respuestas.</>
                                    : <>Vas a evaluar el área: <strong>{areaNombre}</strong>. Asegurate de estar en un ambiente tranquilo con el niño/a.</>}
                            </Typography>
                            {!todasCompletasAlAbrir && (
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Cada pantalla es una pauta. Las que tienen varias partes se responden todas en la misma pantalla. Podés saltear pautas y volver con los círculos del seguimiento.
                                </Typography>
                            )}
                            {materialesNecesarios.length > 0 && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#eef2ff", borderRadius: 2, borderLeft: "4px solid #5c7cfa" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#373a40", mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <AssignmentIcon sx={{ fontSize: "1rem" }} /> Materiales necesarios para esta sala y área:
                                    </Typography>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: "#495057" }}>
                                        {materialesNecesarios.map((m) => <li key={m}><Typography variant="body2">{m}</Typography></li>)}
                                    </ul>
                                </Box>
                            )}
                            <Box sx={{ mb: 2 }}>{casillaAvanzarSola}</Box>
                            <Button fullWidth variant="contained" size="large" onClick={() => setStep("QUESTIONS")} disabled={pautas.length === 0}
                                sx={{ bgcolor: "#111827", py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.1rem" }}>
                                {introButtonLabel}
                            </Button>
                        </Card>
                    )}

                    {step === "QUESTIONS" && pautaActual && (
                        <Box sx={{ display: "flex", gap: 3, maxWidth: 1040, mx: "auto", alignItems: "flex-start" }}>
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                                <SeguimientoPautas variante="panel" pautas={pautas} respuestas={respuestas} actual={pautaIdx} onIr={irA} />
                                <Box sx={{ mt: 1.5, px: 0.5 }}>{casillaAvanzarSola}</Box>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <SeguimientoPautas variante="fila" pautas={pautas} respuestas={respuestas} actual={pautaIdx} onIr={irA} />
                                <PautaCard
                                    pauta={pautaActual}
                                    indice={pautaIdx}
                                    total={pautas.length}
                                    respuestas={respuestas}
                                    onResponder={responder}
                                    onAnterior={anterior}
                                    onSiguiente={siguiente}
                                />
                            </Box>
                        </Box>
                    )}

                    {step === "FINISH" && (
                        <Card sx={{ maxWidth: 600, mx: "auto", mt: 8, borderRadius: 4, textAlign: "center", p: 4 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 60, color: pendientes === 0 ? "#22c55e" : "#f59e0b", mb: 2 }} />
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                {pendientes === 0 ? "¡Área completada!" : "Área sin terminar"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                {pendientes === 0
                                    ? <>Todas las pautas de <strong>{areaNombre}</strong> quedaron respondidas.</>
                                    : <>Quedan <strong>{pendientes}</strong> pauta{pendientes !== 1 ? "s" : ""} sin completar en <strong>{areaNombre}</strong>. Podés terminar ahora o seguir más tarde.</>}
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {pendientes > 0 && (
                                    <Button variant="outlined" size="large" onClick={() => { const i = siguientePautaPendiente(pautas, respuestas, -1); if (i !== null) { irA(i); setStep("QUESTIONS"); } }}
                                        sx={{ textTransform: "none", borderRadius: 2, borderColor: "#65944F", color: "#65944F" }}>
                                        Ir a la primera pendiente
                                    </Button>
                                )}
                                <Button variant="outlined" size="large" onClick={() => { irA(0); setStep("QUESTIONS"); }}
                                    sx={{ textTransform: "none", borderRadius: 2, borderColor: "#5c7cfa", color: "#5c7cfa" }}>
                                    Revisar respuestas
                                </Button>
                                <Button variant="contained" size="large" onClick={onClose} disabled={guardadosPendientes > 0} sx={{ bgcolor: "#111827", borderRadius: 2, textTransform: "none" }}>
                                    {guardadosPendientes > 0 ? "Guardando…" : "Cerrar"}
                                </Button>
                            </Box>
                        </Card>
                    )}
                </Box>
            )}
        </Dialog>
    );
}

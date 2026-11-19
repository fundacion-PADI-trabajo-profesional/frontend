import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Checkbox, Dialog, FormControlLabel, IconButton, Slide, TextField, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";

import { guardarDatosEvaluador, type EvaluacionInstancia } from "../../api/evaluaciones";
import {
    DATOS_EVALUADOR_VACIOS,
    ETIQUETA_SESIONES,
    MAX_OBSERVACIONES,
    RANGOS_SESIONES,
    preguntaSesiones,
    type DatosEvaluador,
} from "../../utils/datosEvaluador";

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
    tipoId: string;
    datos?: DatosEvaluador;
    /** Alumno dado de baja: se ve pero no se edita. */
    soloLectura?: boolean;
    onGuardado: (evaluacion: EvaluacionInstancia) => void;
}

const AZUL = "#375E9E";
const VIOLETA = "#6d28d9";

/** Botón de opción única: se marca y, si se vuelve a tocar, se desmarca (vuelve a "sin responder"). */
function Opcion({ etiqueta, marcada, onClick, disabled }: { etiqueta: string; marcada: boolean; onClick: () => void; disabled?: boolean }) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            aria-pressed={marcada}
            variant="outlined"
            sx={{
                flex: 1,
                py: 1.25,
                borderRadius: 2.5,
                borderWidth: "1.5px",
                textTransform: "none",
                fontWeight: marcada ? 700 : 500,
                fontSize: "0.95rem",
                lineHeight: 1.2,
                color: marcada ? AZUL : "#111827",
                borderColor: marcada ? AZUL : "#d1d5db",
                bgcolor: marcada ? "#eef3fb" : "#fff",
                "&:hover": { borderWidth: "1.5px", borderColor: AZUL, bgcolor: marcada ? "#eef3fb" : "#fafafa" },
                "&.Mui-disabled": { color: marcada ? AZUL : "#9ca3af", borderColor: marcada ? AZUL : "#e5e7eb" },
            }}
        >
            {etiqueta}
        </Button>
    );
}

function Pregunta({ titulo, ayuda, children }: { titulo: React.ReactNode; ayuda?: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 3.5 }}>
            <Typography sx={{ fontWeight: 700, color: "#111827" }}>{titulo}</Typography>
            {ayuda && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{ayuda}</Typography>}
            <Box sx={{ mt: 1 }}>{children}</Box>
        </Box>
    );
}

/**
 * Sección "Preguntas para el evaluador" de una evaluación (ADR 0020): todo en una pantalla.
 * Nada es obligatorio y no cambia el puntaje ni el semáforo.
 */
export default function PreguntasEvaluador({ open, onClose, evaluacionId, tipoId, datos, soloLectura = false, onGuardado }: Props) {
    const [form, setForm] = useState<DatosEvaluador>(DATOS_EVALUADOR_VACIOS);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cada vez que se abre, arranca de lo guardado (descarta lo que se haya tocado sin guardar).
    useEffect(() => {
        if (!open) return;
        setForm(datos ?? DATOS_EVALUADOR_VACIOS);
        setError(null);
    }, [open, datos]);

    const conSesiones = preguntaSesiones(tipoId);
    const observaciones = form.observaciones ?? "";

    const guardar = async () => {
        setGuardando(true);
        setError(null);
        try {
            const actualizada = await guardarDatosEvaluador(evaluacionId, {
                sesionesCompletadas: conSesiones ? form.sesionesCompletadas : null,
                enTratamiento: form.enTratamiento,
                // La casilla sin marcar es un "no": al guardar la sección queda respondida.
                tieneCud: form.tieneCud === true,
                observaciones: observaciones.trim() === "" ? null : observaciones.trim(),
            });
            onGuardado(actualizada);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "No se pudieron guardar los datos. Revisá tu conexión.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Dialog fullScreen open={open} onClose={guardando ? undefined : onClose} TransitionComponent={Transition}>
            <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="Cerrar preguntas para el evaluador" disabled={guardando}>
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 1, flex: 1, fontWeight: 700 }} variant="h6" noWrap>Preguntas para el evaluador</Typography>
            </Box>

            <Box sx={{ flex: 1, bgcolor: "#f5f5f5", p: { xs: 1.5, sm: 2 }, overflow: "auto" }}>
                <Card sx={{ maxWidth: 600, mx: "auto", mt: { xs: 1, sm: 4 }, borderRadius: 4, p: { xs: 2.5, sm: 4 }, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                    {soloLectura && (
                        <Alert severity="warning" sx={{ mb: 3 }}>Este estudiante fue dado de baja. Los datos son de solo lectura.</Alert>
                    )}

                    {conSesiones && (
                        <Pregunta
                            titulo="¿Cuántas sesiones tiene completadas al momento de la reevaluación?"
                            ayuda="Sesiones de intervención desde la evaluación inicial."
                        >
                            <Box sx={{ display: "flex", gap: 1 }}>
                                {RANGOS_SESIONES.map((rango) => (
                                    <Opcion
                                        key={rango}
                                        etiqueta={ETIQUETA_SESIONES[rango]}
                                        marcada={form.sesionesCompletadas === rango}
                                        disabled={soloLectura || guardando}
                                        onClick={() => setForm((f) => ({ ...f, sesionesCompletadas: f.sesionesCompletadas === rango ? null : rango }))}
                                    />
                                ))}
                            </Box>
                        </Pregunta>
                    )}

                    <Pregunta titulo="¿El niño/a está en tratamiento?" ayuda="Fonoaudiología, psicopedagogía, terapia ocupacional u otro.">
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {([[true, "Sí"], [false, "No"]] as const).map(([valor, etiqueta]) => (
                                <Opcion
                                    key={etiqueta}
                                    etiqueta={etiqueta}
                                    marcada={form.enTratamiento === valor}
                                    disabled={soloLectura || guardando}
                                    onClick={() => setForm((f) => ({ ...f, enTratamiento: f.enTratamiento === valor ? null : valor }))}
                                />
                            ))}
                        </Box>
                        <FormControlLabel
                            sx={{
                                mt: 1.5, mx: 0, width: "100%", px: 0.5, py: 0.25, borderRadius: 2.5,
                                border: "1.5px solid", borderColor: form.tieneCud ? VIOLETA : "#d1d5db",
                                bgcolor: form.tieneCud ? "#ede9fe" : "#fff",
                            }}
                            control={
                                <Checkbox
                                    checked={form.tieneCud === true}
                                    disabled={soloLectura || guardando}
                                    onChange={(e) => setForm((f) => ({ ...f, tieneCud: e.target.checked }))}
                                    sx={{ "&.Mui-checked": { color: VIOLETA } }}
                                />
                            }
                            label={
                                <Typography sx={{ fontWeight: form.tieneCud ? 700 : 500, color: form.tieneCud ? VIOLETA : "#111827" }}>
                                    Tiene CUD{" "}
                                    <Box component="span" sx={{ fontWeight: 400, color: "#666" }}>(Certificado Único de Discapacidad)</Box>
                                </Typography>
                            }
                        />
                    </Pregunta>

                    <Pregunta
                        titulo={<>Observaciones <Box component="span" sx={{ fontWeight: 400, color: "#666" }}>(opcional)</Box></>}
                        ayuda="Algo que hayas notado durante la evaluación y valga la pena dejar registrado."
                    >
                        <TextField
                            multiline
                            minRows={4}
                            fullWidth
                            value={observaciones}
                            disabled={soloLectura || guardando}
                            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                            placeholder="Ej.: se distrae con el ruido del patio; respondió mejor cuando trabajamos a solas."
                            inputProps={{ maxLength: MAX_OBSERVACIONES, "aria-label": "Observaciones" }}
                            helperText={`${observaciones.length} / ${MAX_OBSERVACIONES}`}
                            FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }}
                        />
                    </Pregunta>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {soloLectura ? (
                        <Button fullWidth variant="contained" size="large" onClick={onClose}
                            sx={{ bgcolor: "#111827", py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.1rem" }}>
                            Cerrar
                        </Button>
                    ) : (
                        <Button fullWidth variant="contained" size="large" onClick={guardar} disabled={guardando}
                            sx={{ bgcolor: "#111827", py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.1rem" }}>
                            {guardando ? "Guardando…" : "Guardar"}
                        </Button>
                    )}
                </Card>
            </Box>
        </Dialog>
    );
}

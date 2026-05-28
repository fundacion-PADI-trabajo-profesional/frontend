import { useState, useEffect } from "react";
import {
    Box, Button, Typography, CircularProgress, Alert, Paper,
    List, ListItem, ListItemText, Stack, Tooltip, TextField, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import {
    asignarEstudianteAula, desasignarEstudianteAula, type Aula
} from "../../api/aulas";

import { getEstudiantes, type Estudiante } from "../../api/estudiantes";

interface Props {
    aula: Aula;
    onVolver: () => void;
    escuelaNombreProp?: string;
}

export default function EstudiantesAulaView({ aula, onVolver, escuelaNombreProp }: Props) {
    const navigate = useNavigate();

    const [todosLosEstudiantes, setTodosLosEstudiantes] = useState<Estudiante[]>([]);
    const [selectedEstudianteId, setSelectedEstudianteId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [estudianteAQuitar, setEstudianteAQuitar] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    const getEstadoColor = (estado?: string | null) => {
        if (estado === "A") return "#2e7d32";
        if (estado === "E") return "#f9a825";
        if (estado === "D") return "#d32f2f";
        return "transparent";
    };

    const getEstadoLabel = (estado?: string | null) => {
        if (estado === "A") return "Aprobada";
        if (estado === "E") return "En progreso";
        if (estado === "D") return "Desaprobada";
        return "Sin evaluación";
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const todos = await getEstudiantes();
            setTodosLosEstudiantes(todos);
        } catch (e: any) {
            setError(e.message || "Error al cargar los estudiantes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aula) fetchData();
    }, [aula]);

    const estudiantesAula = todosLosEstudiantes.filter(
        (e) => e.aula_asignada?.id === aula.id || e.aula_id === aula.id
    );

    const estudiantesDisponibles = todosLosEstudiantes.filter((e) => {
        const mismaEscuela = e.escuela?.escuela_id === aula.escuela_id;
        const mismaSala = e.sala_id === aula.sala_id;
        const noEstaEnEstaAula = e.aula_asignada?.id !== aula.id && e.aula_id !== aula.id;

        return mismaEscuela && mismaSala && noEstaEnEstaAula;
    });

    const handleAsignar = async () => {
        if (!selectedEstudianteId) return;
        try {
            await asignarEstudianteAula(aula.id, selectedEstudianteId);
            setSelectedEstudianteId("");
            setSnackbar({ open: true, message: "Estudiante asignado correctamente", severity: "success" });
            fetchData();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || "Error al asignar estudiante", severity: "error" });
        }
    };

    const pedirConfirmacionDesasignar = (estudianteId: string) => {
        setEstudianteAQuitar(estudianteId);
        setConfirmOpen(true);
    };

    const confirmarDesasignar = async () => {
        if (!estudianteAQuitar) return;
        setConfirmOpen(false);

        try {
            await desasignarEstudianteAula(aula.id, estudianteAQuitar);
            setSnackbar({ open: true, message: "Estudiante quitado de la comisión", severity: "success" });
            fetchData();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || "Error al quitar estudiante", severity: "error" });
        } finally {
            setEstudianteAQuitar(null);
        }
    };

    const aulaLabel = `${aula.sala?.nombre || `Sala ${aula.sala_id}`} - ${aula.comision} (${aula.turno})`;
    const escuelaNombreFinal = escuelaNombreProp || "Escuela asignada";

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ mb: 2, textTransform: "none", color: "#5c7cfa" }}>
                Volver a comisiones
            </Button>

            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {aulaLabel}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                Seleccioná un estudiante para ver su historial o evaluarlo.
            </Typography>

            <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, maxWidth: 600, alignItems: "center", borderRadius: 2 }}>
                <TextField
                    select fullWidth size="small"
                    label="Agregar estudiante a esta comisión"
                    value={selectedEstudianteId}
                    onChange={(e) => setSelectedEstudianteId(e.target.value)}
                >
                    {estudiantesDisponibles.length > 0 ? (
                        estudiantesDisponibles.map((e) => (
                            <MenuItem key={e.id} value={e.id}>
                                {e.personas?.primer_apellido}, {e.personas?.nombre} - DNI: {e.personas?.dni}
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No hay más estudiantes disponibles</MenuItem>
                    )}
                </TextField>
                <Button
                    variant="contained"
                    disabled={!selectedEstudianteId}
                    onClick={handleAsignar}
                    sx={{ textTransform: "none", bgcolor: "#000", fontWeight: 600, whiteSpace: "nowrap", "&:hover": { bgcolor: "#333" } }}
                >
                    Asignar
                </Button>
            </Paper>

            {estudiantesAula.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Esta comisión todavía no tiene alumnos asignados.
                </Alert>
            ) : (
                <Paper elevation={0} sx={{ border: "1px solid #eee", borderRadius: 3 }}>
                    <List disablePadding>
                        {estudiantesAula.map((est, index) => {
                            const nombreCompleto = `${est.personas?.primer_apellido ?? ""}, ${est.personas?.nombre ?? ""}`.trim();
                            const navParams = new URLSearchParams({
                                estudianteId: est.id,
                                nombre: nombreCompleto,
                                salaId: String(aula.sala_id),
                                aulaId: aula.id,
                                aulaLabel: aulaLabel,
                                escuelaNombre: escuelaNombreFinal,
                                backTo: `/aulas?aulaId=${aula.id}`,
                                backLabel: "Volver a la comisión",
                            });

                            return (
                                <ListItem
                                    key={est.id}
                                    divider={index < estudiantesAula.length - 1}
                                    sx={{ py: 2 }}
                                    secondaryAction={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Tooltip title={`Inicial: ${getEstadoLabel(est.evaluaciones_resumen?.inicial)}`}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #bdbdbd", bgcolor: getEstadoColor(est.evaluaciones_resumen?.inicial) }} />
                                            </Tooltip>
                                            <Tooltip title={`Cierre: ${getEstadoLabel(est.evaluaciones_resumen?.cierre)}`}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #bdbdbd", bgcolor: getEstadoColor(est.evaluaciones_resumen?.cierre), mr: 2 }} />
                                            </Tooltip>

                                            <Button
                                                size="small" variant="outlined"
                                                sx={{ textTransform: "none", color: "#1976d2", borderColor: "#1976d2" }}
                                                onClick={() => navigate(`/evaluaciones?${navParams.toString()}`)}
                                            >
                                                Evaluar
                                            </Button>
                                            <Button
                                                size="small" variant="outlined"
                                                sx={{ textTransform: "none", color: "#444", borderColor: "#ccc" }}
                                                onClick={() => navigate(`/historial-estudiante?${navParams.toString()}`)}
                                            >
                                                Historial
                                            </Button>
                                            <Button
                                                size="small" color="error"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => pedirConfirmacionDesasignar(est.id)} // Llama a la funcion visual
                                            >
                                                Quitar
                                            </Button>
                                        </Stack>
                                    }
                                >
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 600 }}>{nombreCompleto}</Typography>}
                                        secondary={`DNI: ${est.personas?.dni ?? "-"}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </Paper>
            )}

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Quitar estudiante</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro que querés quitar a este estudiante de la comisión? Podés volver a agregarlo en cualquier momento.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#666', textTransform: 'none' }}>Cancelar</Button>
                    <Button onClick={confirmarDesasignar} color="error" variant="contained" sx={{ textTransform: 'none', borderRadius: 2 }}>Sí, quitar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Box>
    );
}
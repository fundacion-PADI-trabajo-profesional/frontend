import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
    Typography, Select, MenuItem, FormControl, InputLabel, Box,
    Snackbar, Alert // <--- 1. Importamos Snackbar y Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Escuela, asignarDocente, desasignarDocente } from "../api/escuelas";
import { getDocentes } from "../api/docentes";

interface Props {
    open: boolean;
    onClose: () => void;
    escuela: Escuela | null;
    onUpdate: () => void;
}

export default function AsignarDocentesModal({ open, onClose, escuela, onUpdate }: Props) {
    const [allDocentes, setAllDocentes] = useState<any[]>([]);
    const [selectedDocente, setSelectedDocente] = useState("");
    const [loading, setLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error"
    });

    useEffect(() => {
        if (open) {
            cargarDocentes();
            setSelectedDocente("");
        }
    }, [open]);

    const cargarDocentes = async () => {
        try {
            const data = await getDocentes();
            setAllDocentes(data);
        } catch (error) {
            console.error("Error al cargar docentes", error);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (!escuela) return null;

    const docentesDisponibles = allDocentes.filter(d =>
        !escuela.profesores?.some((p: any) => p.id === d.id)
    );

    const handleAsignar = async () => {
        if (!selectedDocente) return;
        setLoading(true);
        try {
            await asignarDocente(escuela.id, selectedDocente);
            onUpdate();
            setSelectedDocente("");

            setSnackbar({ open: true, message: "Docente asignado correctamente", severity: "success" });
            onClose();

        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: "Error al asignar docente", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDesasignar = async (profesorId: string) => {
        if (!confirm("¿Quitar a este docente de la escuela?")) return;
        setLoading(true);
        try {
            await desasignarDocente(escuela.id, profesorId);
            onUpdate();

            setSnackbar({ open: true, message: "Docente eliminado correctamente", severity: "success" });
            onClose();

        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: "Error al eliminar docente", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>
                    Gestionar Docentes
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        component="span"
                        sx={{ display: 'block', mt: 0.5 }}
                    >
                        Escuela: {escuela.nombre}
                    </Typography>
                </DialogTitle>

                <DialogContent dividers>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>Docentes Asignados:</Typography>

                    {(!escuela.profesores || escuela.profesores.length === 0) ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                            No hay docentes asignados a esta escuela.
                        </Typography>
                    ) : (
                        <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 2, mb: 3 }}>
                            {escuela.profesores.map((profe: any) => (
                                <ListItem key={profe.id} divider>
                                    <ListItemText
                                        primary={`${profe.personas?.nombre || 'S/N'} ${profe.personas?.primer_apellido || ''}`}
                                        secondary="Docente"
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" color="error" onClick={() => handleDesasignar(profe.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Seleccionar Docente para agregar</InputLabel>
                            <Select
                                value={selectedDocente}
                                label="Seleccionar Docente para agregar"
                                onChange={(e) => setSelectedDocente(e.target.value)}
                            >
                                {docentesDisponibles.map((docente) => (
                                    <MenuItem key={docente.id} value={docente.id}>
                                        {docente.personas?.nombre || "Sin Nombre"} {docente.personas?.primer_apellido || ""}
                                    </MenuItem>
                                ))}
                                {docentesDisponibles.length === 0 && (
                                    <MenuItem disabled>No hay más docentes disponibles</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={handleAsignar}
                            disabled={!selectedDocente || loading}
                            startIcon={<PersonAddIcon />}
                            sx={{ bgcolor: '#000', color: '#fff', '&:hover': { bgcolor: '#333' } }}
                        >
                            Asignar
                        </Button>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
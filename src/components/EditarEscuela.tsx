import { useState, useEffect } from "react";
import {
    Box, TextField, Button, Grid, Paper, Typography, MenuItem,
    Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
    Snackbar, Alert, CircularProgress, Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { updateEscuela, deleteEscuela, asignarDocente, desasignarDocente, Escuela } from "../api/escuelas";
import { getZonas, Zona } from "../api/zonas";
import { getDocentes, Docente } from "../api/docentes";

interface Props {
    escuela: Escuela;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function EditarEscuela({ escuela, onCancel, onSuccess }: Props) {
    const [formData, setFormData] = useState({
        nombre: escuela.nombre || "",
        direccion: escuela.direccion || "",
        telefono: escuela.telefono || "",
        zona_id: escuela.zona?.id || ""
    });

    const [zonas, setZonas] = useState<Zona[]>([]);
    const [docentesDisponibles, setDocentesDisponibles] = useState<Docente[]>([]);
    const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("padiUser") || "{}");
        setUserRole(user.rol);
        loadZonas();
        loadDocentesDisponibles();
    }, []);

    const loadZonas = async () => {
        const data = await getZonas();
        setZonas(data);
    };

    const loadDocentesDisponibles = async () => {
        try {
            const data = await getDocentes(); // Trae todos los docentes del sistema
            setDocentesDisponibles(data);
        } catch (err) { console.error("Error cargando docentes"); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateEscuela(escuela.id, formData);
            setNotification({ open: true, message: "¡Institución actualizada!", severity: "success" });
            setTimeout(() => onSuccess(), 1000);
        } catch (err: any) {
            setNotification({ open: true, message: "Error al actualizar", severity: "error" });
        } finally { setLoading(false); }
    };

    const handleAsignar = async () => {
        if (!docenteSeleccionado) return;
        try {
            await asignarDocente(escuela.id, docenteSeleccionado);
            setNotification({ open: true, message: "Docente asignado", severity: "success" });
            onSuccess(); // Recarga para ver el cambio en la lista
        } catch (err) { setNotification({ open: true, message: "Error al asignar", severity: "error" }); }
    };

    const handleDesasignar = async (profesorId: string) => {
        if (!window.confirm("¿Quitar a este docente de la escuela?")) return;
        try {
            await desasignarDocente(escuela.id, profesorId);
            onSuccess();
        } catch (err) { setNotification({ open: true, message: "Error al desasignar", severity: "error" }); }
    };

    const handleDelete = async () => {
        if (window.confirm("¿ELIMINAR ESCUELA? Los alumnos quedarán sin institución.")) {
            try {
                await deleteEscuela(escuela.id);
                onSuccess();
            } catch (err) { setNotification({ open: true, message: "Error al eliminar", severity: "error" }); }
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Editar Institución</Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Nombre" value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Zona" value={formData.zona_id}
                            onChange={(e) => setFormData({ ...formData, zona_id: e.target.value })}>
                            {zonas.map(z => <MenuItem key={z.id} value={z.id}>{z.nombre}</MenuItem>)}
                        </TextField>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* GESTIÓN DE DOCENTES */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Cuerpo Docente</Typography>

                {/* Lista de asignados */}
                <List sx={{ mb: 2, bgcolor: '#fcfcfc', borderRadius: 2 }}>
                    {escuela.profesores?.map((prof: any) => (
                        <ListItem key={prof.id} divider>
                            <ListItemText
                                primary={`${prof.personas?.nombre} ${prof.personas?.primer_apellido}`}
                                secondary="Docente activo"
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" color="error" onClick={() => handleDesasignar(prof.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>

                {/* Buscador/Asignador */}
                <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: 2 }}>
                    <TextField select fullWidth size="small" label="Seleccionar Docente"
                        value={docenteSeleccionado} onChange={(e) => setDocenteSeleccionado(e.target.value)}>
                        {docentesDisponibles.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                                {/* Los datos ya vienen transformados desde el backend */}
                                {d.nombre && d.apellido ? `${d.nombre} ${d.apellido}` : "Docente sin datos"}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleAsignar} sx={{ bgcolor: '#673AB7' }}>
                        ASIGNAR
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
                    <Box>
                        {userRole === "equipo_padi" && ( // FIX PUNTO 3: Solo PADI ve esto
                            <Button variant="text" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                                ELIMINAR ESCUELA
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onCancel} variant="outlined">CANCELAR</Button>
                        <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#000', px: 4 }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : "GUARDAR CAMBIOS"}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Snackbar open={notification.open} autoHideDuration={3000}
                onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}
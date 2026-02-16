import { useState, useEffect } from "react";
import {
    Box, TextField, Button, Grid, Paper, Typography, MenuItem,
    Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
    Snackbar, Alert, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { updateEscuela, deleteEscuela, Escuela, asignarDirectivo, desasignarDirectivo, getDirectivosDisponibles } from "../api/escuelas";
import { getZonas, Zona } from "../api/zonas";
import { Directivo } from "../api/directivos";

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
    const [directivosDisponibles, setDirectivosDisponibles] = useState<Directivo[]>([]);
    const [directivoSeleccionado, setDirectivoSeleccionado] = useState("");
    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: () => { } });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("padiUser") || "{}");
        setUserRole(user.rol);
        loadZonas();
        loadDirectivosDisponibles();
    }, []);

    const loadZonas = async () => {
        const data = await getZonas();
        setZonas(data);
    };

    const loadDirectivosDisponibles = async () => {
        try {
            const data = await getDirectivosDisponibles(); // Solo directivos sin escuela asignada
            setDirectivosDisponibles(data);
        } catch (err) { console.error("Error cargando directivos"); }
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

    const handleAsignarDirectivo = async () => {
        const id = directivoSeleccionado;
        if (!id) return;

        try {
            await asignarDirectivo(escuela.id, id);
            setNotification({ open: true, message: "Directivo asignado", severity: "success" });
            onSuccess();
        } catch (err) {
            setNotification({ open: true, message: "Error al asignar", severity: "error" });
        }
    };

    const handleDesasignarDirectivo = async (usuarioId: string) => {
        setConfirmDialog({
            open: true,
            title: "Confirmar desasignación",
            message: "¿Está seguro de quitar a este directivo de la escuela?",
            onConfirm: async () => {
                try {
                    await desasignarDirectivo(usuarioId);
                    onSuccess();
                } catch (err) {
                    setNotification({ open: true, message: "Error al desasignar", severity: "error" });
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const handleDelete = async () => {
        setConfirmDialog({
            open: true,
            title: "⚠️ ELIMINAR ESCUELA",
            message: "Esta acción eliminará permanentemente la escuela y liberará automáticamente:\n\n• Todos los estudiantes (quedarán sin escuela asignada)\n• Todos los directivos (quedarán disponibles para otras escuelas)\n• Todos los docentes (quedarán disponibles para otras escuelas)\n\n¿Está completamente seguro de continuar?",
            onConfirm: async () => {
                try {
                    await deleteEscuela(escuela.id);
                    setNotification({
                        open: true,
                        message: "Escuela eliminada correctamente. Todos los vínculos han sido liberados.",
                        severity: "success"
                    });
                    setTimeout(() => onSuccess(), 2000);
                } catch (err: any) {
                    setNotification({
                        open: true,
                        message: err.message || "Error al eliminar la escuela",
                        severity: "error"
                    });
                }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
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
                    <Grid item xs={12}>
                        <TextField fullWidth label="Dirección" value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* CUERPO DIRECTIVO */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Cuerpo Directivo</Typography>
                <List sx={{ mb: 2, bgcolor: '#fcfcfc', borderRadius: 2 }}>
                    {escuela.directivos?.map((dir: any) => (
                        <ListItem key={dir.id} divider>
                            <ListItemText
                                primary={`${dir.nombre} ${dir.apellido}`}
                                secondary="Director asignado"
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" color="error" onClick={() => handleDesasignarDirectivo(dir.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: 2, mb: 4 }}>
                    <TextField select fullWidth size="small" label="Seleccionar Directivo"
                        value={directivoSeleccionado} onChange={(e) => setDirectivoSeleccionado(e.target.value)}>
                        {directivosDisponibles.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                                {`${d.nombre} ${d.apellido}`}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<PersonAddIcon />}
                        onClick={handleAsignarDirectivo} sx={{ borderColor: '#375E9E', color: '#375E9E' }}>
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
                        <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#5fb878', color: '#fff', px: 4, '&:hover': { bgcolor: '#000' } }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : "GUARDAR CAMBIOS"}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Dialog de confirmación */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 600 }}>
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        id="confirm-dialog-description"
                        sx={{ whiteSpace: 'pre-line' }}
                    >
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                        variant="outlined"
                        sx={{ mr: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmDialog.onConfirm}
                        variant="contained"
                        color="error"
                        sx={{ fontWeight: 600 }}
                        autoFocus
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={3000}
                onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}
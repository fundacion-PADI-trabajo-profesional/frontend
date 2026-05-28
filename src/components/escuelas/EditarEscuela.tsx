import { useState, useEffect } from "react";
import {
    Box, TextField, Button, Grid, Paper, Typography, MenuItem,
    Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
    Snackbar, Alert, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { updateEscuela, deleteEscuela, Escuela, asignarDirectivo, desasignarDirectivo, getDirectivosDisponibles, NIVELES_SOCIOECONOMICOS } from "../../api/escuelas";
import { getZonas, Zona } from "../../api/zonas";
import { Directivo } from "../../api/directivos";

interface Props {
    escuela: Escuela;
    onCancel: () => void;
    onSuccess: () => void;
}

interface DirectivoActual {
    id: string;
    nombre: string;
    apellido: string;
}

export default function EditarEscuela({ escuela, onCancel, onSuccess }: Props) {
    const [formData, setFormData] = useState({
        nombre: escuela.nombre || "",
        direccion: escuela.direccion || "",
        telefono: escuela.telefono || "",
        zona_id: escuela.zona?.id || "",
        nivel_socioeconomico: escuela.nivel_socioeconomico || "sin_definir"
    });

    const [zonas, setZonas] = useState<Zona[]>([]);
    const [directivosDisponibles, setDirectivosDisponibles] = useState<Directivo[]>([]);
    const [directivoSeleccionado, setDirectivoSeleccionado] = useState("");
    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // Estado local de directivos: refleja cambios pendientes sin llamar a la API
    const [directivosActuales, setDirectivosActuales] = useState<DirectivoActual[]>(
        escuela.directivos?.map(d => ({ id: d.id, nombre: d.nombre, apellido: d.apellido })) || []
    );
    const [toAssign, setToAssign] = useState<string[]>([]);
    const [toUnassign, setToUnassign] = useState<string[]>([]);

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
            const data = await getDirectivosDisponibles();
            setDirectivosDisponibles(data);
        } catch (err) { console.error("Error cargando directivos"); }
    };

    const handleAgregarDirectivo = () => {
        if (!directivoSeleccionado) return;
        const dir = directivosDisponibles.find(d => d.id === directivoSeleccionado);
        if (!dir) return;

        setDirectivosActuales(prev => [...prev, { id: dir.id, nombre: dir.nombre, apellido: dir.apellido }]);
        setToAssign(prev => [...prev, dir.id]);
        setDirectivoSeleccionado("");
    };

    const handleQuitarDirectivo = (usuarioId: string) => {
        setDirectivosActuales(prev => prev.filter(d => d.id !== usuarioId));
        if (toAssign.includes(usuarioId)) {
            // Fue agregado en esta sesión, solo lo sacamos de la cola
            setToAssign(prev => prev.filter(id => id !== usuarioId));
        } else {
            // Estaba asignado originalmente, hay que desasignarlo al guardar
            setToUnassign(prev => [...prev, usuarioId]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateEscuela(escuela.id, formData);

            for (const id of toAssign) {
                await asignarDirectivo(escuela.id, id);
            }
            for (const id of toUnassign) {
                await desasignarDirectivo(id);
            }

            setNotification({ open: true, message: "¡Institución actualizada!", severity: "success" });
            setTimeout(() => onSuccess(), 1000);
        } catch (err: any) {
            setNotification({ open: true, message: "Error al actualizar", severity: "error" });
        } finally { setLoading(false); }
    };

    const handleDelete = async () => {
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
        setConfirmDeleteOpen(false);
    };

    // Excluir de la lista desplegable los directivos que ya están asignados
    const directivosParaSeleccionar = directivosDisponibles.filter(
        d => !directivosActuales.some(actual => actual.id === d.id)
    );

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
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Dirección" value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="Nivel Socioeconómico"
                            value={formData.nivel_socioeconomico}
                            onChange={(e) => setFormData({ ...formData, nivel_socioeconomico: e.target.value })}>
                            {NIVELES_SOCIOECONOMICOS.map((n) => (
                                <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Cuerpo Directivo</Typography>
                <List sx={{ mb: 2, bgcolor: '#fcfcfc', borderRadius: 2 }}>
                    {directivosActuales.length === 0 ? (
                        <ListItem>
                            <ListItemText secondary="Sin directivos asignados" />
                        </ListItem>
                    ) : directivosActuales.map((dir) => (
                        <ListItem key={dir.id} divider>
                            <ListItemText
                                primary={`${dir.nombre} ${dir.apellido}`}
                                secondary="Director asignado"
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" color="error" onClick={() => handleQuitarDirectivo(dir.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: 2, mb: 4 }}>
                    <TextField select fullWidth size="small" label="Seleccionar Directivo"
                        value={directivoSeleccionado} onChange={(e) => setDirectivoSeleccionado(e.target.value)}>
                        {directivosParaSeleccionar.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                                {`${d.nombre} ${d.apellido}`}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<PersonAddIcon />}
                        onClick={handleAgregarDirectivo} sx={{ borderColor: '#375E9E', color: '#375E9E' }}>
                        AGREGAR
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
                    <Box>
                        {userRole === "equipo_padi" && (
                            <Button variant="text" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>
                                DESVINCULAR ESCUELA
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

            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                <DialogTitle sx={{ fontWeight: 600 }}>⚠️ DESVINCULAR ESCUELA</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
                        {"La escuela quedará inactiva y desaparecerá de la gestión, pero sus datos históricos se conservan para métricas.\n\nSe liberarán automáticamente:\n• Todos los estudiantes (quedarán sin escuela asignada)\n• Todos los directivos (quedarán disponibles para otras escuelas)\n• Todos los docentes (quedarán disponibles para otras escuelas)\n\nEn los reportes comparativos figurará como \"(Desvinculada)\".\n\n¿Está seguro de continuar?"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setConfirmDeleteOpen(false)} variant="outlined" sx={{ mr: 1 }}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ fontWeight: 600 }} autoFocus>
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

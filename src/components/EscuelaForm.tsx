import { useState, useEffect } from "react"; // Agregamos useEffect
import { Box, TextField, Button, Grid, Paper, Typography, MenuItem, CircularProgress, Alert } from "@mui/material";
import { createEscuela, CreateEscuelaDto } from "../api/escuelas";
import { getZonas, Zona } from "../api/zonas";

interface Props {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function EscuelaForm({ onCancel, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loadingZonas, setLoadingZonas] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState("");

    //    useEffect(() => {
    //        const storedUser = localStorage.getItem("padiUser");
    //        if (storedUser) {
    //            const parsed = JSON.parse(storedUser);
    //            console.log("Rol detectado en formulario:", parsed.rol); // Para depurar
    //            setUserRole(parsed.rol);
    //        } else {
    //            // Fallback por si acaso
    //            setUserRole(localStorage.getItem("userRole") || "");
    //        }
    //    }, []);

    const [formData, setFormData] = useState({
        nombre: "",
        direccion: "",
        telefono: "",
        zona_id: ""
    });

    useEffect(() => {
        const loadInitialData = async () => {
            const storedUser = localStorage.getItem("padiUser");
            if (storedUser) setUserRole(JSON.parse(storedUser).rol);

            try {
                const data = await getZonas(); // Traemos las zonas reales
                setZonas(data);
            } catch (err) {
                setError("No se pudieron cargar las zonas de la base de datos.");
            } finally {
                setLoadingZonas(false);
            }
        };
        loadInitialData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createEscuela(formData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Error al crear la escuela.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                Registrar Nueva Escuela
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Nombre de la Escuela"
                            name="nombre"
                            fullWidth
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Mostrar campo Zona SOLO si es Equipo PADI */}
                    {userRole === "equipo_padi" && (
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Seleccionar Zona Real"
                                name="zona_id"
                                fullWidth
                                required
                                value={formData.zona_id}
                                onChange={handleChange}
                                disabled={loadingZonas}
                            >
                                {loadingZonas ? (
                                    <MenuItem disabled>Cargando zonas...</MenuItem>
                                ) : (
                                    zonas.map((z) => (
                                        <MenuItem key={z.id} value={z.id}>{z.nombre}</MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Dirección"
                            name="direccion"
                            fullWidth
                            value={formData.direccion}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Teléfono"
                            name="telefono"
                            fullWidth
                            value={formData.telefono}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                    <Button onClick={onCancel} disabled={loading} sx={{ color: '#666' }}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Guardar Escuela"}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
}
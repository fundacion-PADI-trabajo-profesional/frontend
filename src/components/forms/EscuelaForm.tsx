import { useState, useEffect } from "react";
import { Box, TextField, Button, Grid, Typography, MenuItem, CircularProgress, Alert, Divider, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import { createEscuela, NIVELES_SOCIOECONOMICOS } from "../../api/escuelas";
import { getZonas, Zona } from "../../api/zonas";
import { getCurrentEncargado } from "../../api/encargados-zona";

interface Props {
    onCancel: () => void;
    onSuccess: () => void;
    defaultZonaId?: string;
}

export default function EscuelaForm({ onCancel, onSuccess, defaultZonaId }: Props) {
    const [loading, setLoading] = useState(false);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loadingZonas, setLoadingZonas] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
        direccion: "",
        telefono: "",
        zona_id: defaultZonaId || "",
        nivel_socioeconomico: "sin_definir"
    });

    useEffect(() => {
        const loadInitialData = async () => {
            const storedUser = localStorage.getItem("padiUser");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUserRole(parsedUser.rol);

                if (defaultZonaId) {
                    setFormData(prev => ({ ...prev, zona_id: defaultZonaId }));
                }

                if (parsedUser.rol === "encargado_zona") {
                    // Para encargados de zona, obtener su zona asignada
                    try {
                        const encargadoData = await getCurrentEncargado(parsedUser.id);

                        if (!encargadoData.zona) {
                            setError("No tienes una zona asignada. Contacta al administrador para poder crear escuelas.");
                            setLoadingZonas(false);
                            return;
                        }

                        // Establecer la zona del encargado como default y única opción
                        setZonas([encargadoData.zona]);
                        setFormData(prev => ({ ...prev, zona_id: encargadoData.zona!.id }));
                        setLoadingZonas(false);
                    } catch (err: any) {
                        setError("Error al obtener tu información de zona: " + err.message);
                        setLoadingZonas(false);
                    }
                } else if (parsedUser.rol === "equipo_padi") {
                    // Para equipo PADI, cargar todas las zonas
                    try {
                        const data = await getZonas();
                        setZonas(data);
                    } catch (err) {
                        setError("No se pudieron cargar las zonas de la base de datos.");
                    } finally {
                        setLoadingZonas(false);
                    }
                } else {
                    setLoadingZonas(false);
                }
            }
        };
        loadInitialData();
    }, [defaultZonaId]);

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
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2 }}>
                <SchoolIcon sx={{ color: '#65944F' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Registrar Nueva Escuela
                </Typography>
                <IconButton onClick={onCancel} sx={{ ml: 'auto' }} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider />

            <Box sx={{ p: 3 }}>
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

                        {/* Mostrar campo Zona para equipo_padi y encargado_zona */}
                        {(userRole === "equipo_padi" || userRole === "encargado_zona") && (
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="Seleccionar Zona"
                                    name="zona_id"
                                    fullWidth
                                    required
                                    value={formData.zona_id}
                                    onChange={handleChange}
                                    disabled={loadingZonas || userRole === "encargado_zona"} // Disabled para encargado
                                    helperText={userRole === "encargado_zona" ? "Tu zona asignada" : ""}
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Nivel Socioeconómico"
                                name="nivel_socioeconomico"
                                fullWidth
                                value={formData.nivel_socioeconomico}
                                onChange={handleChange}
                            >
                                {NIVELES_SOCIOECONOMICOS.map((n) => (
                                    <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none', color: '#666' }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                            sx={{
                                bgcolor: '#65944F',
                                textTransform: 'none',
                                borderRadius: 2,
                                '&:hover': { bgcolor: '#558040' },
                            }}
                        >
                            {loading ? 'Guardando...' : 'Guardar Escuela'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
}
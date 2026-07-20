import { useEffect, useState } from "react";
import { Box, TextField, Button, Grid, Alert, Typography, MenuItem, CircularProgress } from "@mui/material";
import { Encargado} from "../../api/encargados-zona";
import { getZonas, type Zona } from "../../api/zonas";

interface Props {
    onSubmit: (data: { nombre: string; apellido: string; email: string; zona_id: string; password: string }) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    initialValues?: Encargado | null;
}

export default function EncargadoForm({ onSubmit, onCancel, loading, initialValues }: Props) {
    const [formData, setFormData] = useState({
        nombre: initialValues?.nombre || "",
        apellido: initialValues?.apellido || "",
        email: initialValues?.email || "",
        zona_id: initialValues?.zona?.id || "",
    });

    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loadingZonas, setLoadingZonas] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadZonas = async () => {
            try {
                const data = await getZonas();
                setZonas(data);
            } catch {
                setError("No se pudieron cargar las zonas.");
            } finally {
                setLoadingZonas(false);
            }
        };
        loadZonas();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.nombre || !formData.apellido || !formData.email || !formData.zona_id) {
            setError("Todos los campos son obligatorios");
            return;
        }

        try {
            // Enviamos los datos. La password la va a generar el backend.
            // Pasamos un string vacío o random en el front solo para cumplir con el DTO si es necesario, 
            // pero lo ideal es que el DTO del front ya no pida password.
            await onSubmit({ ...formData, password: "" });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ocurrió un error al procesar la solicitud");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                {initialValues
                    ? "Modifica los datos del encargado. Los cambios impactarán en su perfil de acceso."
                    : "Al crear el encargado, se le enviará automáticamente un email con sus credenciales de acceso."}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth label="Nombre" name="nombre"
                        value={formData.nombre} onChange={handleChange}
                        disabled={loading} required
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth label="Apellido" name="apellido"
                        value={formData.apellido} onChange={handleChange}
                        disabled={loading} required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth label="Email" name="email" type="email"
                        value={formData.email} onChange={handleChange}
                        disabled={loading || !!initialValues} // no editarlo si ya existe
                        required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        select
                        fullWidth
                        label="Zona Asignada"
                        name="zona_id"
                        value={formData.zona_id}
                        onChange={handleChange}
                        disabled={loading || loadingZonas}
                        required
                        helperText={loadingZonas ? "Cargando zonas disponibles..." : "Selecciona la región a cargo"}
                    >
                        {zonas.map((zona) => (
                            <MenuItem key={zona.id} value={zona.id}>
                                {zona.nombre}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ bgcolor: "#212121", "&:hover": { bgcolor: "#000" }, px: 4 }}
                    disabled={loading || loadingZonas}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (initialValues ? "Guardar Cambios" : "Crear e Invitar")}
                </Button>
            </Box>
        </Box>
    );
}
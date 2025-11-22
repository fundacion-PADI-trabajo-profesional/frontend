import { useState } from "react";
import { Box, TextField, Button, Grid, Alert, Typography } from "@mui/material";
import { type CreateEncargadoDto } from "../api/encargados-zona";

interface Props {
    onSubmit: (data: CreateEncargadoDto) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function EncargadoForm({ onSubmit, onCancel, loading }: Props) {
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        zona: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.nombre || !formData.apellido || !formData.email || !formData.zona) {
            setError("Todos los campos son obligatorios");
            return;
        }

        try {
            // Enviamos los datos. La password la va a generar el backend.
            // Pasamos un string vacío o random en el front solo para cumplir con el DTO si es necesario, 
            // pero lo ideal es que el DTO del front ya no pida password.
            await onSubmit({ ...formData, password: "" });
        } catch (err: any) {
            setError(err.message || "Ocurrió un error");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Al crear el encargado, se le enviará automáticamente un email con sus credenciales de acceso.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth label="Nombre" name="nombre"
                        value={formData.nombre} onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth label="Apellido" name="apellido"
                        value={formData.apellido} onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth label="Email" name="email" type="email"
                        value={formData.email} onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        placeholder="Zona Asignada"
                        name="zona"
                        value={formData.zona}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                <Button onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ bgcolor: "#212121", "&:hover": { bgcolor: "#000" } }} // Estilo botón negro como tu imagen
                    disabled={loading}
                >
                    {loading ? "Enviando..." : "Crear e Invitar Encargado"}
                </Button>
            </Box>
        </Box>
    );
}
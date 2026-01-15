import { useState } from "react";
import { TextField, Button, Box, CircularProgress } from "@mui/material";

interface ZonaFormProps {
    onSubmit: (data: { nombre: string }) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function ZonaForm({ onSubmit, onCancel, loading }: ZonaFormProps) {
    const [nombre, setNombre] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setError("El nombre es obligatorio");
            return;
        }
        try {
            await onSubmit({ nombre });
        } catch (err: any) {
            setError(err.message || "Error al crear la zona");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
                fullWidth
                label="Nombre de la Zona (Ej: Norte, Sur, Este)"
                value={nombre}
                onChange={(e) => {
                    setNombre(e.target.value);
                    setError("");
                }}
                error={!!error}
                helperText={error}
                disabled={loading}
                sx={{ mb: 3 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ bgcolor: "#A3BE54", '&:hover': { bgcolor: "#8da548" } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Crear Zona"}
                </Button>
            </Box>
        </Box>
    );
}
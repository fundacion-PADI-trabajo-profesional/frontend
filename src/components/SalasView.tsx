import { useState, useEffect } from "react";
import { 
    Box, Button, Typography, CircularProgress, Alert, Grid, Paper, CardActionArea 
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { getSalas, type Sala } from "../api/estudiantes";

interface Props {
    escuelaId: string;
    escuelaNombre?: string;
    onVolver: () => void;
    onVerAulas: (sala: Sala) => void;
}

export default function SalasView({ escuelaId, escuelaNombre, onVolver, onVerAulas }: Props) {
    const [salas, setSalas] = useState<Sala[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSalas = async () => {
            setLoading(true);
            try {
                const data = await getSalas();
                const salasOrdenadas = data.sort((a, b) => (a.grado || 0) - (b.grado || 0));
                setSalas(salasOrdenadas);
            } catch (e: any) {
                setError("Error al cargar las salas.");
            } finally {
                setLoading(false);
            }
        };

        if (escuelaId) fetchSalas();
    }, [escuelaId]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ mb: 1, textTransform: "none", color: "#5c7cfa" }}>
                    Volver a escuelas
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {escuelaNombre}
                </Typography>
                <Typography variant="body1" sx={{ color: "#666", mt: 1 }}>
                    Seleccioná un nivel/sala para ver sus comisiones.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {salas.map((sala) => (
                    <Grid item xs={12} sm={6} md={4} key={sala.id}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                border: "1px solid #e0e0e0", 
                                borderRadius: 3, 
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                                "&:hover": { 
                                    borderColor: "#5c7cfa", 
                                    boxShadow: "0 4px 12px rgba(92, 124, 250, 0.15)",
                                    transform: "translateY(-2px)"
                                } 
                            }}
                        >
                            <CardActionArea onClick={() => onVerAulas(sala)} sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box sx={{ 
                                        bgcolor: "#eaeffd", 
                                        p: 1.5, 
                                        borderRadius: 2, 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center" 
                                    }}>
                                        <FolderOpenIcon sx={{ color: "#5c7cfa" }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                                            {sala.nombre || `Sala ${sala.id}`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardActionArea>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}